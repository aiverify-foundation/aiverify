from pathlib import Path, PurePath
import json
import tomllib
from typing import List, Any
import tempfile
import shutil
import os
import subprocess
from datetime import datetime

from .schemas_utils import read_and_validate, plugin_schema, algorithm_schema, widget_schema, input_block_schema, template_schema, template_data_schema
from ..lib.syntax_checker import validate_python_script
from ..schemas import PluginMeta, AlgorithmMeta, WidgetMeta, InputBlockMeta, TemplateMeta, ProjectTemplateMeta
from ..models import PluginModel, AlgorithmModel, WidgetModel, InputBlockModel, TemplateModel, PluginComponentModel, ProjectTemplateModel
from .database import SessionLocal
from .logging import logger
from .filestore import (
    delete_all_plugins as fs_delete_all_plugins,
    delete_plugin as fs_delete_plugin,
    save_plugin as fs_save_plugin,
    save_plugin_algorithm as fs_save_plugin_algorithm,
    save_plugin_widgets as fs_save_plugin_widgets,
    save_plugin_inputs as fs_save_plugin_inputs,
    save_mdx_bundles as fs_save_mdx_bundles,
    unzip_plugin
    # save_plugin_widgets as fs_save_plugin_widgets,
    # save_plugin_inputs as fs_save_plugin_inputs,
)
from sqlalchemy import select
from sqlalchemy.sql.expression import func


class PluginStoreException(Exception):
    pass


class PluginStore:
    node_folder = Path(__file__).parent.parent.parent.joinpath("aiverify-apigw-node")
    tsx_path = node_folder.joinpath("node_modules/.bin/tsx").as_posix()
    validate_script_path = node_folder.joinpath("validateMDX.ts").as_posix()
    validate_summary_path = node_folder.joinpath("validateSummaryMDX.ts").as_posix()
    node_path = os.getenv("NPX_PATH", "node")
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
            session.query(ProjectTemplateModel).filter(func.length(ProjectTemplateModel.template_id) > 0).delete()
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
        plugins: List[PluginModel] = []
        for plugin_dir in cls.stock_plugin_folder.iterdir():
            if not plugin_dir.is_dir() or not plugin_dir.name[0].isalnum() or plugin_dir.name == "user_defined_files":
                continue
            logger.debug(f"Scanning directory {plugin_dir.name}")
            try:
                cls.validate_plugin_directory(plugin_dir)
            except Exception as e:
                logger.warning(f"Invalid plugin: {e}")
                continue
            try:
                with tempfile.TemporaryDirectory() as tmpdirname:
                    temp_dir = Path(tmpdirname)
                    plugin = cls.scan_plugin_directory(plugin_dir, temp_dir, is_stock=True)
                    if plugin:
                        plugins.append(plugin)
            except Exception as e:
                logger.warning(f"Error saving plugin in directory {plugin_dir.name}: {e}")
        with SessionLocal() as session:
            # stmt = select(func.count("*")).select_from(PluginModel)
            # count = session.scalar(stmt)
            stmt = select(PluginModel)
            my_plugins = list(session.scalars(stmt))
            logger.info(f"Finished scanning stock plugins. {len(my_plugins)} plugins found")
            for plugin in my_plugins:
                logger.info(f"Stock plugin: gid {plugin.gid}, version {plugin.version}, name {plugin.name}")
                if plugin.algorithms and len(plugin.algorithms) > 0:
                    logger.info(f"  Number of algoritms: {len(plugin.algorithms)}")
                    for algo in plugin.algorithms:
                        logger.info(f"  Algorithm: cid {algo.cid}, version {algo.version}, name {algo.name}")
                if plugin.inputblocks and len(plugin.inputblocks) > 0:
                    logger.info(f"  Number of input blocks: {len(plugin.inputblocks)}")
                    for ib in plugin.inputblocks:
                        logger.info(f"  Input Block: cid {ib.cid}, version {ib.version}, name {ib.name}")
                if plugin.widgets and len(plugin.widgets) > 0:
                    logger.info(f"  Number of widgets: {len(plugin.widgets)}")
                    for widget in plugin.widgets:
                        logger.info(f"  Widget: cid {widget.cid}, version {widget.version}, name {widget.name}")
                if plugin.templates and len(plugin.templates) > 0:
                    logger.info(f"  Number of templates: {len(plugin.templates)}")
                    for template in plugin.templates:
                        logger.info(f"  Template: cid {template.cid}, version {template.version}, name {template.name}")

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
    def read_algorithm_directory(cls, algosubdir: Path, gid: str | None = None):
        # read algo metadata
        algopath = algosubdir
        try:
            cid = algopath.name
            meta_path = algopath.joinpath(f"{cid}.meta.json")
            module_name = None
            if not meta_path.exists():
                pyproject_file = algopath.joinpath("pyproject.toml")
                if not pyproject_file.exists():
                    logger.debug(
                        f"Algorithm folder {algopath.name} does not contain meta file nor pyproject.toml, skipping"
                    )
                    return None
                with open(pyproject_file, "rb") as fp:
                    pyproject_data = tomllib.load(fp)
                if "project" not in pyproject_data or "name" not in pyproject_data["project"]:
                    logger.debug(f"Algorithm folder {algopath.name} has invalid pyproject.toml")
                    return None
                # TODO: is this the best way to get algorithm folder?
                project_name = pyproject_data["project"]["name"].replace("-", "_")
                sub_path = algopath.joinpath(project_name)
                module_name = project_name
                meta_path = sub_path.joinpath("algo.meta.json")
                if not meta_path.exists():
                    logger.debug(f"Algorithm folder {algopath.name} does not contain meta file, skipping")
                    return None
                algopath = sub_path
            algo_meta_json = read_and_validate(meta_path, algorithm_schema)
            if algo_meta_json is None:
                logger.warning(f"Algorithm {cid} has invalid meta {cid}.meta.json")
                return None
            meta = AlgorithmMeta.model_validate_json(json.dumps(algo_meta_json))
            if meta.gid:
                gid = meta.gid
            if gid is None:
                logger.error(f"Unable to find gid for algorithm {meta.cid}")
                return None

            # validate script
            script_path = algopath.joinpath(f"{meta.cid}.py")
            if not script_path.exists():
                script_path = algopath.joinpath(f"algo.py")
            if script_path.exists():  # if script exists
                if not validate_python_script(script_path):
                    logger.warning(f"algorithm {meta.cid} script is not valid")
                    return None
                script = script_path.name
            else:
                script = None

            # validate requirements.txt
            # requirements = cls.read_requirements(algopath.joinpath("requirements.txt"))
            # if requirements is None:
            #     logger.warning(f"Missing or invalid requirements.txt for algo {cid}")
            #     continue

            # read input and output schema
            with open(algopath.joinpath("input.schema.json"), "r") as fp:
                input_schema = json.load(fp)

            with open(algopath.joinpath("output.schema.json"), "r") as fp:
                output_schema = json.load(fp)

            model_type = ",".join(meta.modelType)

            algorithm = AlgorithmModel(
                plugin_id=gid,
                meta=json.dumps(algo_meta_json).encode("utf-8"),
                id=f"{gid}:{meta.cid}",
                cid=meta.cid,
                name=meta.name,
                version=meta.version,
                author=meta.author,
                description=meta.description,
                # tags=meta.tags,
                gid=gid,
                model_type=model_type,
                require_ground_truth=meta.requireGroundTruth,
                input_schema=json.dumps(input_schema).encode("utf-8"),
                output_schema=json.dumps(output_schema).encode("utf-8"),
                # algo_dir=algosubdir.relative_to(folder).as_posix(),
                algo_dir=PurePath("algorithms").joinpath(algosubdir.name).as_posix(),
                language="python",  # fixed to python first. To support other languages in future
                script=script,
                module_name=module_name,
            )

            logger.debug(f"New algorithm {algorithm}")
            return algorithm
        except Exception as e:
            logger.warning(f"Error validating algorithm {algopath}: {e}")

    @classmethod
    def scan_algorithm_directory(cls, algo_dir: Path):
        now = datetime.now()
        with tempfile.TemporaryDirectory() as tmpdirname:
            folder = Path(tmpdirname)

            algo_model = cls.read_algorithm_directory(algo_dir)
            if not algo_model:
                raise PluginStoreException("Invalid plugin zip file.")

            with SessionLocal() as session:
                stmt = select(PluginModel).filter_by(gid=algo_model.gid)
                plugin = session.scalar(stmt)
                if plugin is None:
                    plugin_meta = PluginMeta(
                        gid=algo_model.gid,
                        version=algo_model.version if algo_model.version else "",
                        name=algo_model.name,
                        author=algo_model.author,
                        description=algo_model.description,
                    )
                    plugin_meta_dict = plugin_meta.model_dump()
                    plugin = PluginModel(
                        **plugin_meta_dict,
                        is_stock=False,
                        meta=plugin_meta.model_dump_json().encode("utf-8"),
                        created_at=now,
                        updated_at=now,
                    )
                    session.add(plugin)

                    plugin_meta_file = folder.joinpath(cls.plugin_meta_filename)
                    with open(plugin_meta_file, "w") as fp:
                        fp.write(json.dumps(plugin_meta_dict, indent=2))
                else:
                    unzip_plugin(plugin.gid, folder)

                algorithms_basedir = folder.joinpath("algorithms")
                algorithms_basedir.mkdir(exist_ok=True, parents=True)
                target_algo_dir = algorithms_basedir.joinpath(algo_dir.name)
                shutil.copytree(algo_dir, target_algo_dir, dirs_exist_ok=True)

                zip_hash = fs_save_plugin(plugin.gid, folder)
                plugin.zip_hash = zip_hash

                zip_hash = fs_save_plugin_algorithm(plugin.gid, algo_model.cid, target_algo_dir)
                algo_model.zip_hash = zip_hash

                # Find the first algorithm in plugin.algorithms that matches algo.cid == meta.cid using filter method
                matching_algos_filter = filter(lambda algo: algo.cid == algo_model.cid, plugin.algorithms)
                existing_algo = next(matching_algos_filter, None)
                if existing_algo:
                    plugin.algorithms.remove(existing_algo)
                plugin.algorithms.append(algo_model)
                session.add(algo_model)
                session.commit()

                session.expunge(plugin)
                return plugin
    
    @classmethod
    def validate_mock_data_path(cls, base_dir: Path, datapath: str) -> bool:
        """
        Validate that the mock data file exists and is within the allowed directory.
        
        Args:
            base_dir (Path): Base plugin directory (widget or input block directory)
            datapath (str): Relative path to mock data file
        
        Returns:
            bool: True if path is valid, False otherwise
        """
        try:
            # Convert datapath to Path object
            data_file = Path(datapath)
            
            # Resolve the absolute path of the mock data file
            full_path = (base_dir / data_file).resolve()
            base_resolved = base_dir.resolve()
            
            # Check if:
            # 1. The path exists
            # 2. It's a file
            # 3. It's within the base directory (prevent directory traversal)
            return (
                full_path.exists() and 
                full_path.is_file() and 
                base_resolved in full_path.parents
            )
        except Exception as e:
            logger.error(f"Error validating mock data path: {str(e)}")
            return False
    
    @classmethod
    def scan_plugin_directory(cls, folder: Path, temp_dir: Path, is_stock: bool = False):
        """Scan the plugin directory and save the plugin information to DB.
        Assume that the directory has been validated using validate_plugin_directory.

        Args:
            folder (Path): _description_

        Raises:
            PluginStoreException: _description_
        """
        plugin_meta_file = folder.joinpath(cls.plugin_meta_filename)

        plugin_meta_json = read_and_validate(plugin_meta_file, plugin_schema)
        if plugin_meta_json is None:
            return

        now = datetime.now()

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
                is_stock=is_stock,
                author=plugin_meta.author,
                description=plugin_meta.description,
                url=plugin_meta.url,
                meta=json.dumps(plugin_meta_json).encode("utf-8"),
                created_at=now,
                updated_at=now,
            )
            logger.info(f"New plugin: {plugin}")
            # session.flush()

            # TODO: implement tags

            # scan for algorithms
            algo_subdir = folder.joinpath("algorithms")
            if algo_subdir.exists() and algo_subdir.is_dir():
                for algosubdir in algo_subdir.iterdir():
                    if not algosubdir.is_dir():
                        continue

                    algorithm = cls.read_algorithm_directory(algosubdir, plugin.gid)
                    if algorithm:
                        plugin.algorithms.append(algorithm)
                        session.add(algorithm)

            # create mdx bundles directory
            mdx_bundle_folder = temp_dir.joinpath("mdx_bundles")
            mdx_bundle_folder.mkdir(exist_ok=True)

            # scan for input blocks
            inputs_subdir = folder.joinpath("inputs")
            if inputs_subdir.exists() and inputs_subdir.is_dir():
                meta_files = inputs_subdir.glob("*.meta.json")
                for meta_file in meta_files:
                    meta, meta_json = cls.validate_input_block(input_block_path=inputs_subdir,
                                                               meta_path=meta_file, folder=mdx_bundle_folder)
                    input_block = InputBlockModel(
                        plugin_id=plugin_meta.gid,
                        meta=json.dumps(meta_json).encode('utf-8'),
                        id=f"{plugin_meta.gid}:{meta.cid}",
                        cid=meta.cid,
                        name=meta.name,
                        version=meta.version,
                        author=meta.author,
                        description=meta.description,
                        # tags=meta.tags,
                        gid=plugin_meta.gid,
                        group=meta.group,
                        groupNumber=meta.groupNumber,
                        width=meta.width,
                        fullscreen=meta.fullScreen,
                    )
                    plugin.inputblocks.append(input_block)
                    session.add(input_block)
                filehash = fs_save_plugin_inputs(plugin.gid, inputs_subdir)
                plugin.inputblocks_zip_hash = filehash

            # scan for widgets
            widgets_subdir = folder.joinpath("widgets")
            if widgets_subdir.exists() and widgets_subdir.is_dir():
                meta_files = widgets_subdir.glob("*.meta.json")
                for meta_file in meta_files:
                    meta, meta_json = cls.validate_widget(widget_path=widgets_subdir,
                                                          meta_path=meta_file, folder=mdx_bundle_folder)
                    # Process mock data for widgets if present
                    if meta.mockdata:
                        valid_mock_data = []
                        for mock_entry in meta.mockdata:
                            if not hasattr(mock_entry, 'datapath'):
                                logger.warning(f"Mock data entry missing datapath in widget {meta.cid}")
                                continue
                                
                            # Validate the mock data path using the static method
                            if cls.validate_mock_data_path(widgets_subdir, mock_entry.datapath):
                                try:
                                    with open(widgets_subdir / mock_entry.datapath, 'r') as f:
                                        mock_entry.data = json.load(f)
                                    valid_mock_data.append(mock_entry)
                                except Exception as e:
                                    logger.error(f"Error reading mock data file for widget {meta.cid}: {str(e)}")
                            else:
                                logger.warning(
                                    f"Invalid mock data path '{mock_entry.datapath}' "
                                    f"for widget {meta.cid}"
                                )
                        
                        # Update meta_json with valid mock data only
                        meta.mockdata = valid_mock_data
                        meta_json['mockdata'] = [m.model_dump() for m in valid_mock_data]
                        
                    if meta.dependencies:
                        dependencies = [dep.model_dump_json() for dep in meta.dependencies]
                        # dependencies = [
                        #     f"{dep.gid if dep.gid and len(dep.gid) > 0 else plugin_meta.gid}:{dep.cid}:{dep.version if dep.version else ''}" for dep in meta.dependencies]
                    else:
                        dependencies = []
                    widget = WidgetModel(
                        plugin_id=plugin_meta.gid,
                        meta=json.dumps(meta_json).encode('utf-8'),
                        id=f"{plugin_meta.gid}:{meta.cid}",
                        cid=meta.cid,
                        name=meta.name,
                        version=meta.version,
                        author=meta.author,
                        description=meta.description,
                        # tags=meta.tags,
                        gid=plugin_meta.gid,
                        widget_size=meta.widgetSize.model_dump_json().encode('utf-8'),
                        properties=json.dumps([prop.model_dump_json() for prop in meta.properties]
                                              ).encode("utf-8") if meta.properties else None,
                        mockdata=json.dumps([md.model_dump_json() for md in meta.mockdata]
                                        ).encode("utf-8") if meta.mockdata else None,
                        dynamic_height=meta.dynamicHeight,
                        dependencies=json.dumps(dependencies).encode('utf-8'),
                    )
                    plugin.widgets.append(widget)
                    session.add(widget)
                filehash = fs_save_plugin_widgets(plugin.gid, widgets_subdir)
                plugin.widgets_zip_hash = filehash

            # scan for templates
            templates_subdir = folder.joinpath("templates")
            if templates_subdir.exists() and templates_subdir.is_dir():
                meta_files = templates_subdir.glob("*.meta.json")
                for meta_file in meta_files:
                    meta, meta_json, data_meta, data_json = cls.validate_template(
                        template_path=templates_subdir, meta_path=meta_file)
                    template = TemplateModel(
                        # plugin_id=plugin_meta.gid,
                        meta=json.dumps(meta_json).encode('utf-8'),
                        id=f"{plugin_meta.gid}:{meta.cid}",
                        cid=meta.cid,
                        name=meta.name,
                        version=meta.version,
                        author=meta.author,
                        description=meta.description,
                        # tags=meta.tags,
                        gid=plugin_meta.gid,
                        template=json.dumps(meta_json).encode('utf-8'),
                        project_data=json.dumps(data_json).encode('utf-8')
                    )

                    # create new ProjectTemplateModel
                    project_template = ProjectTemplateModel(
                        # id=template.id,
                        name=template.name,
                        description=template.description,
                        data=template.project_data,
                        created_at=now,
                        updated_at=now,
                    )
                    session.add(project_template)

                    template.project_template = project_template
                    plugin.templates.append(template)
                    session.add(template)

            # commit to DB
            session.add(plugin)
            # session.commit()

            # save plugin to plugin data dir
            zip_hash = fs_save_plugin(plugin_meta.gid, folder)
            plugin.zip_hash = zip_hash

            # save mdx bundles
            fs_save_mdx_bundles(plugin_meta.gid, mdx_bundle_folder)

            for algo in plugin.algorithms:
                zip_hash = fs_save_plugin_algorithm(plugin_meta.gid, algo.cid, folder.joinpath(algo.algo_dir))
                algo.zip_hash = zip_hash

            session.commit()

            # detach plugin model from session
            session.expunge(plugin)
            return plugin

    @classmethod
    def validate_algorithm_directory(cls, algopath: Path, gid: str | None = None):
        logger.debug(f"Validating algorithm directory {algopath.name}")
        # read algo metadata
        cid = algopath.name
        meta_path = algopath.joinpath(f"{cid}.meta.json")
        if not meta_path.exists():
            pyproject_file = algopath.joinpath("pyproject.toml")
            if not pyproject_file.exists():
                logger.debug(
                    f"Algorithm folder {algopath.name} does not contain meta file nor pyproject.toml, skipping"
                )
                return None
            with open(pyproject_file, "rb") as fp:
                pyproject_data = tomllib.load(fp)
            if "project" not in pyproject_data or "name" not in pyproject_data["project"]:
                logger.debug(f"Algorithm folder {algopath.name} has invalid pyproject.toml")
                return None
            # TODO: is this the best way to get algorithm folder?
            project_name = pyproject_data["project"]["name"].replace("-", "_")
            sub_path = algopath.joinpath(project_name)
            meta_path = sub_path.joinpath("algo.meta.json")
            if not meta_path.exists():
                logger.debug(f"Algorithm folder {algopath.name} does not contain meta file, skipping")
                return None
            algopath = sub_path
        algo_meta_json = read_and_validate(meta_path, algorithm_schema)
        # print(algo_meta_json)
        if algo_meta_json is None:
            raise PluginStoreException(f"Algorithm folder {algopath}: invalid {cid}.meta.json")
        meta = AlgorithmMeta.model_validate_json(json.dumps(algo_meta_json))
        if gid and meta.gid and meta.gid != gid:
            raise PluginStoreException(f"Meta gid {gid} in algorithm {meta.cid} does not match")

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
            raise PluginStoreException(f"Algorithm folder {algopath}: missing or invalid input.schema.json")

        try:
            with open(algopath.joinpath("output.schema.json"), "r") as fp:
                json.load(fp)
        except:
            raise PluginStoreException(f"Algorithm folder {algopath}: missing or invaid output.schema.json")

        return meta

    @classmethod
    def validate_mdx(cls, mdx_script: Path, validate_script: str = validate_script_path, output_file: Path | None = None) -> bool:
        # args = [cls.npx, "tsx", validate_script, mdx_script.resolve().as_posix()]
        args = [cls.node_path, cls.tsx_path, validate_script, mdx_script.resolve().as_posix()]
        if output_file:
            args.append(output_file.as_posix())
        try:
            proc = subprocess.run(args, capture_output=True, cwd=cls.node_folder)
            if proc.returncode == 0:
                # return json.loads(proc.stdout)
                return True
            else:
                logger.warning(f"Invalid script {mdx_script.name}")
                logger.warning(proc.stderr.decode("utf-8"))
                return False
        except Exception as e:
            logger.error(f"{mdx_script.name} validateMdx exception: {e}")
            return False

    @classmethod
    def validate_widget(cls, widget_path: Path, meta_path: Path, folder: Path | None = None) -> tuple[WidgetMeta, Any]:
        widget_meta_json = read_and_validate(meta_path, widget_schema)
        if widget_meta_json is None:
            raise PluginStoreException(f"{meta_path.name} is invalid")
        meta = WidgetMeta.model_validate(widget_meta_json)
        script_path = widget_path.joinpath(f"{meta.cid}.mdx")
        if not script_path.exists():
            raise PluginStoreException(f"widget {meta.cid} is missing MDX file")
        output_file = folder.joinpath(f"{meta.cid}.bundle.json") if folder else None
        if not cls.validate_mdx(script_path, output_file=output_file):
            raise PluginStoreException(f"Invalid widget {script_path}")
        return (meta, widget_meta_json)

    @classmethod
    def validate_input_block(cls, input_block_path: Path, meta_path: Path, folder: Path | None = None) -> tuple[InputBlockMeta, Any]:
        meta_json = read_and_validate(meta_path, input_block_schema)
        if meta_json is None:
            raise PluginStoreException(f"{meta_path.name} is invalid")
        meta = InputBlockMeta.model_validate(meta_json)
        script_path = input_block_path.joinpath(f"{meta.cid}.mdx")
        if not script_path.exists():
            raise PluginStoreException(f"Input Block {meta.cid} is missing MDX file")
        output_file = folder.joinpath(f"{meta.cid}.bundle.json") if folder else None
        if not cls.validate_mdx(script_path, output_file=output_file):
            raise PluginStoreException(f"Invalid input block {script_path}")
        summary_path = input_block_path.joinpath(f"{meta.cid}.summary.mdx")
        if not summary_path.exists():
            raise PluginStoreException(f"Input Block {meta.cid} is missing summary file")
        summary_output_file = folder.joinpath(f"{meta.cid}.summary.bundle.json") if folder else None
        if not cls.validate_mdx(summary_path, validate_script=cls.validate_summary_path, output_file=summary_output_file):
            raise PluginStoreException(f"Invalid input block summary {summary_path}")
        return (meta, meta_json)

    @classmethod
    def validate_template(cls, template_path: Path, meta_path: Path) -> tuple[TemplateMeta, Any, ProjectTemplateMeta, Any]:
        meta_json = read_and_validate(meta_path, template_schema)
        if meta_json is None:
            raise PluginStoreException(f"{meta_path.name} is invalid")
        meta = TemplateMeta.model_validate(meta_json)
        data_path = template_path.joinpath(f"{meta.cid}.data.json")
        if not data_path.exists():
            raise PluginStoreException(f"Template {meta.cid} is missing data file")
        data_json = read_and_validate(data_path, template_data_schema)
        if data_json is None:
            raise PluginStoreException(f"{data_path.name} is invalid")
        data = ProjectTemplateMeta.model_validate(data_json)
        return (meta, meta_json, data, data_json)

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
                cls.validate_algorithm_directory(algopath, plugin.gid)

        # scan for widgets
        widgets_subdir = folder.joinpath("widgets")
        if widgets_subdir.exists() and widgets_subdir.is_dir():
            meta_files = widgets_subdir.glob("*.meta.json")
            for meta_file in meta_files:
                cls.validate_widget(widget_path=widgets_subdir, meta_path=meta_file)

        # scan for input blocks
        inputs_subdir = folder.joinpath("inputs")
        if inputs_subdir.exists() and inputs_subdir.is_dir():
            meta_files = inputs_subdir.glob("*.meta.json")
            for meta_file in meta_files:
                cls.validate_input_block(input_block_path=inputs_subdir, meta_path=meta_file)

        # scan for templates
        templates_subdir = folder.joinpath("templates")
        if templates_subdir.exists() and templates_subdir.is_dir():
            meta_files = templates_subdir.glob("*.meta.json")
            for meta_file in meta_files:
                cls.validate_template(template_path=templates_subdir, meta_path=meta_file)

        return plugin
