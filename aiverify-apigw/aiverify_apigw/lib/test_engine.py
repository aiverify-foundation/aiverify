from pathlib import Path
import importlib.util
import sys
from typing import Any, List
from .logging import logger


class TestEngineValidatorException(BaseException):
    pass


def _lazy_import(module_name: str):
    spec = importlib.util.find_spec(module_name)
    if spec is None or spec.loader is None:
        raise RuntimeError("Unable to load aiverify_test_engine module")
    loader = importlib.util.LazyLoader(spec.loader)
    spec.loader = loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    loader.exec_module(module)
    return module


class TestEngineValidator:
    core_modules_path = Path(__file__).parent.parent.parent.parent.joinpath("aiverify-test-engine/aiverify_test_engine/io").absolute()
    engine_initialized: bool = False
    plugins_manager: Any | None = None

    @classmethod
    def init_engine(cls) -> Any:
        if cls.plugins_manager is not None:
            return cls.plugins_manager
        logger.debug(f"core_modules_path: {cls.core_modules_path}")
        plugins_manager = _lazy_import('aiverify_test_engine.plugins.plugins_manager')
        PluginManager = plugins_manager.PluginManager
        PluginManager.discover(cls.core_modules_path.as_posix())
        logger.info(f"Test Engine Plugins: {PluginManager.get_printable_plugins()}")
        cls.engine_initialized = True
        cls.plugins_manager = plugins_manager
        return cls.plugins_manager

    @classmethod
    def validate_model(cls, model_path: Path, is_pipline: bool = False) -> tuple[str, str]:
        """Validate test model

        Args:
            model_path (Path): Path to the test model file or folder

        Raises:
            TestEngineValidatorException

        Returns:
            tuple[ModelPluginType, SerializerPluginType]: (model_format, serializer_type)
        """
        from aiverify_test_engine.plugins.enums.plugin_type import PluginType
        plugins_manager = cls.init_engine()
        PluginManager = plugins_manager.PluginManager

        try:
            if is_pipline:
                (model_instance, model_serializer, errmsg) = PluginManager.get_instance(
                    PluginType.PIPELINE, **{"pipeline_path": model_path.absolute().as_posix()}
                )
                logger.debug(f"validate pipeline. model_instance:{model_instance}, model_serializer: {model_serializer}, errmsg: {errmsg}")
                if not isinstance(model_instance, plugins_manager.IPipeline):
                    raise TestEngineValidatorException(f"Invalid model instance returned: {type(model_instance)}")
            else:
                (model_instance, model_serializer, errmsg) = PluginManager.get_instance(
                    PluginType.MODEL, **{"filename": model_path.absolute().as_posix()}
                )
                logger.debug(f"validate model. model_instance:{model_instance}, model_serializer: {model_serializer}, errmsg: {errmsg}")
                if not isinstance(model_instance, plugins_manager.IModel):
                    raise TestEngineValidatorException(f"Invalid model instance returned: {type(model_instance)}")
        except:
            raise TestEngineValidatorException(f"Invalid model format")
        if model_instance:
            (is_success, error_messages) = model_instance.setup() 
            if not is_success:
                raise TestEngineValidatorException(f"Failed to perform model instance setup: {error_messages}")
            if is_pipline:
                result = (
                    model_instance.get_pipeline_plugin_type().name.lower(),
                    model_serializer.get_serializer_plugin_type().name.lower()
                    if model_serializer is not None
                    else None
                )
            else:
                result = (model_instance.get_model_plugin_type().name.lower(), model_serializer.get_serializer_plugin_type().name.lower())
            model_instance.cleanup()
            logger.debug(f"model validation result: {result}")
            return result
        else:
            raise TestEngineValidatorException(errmsg)

    @classmethod
    def validate_dataset(cls, model_path: Path) -> tuple[str, str, int, int, List[dict]]:
        """Validate test dataset

        Args:
            model_path (Path): Path to the test dataset file or folder

        Raises:
            TestEngineValidatorException

        Returns:
            tuple[DataPluginType, SerializerPluginType]: (model_format, serializer_type)
        """
        from aiverify_test_engine.plugins.enums.plugin_type import PluginType
        plugins_manager = cls.init_engine()
        PluginManager = plugins_manager.PluginManager

        try:
            (data_instance, data_serializer, errmsg) = PluginManager.get_instance(
                PluginType.DATA, **{"filename": model_path.absolute().as_posix()}
            )
            logger.debug(f"validate dataset. data_instance:{data_instance}, data_serializer: {data_serializer}, errmsg: {errmsg}")
            if not isinstance(data_instance, plugins_manager.IData):
                raise TestEngineValidatorException(f"Invalid dataset instance returned: {type(data_instance)}")
        except:
            raise TestEngineValidatorException(f"Invalid dataset format")
        if data_instance and data_serializer:
            (is_success, error_messages) = data_instance.setup() 
            if not is_success:
                raise TestEngineValidatorException(f"Failed to perform dataset instance setup: {error_messages}")
            # get dataset labels
            (is_data_valid, validation_error_message) = data_instance.validate()
            if not is_data_valid:
                raise TestEngineValidatorException(f"Dataset could not be validated: {validation_error_message}")
            labels = data_instance.read_labels()
            if not labels:
                raise TestEngineValidatorException("Dataset has no headers")
            data_columns = []
            for key, value in labels.items():
                data_columns.append({"name": key, "datatype": value, "label": key})
            (num_rows, num_cols) = data_instance.get_shape()
            result = (data_instance.get_data_plugin_type().name.lower(), data_serializer.get_serializer_plugin_type().name.lower(), num_rows, num_cols, data_columns)
            logger.debug(f"dataset validation result: {result}")
            return result
        else:
            raise TestEngineValidatorException(errmsg)


# # initialize the test engine
# TestEngineValidator.init_engine()