from pathlib import Path
import json
import tomllib

from .schemas_utils import read_and_validate, plugin_schema, algorithm_schema
from ..schemas import PluginMeta, AlgorithmMeta
from ..models import PluginModel, AlgorithmModel, WidgetModel, InputBlockModel, TemplateModel, PluginComponentModel
from .database import SessionLocal
from .syntax_checker import validate_python_script
from .logging import logger
from .filestore import delete_all_plugins as fs_delete_all_plugins, delete_plugin as fs_delete_plugin, save_plugin as fs_save_plugin
from sqlalchemy import exists, select, func


class PluginStoreException(Exception):
    pass


class PluginStore:

    stock_plugin_folder = Path(__file__).parent.parent.parent.parent.joinpath("stock-plugins")
    plugin_meta_filename = "plugin.meta.json"

    def __init__(self, gid) -> None:
        self.gid = gid
        # self.plugin_path = get_plugin_folder(gid)

    @classmethod
    def delete_all_plugins(cls):
        logger.info("Removing all plugins")
        with SessionLocal() as session:
            # stmp = delete(PluginModel)
            session.query(PluginModel).delete()
            session.query(AlgorithmModel).delete()
            session.query(WidgetModel).delete()
            session.query(InputBlockModel).delete()
            session.query(TemplateModel).delete()
            session.query(PluginComponentModel).delete()
            session.commit()
        try:
            fs_delete_all_plugins()
        except:  # ignore fs related errors
            pass

    @classmethod
    def delete_plugin(cls, gid: str):
        logger.info(f"Remove plugin {gid}")
        with SessionLocal() as session:
            stmt = select(PluginModel).filter_by(gid=gid)
            plugin = session.scalar(stmt)
            if plugin is not None:
                session.delete(plugin)
                session.commit()
                try:
                    fs_delete_plugin(gid)
                except:  # ignore fs related errors
                    pass
            else:
                logger.info(f"Plugin {gid} not found")

    @classmethod
    def scan_stock_plugins(cls):
        logger.info(f"Scanning stock plugins in folder {str(cls.stock_plugin_folder)}..")
        cls.delete_all_plugins()  # remove all current plugins first
        for plugin_dir in cls.stock_plugin_folder.iterdir():
            if not plugin_dir.is_dir():
                continue
            logger.debug(f"Scanning directory {plugin_dir.name}")
            try:
                cls.validate_plugin_directory(plugin_dir)
            except Exception as e:
                logger.debug(f"Invalid plugin: {e}")
                continue
            try:
                cls.scan_plugin_directory(plugin_dir)
            except Exception as e:
                logger.warning(f"Error saving plugin in directory {plugin_dir.name}: {e}")
        with SessionLocal() as session:
            stmt = select(func.count("*")).select_from(PluginModel)
            count = session.scalar(stmt)
            logger.info(f"Finished scanning stock plugins. {count} plugins found")

    @classmethod
    def check_plugin_registry(cls):
        """To be called from main to scan for plugins if plugin registry empty"""
        with SessionLocal() as session:
            stmt = select(func.count("*")).select_from(PluginModel)
            count = session.scalar(stmt)
            if count is None or count <= 0:
                # no plugin found, scan stock
                cls.scan_stock_plugins()

    @classmethod
    def read_requirements(cls, requirement_file: Path):
        if not requirement_file.exists():
            return None
        try:
            with open(requirement_file, "r") as fp:
                lines = fp.readlines()
                lines = [line.strip() for line in lines]  # trim
                return list(filter(lambda x: len(x) > 0, lines))
        except:
            return None

    @classmethod
    def scan_plugin_directory(cls, folder: Path):
        """Scan the plugin directory and save the plugin information to DB.
        Assume that the directory has been validated using validate_plugin_directory.

        Args:
            folder (Path): _description_

        Raises:
            PluginStoreException: _description_
            PluginStoreException: _description_
        """
        plugin_meta_file = folder.joinpath(cls.plugin_meta_filename)

        plugin_meta_json = read_and_validate(plugin_meta_file, plugin_schema)
        if plugin_meta_json is None:
            return

        with SessionLocal() as session:
            plugin_meta = PluginMeta.model_validate_json(json.dumps(plugin_meta_json))

            stmt = select(PluginModel).filter_by(gid=plugin_meta.gid)
            plugin = session.scalar(stmt)
            if plugin:  # returns a result
                logger.debug(f"Delete existing plugin: {plugin_meta.gid}")
                session.delete(plugin)
                session.flush()

            plugin = PluginModel(
                gid=plugin_meta.gid,
                version=plugin_meta.version,
                name=plugin_meta.name,
                author=plugin_meta.author,
                description=plugin_meta.description,
                url=plugin_meta.url,
                meta=json.dumps(plugin_meta_json).encode("utf-8")
            )
            logger.debug(f"New plugin: {plugin}")
            # session.flush()

            # TODO: implement tags

            # scan for algorithms
            algo_subdir = folder.joinpath("algorithms")
            if algo_subdir.exists() and algo_subdir.is_dir():
                for algopath in algo_subdir.iterdir():
                    if not algopath.is_dir():
                        continue

                    # read algo metadata
                    try:
                        cid = algopath.name
                        meta_path = algopath.joinpath(f"{cid}.meta.json")
                        if not meta_path.exists():
                            pyproject_file = algopath.joinpath("pyproject.toml")
                            if not pyproject_file.exists():
                                logger.debug(f"Algorithm folder {
                                             algopath.name} does not contain meta file nor pyproject.toml, skipping")
                                continue
                            with open(pyproject_file, "rb") as fp:
                                pyproject_data = tomllib.load(fp)
                            if "project" not in pyproject_data or "name" not in pyproject_data["project"]:
                                logger.debug(f"Algorithm folder {algopath.name} has invalid pyproject.toml")
                                continue
                            project_name = pyproject_data["project"]["name"]
                            sub_path = algopath.joinpath(project_name)
                            meta_path = sub_path.joinpath("algo.meta.json")
                            if not meta_path.exists():
                                logger.debug(f"Algorithm folder {algopath.name} does not contain meta file, skipping")
                                continue
                            algopath = sub_path
                        algo_meta_json = read_and_validate(meta_path, algorithm_schema)
                        if algo_meta_json is None:
                            logger.warning(f"Algorithm {cid} has invalid meta {cid}.meta.json")
                            continue
                        meta = AlgorithmMeta.model_validate_json(json.dumps(algo_meta_json))

                        # validate script
                        # script_path = algopath.joinpath(f"{meta.cid}.py")
                        # if script_path.exists() and not validate_python_script(script_path):
                        #     logger.warning(f"algorithm {cid} script is not valid")
                        #     continue

                        # validate requirements.txt
                        # requirements = cls.read_requirements(algopath.joinpath("requirements.txt"))
                        # if requirements is None:
                        #     logger.warning(f"Missing or invalid requirements.txt for algo {cid}")
                        #     continue

                        # read input and output schema
                        with open(algopath.joinpath("input.schema.json"), "r") as fp:
                            input_schema = json.load(fp)

                        with open(algopath.joinpath("input.schema.json"), "r") as fp:
                            output_schema = json.load(fp)

                        model_type = ",".join(meta.modelType)

                        algorithm = AlgorithmModel(
                            plugin_id=plugin.gid,
                            meta=json.dumps(algo_meta_json).encode("utf-8"),
                            id=f"{plugin_meta.gid}:{meta.cid}",
                            cid=meta.cid,
                            name=meta.name,
                            version=meta.version,
                            author=meta.author,
                            description=meta.description,
                            # tags=meta.tags,
                            gid=plugin_meta.gid,
                            model_type=model_type,
                            require_ground_truth=meta.requireGroundTruth,
                            input_schema=json.dumps(input_schema).encode("utf-8"),
                            output_schema=json.dumps(output_schema).encode("utf-8"),
                        )

                        logger.debug(f"New algorithm {algorithm}")
                        plugin.algorithms.append(algorithm)
                        session.add(algorithm)
                    except Exception as e:
                        logger.warning(f"Error validating algorithm {algopath}: {e}")

            # TODO: add for other components

            # commit to DB
            session.add(plugin)
            session.commit()

            fs_save_plugin(plugin_meta.gid, folder)

    @classmethod
    def validate_plugin_directory(cls, folder: Path) -> PluginMeta:
        """Validate plugin files without any DB commit

        Args:
            folder (Path): path to plugin directory

        Returns:
            _type_: _description_
        """
        if not folder.exists() or not folder.is_dir():
            raise PluginStoreException(f"Invalid plugin directory {folder}")

        plugin_meta_file = folder.joinpath(cls.plugin_meta_filename)
        if not plugin_meta_file.exists():
            raise PluginStoreException(f"Invalid plugin: missing meta file {plugin_meta_file}")

        plugin_meta_json = read_and_validate(plugin_meta_file, plugin_schema)
        if plugin_meta_json is None:
            raise PluginStoreException(f"Invalid plugin: invalid plugin meta")

        # print(f"plugin_meta_json: {type(plugin_meta_json)}")
        # print(plugin_meta_json)
        plugin = PluginMeta.model_validate_json(json.dumps(plugin_meta_json))
        logger.debug(f"Found plugin: {plugin}")

        # scan for algorithms
        algo_subdir = folder.joinpath("algorithms")
        if algo_subdir.exists() and algo_subdir.is_dir():
            for algopath in algo_subdir.iterdir():
                if not algopath.is_dir():
                    continue

                logger.debug(f"Reading algorithm directory {algopath.name}")
                # read algo metadata
                cid = algopath.name
                meta_path = algopath.joinpath(f"{cid}.meta.json")
                if not meta_path.exists():
                    pyproject_file = algopath.joinpath("pyproject.toml")
                    if not pyproject_file.exists():
                        logger.debug(f"Algorithm folder {
                                     algopath.name} does not contain meta file nor pyproject.toml, skipping")
                        continue
                    with open(pyproject_file, "rb") as fp:
                        pyproject_data = tomllib.load(fp)
                    if "project" not in pyproject_data or "name" not in pyproject_data["project"]:
                        logger.debug(f"Algorithm folder {algopath.name} has invalid pyproject.toml")
                        continue
                    project_name = pyproject_data["project"]["name"]
                    sub_path = algopath.joinpath(project_name)
                    meta_path = sub_path.joinpath("algo.meta.json")
                    if not meta_path.exists():
                        logger.debug(f"Algorithm folder {algopath.name} does not contain meta file, skipping")
                        continue
                    algopath = sub_path
                algo_meta_json = read_and_validate(meta_path, algorithm_schema)
                # print(algo_meta_json)
                if algo_meta_json is None:
                    raise PluginStoreException(f"Algorithm folder {folder.name}: invalid {cid}.meta.json")
                algorithm = AlgorithmMeta.model_validate_json(json.dumps(algo_meta_json))

                # validate script
                # script_path = algopath.joinpath(f"{algorithm.cid}.py")
                # if not validate_python_script(script_path):
                #     raise PluginStoreException(
                #         f"Algorithm folder {folder.name}: {algorithm.cid}.py script is not valid")

                # validate requirements.txt
                # requirements = cls.read_requirements(algopath.joinpath("requirements.txt"))
                # if requirements is None:
                #     raise PluginStoreException(f"Algorithm folder {folder.name}: missing or invalid requirements.txt")

                # read input and output schema
                try:
                    with open(algopath.joinpath("input.schema.json"), "r") as fp:
                        json.load(fp)
                except:
                    raise PluginStoreException(f"Algorithm folder {folder.name}: missing or invalid input.schema.json")

                try:
                    with open(algopath.joinpath("output.schema.json"), "r") as fp:
                        json.load(fp)
                except:
                    raise PluginStoreException(f"Algorithm folder {folder.name}: missing or invaid output.schema.json")

        # TODO: add for other components

        return plugin
