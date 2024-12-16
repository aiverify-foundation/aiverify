from pathlib import Path
import importlib.util
import sys
from typing import Any
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
    def validate_model(cls, model_path: Path) -> tuple[str, str]:
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
            (model_instance, model_serializer, errmsg) = PluginManager.get_instance(
                PluginType.MODEL, **{"filename": model_path.absolute().as_posix()}
            )
        except:
            raise TestEngineValidatorException(f"Invalid model format")
        logger.debug(f"validate_model. model_instance:{model_instance}, model_serializer: {model_serializer}, errmsg: {errmsg}")
        if not isinstance(model_instance, plugins_manager.IModel):
            raise TestEngineValidatorException(f"Invalid model instance returned: {type(model_instance)}")
        if model_instance and model_serializer:
            (is_success, error_messages) = model_instance.setup() 
            if not is_success:
                raise TestEngineValidatorException(f"Failed to perform model instance setup: {error_messages}")
            result = (model_instance.get_model_plugin_type().name.lower(), model_serializer.get_serializer_plugin_type().name.lower())
            model_instance.cleanup()
            logger.debug(f"model validation result: {result}")
            return result
        else:
            raise TestEngineValidatorException(errmsg)

        
# # initialize the test engine
# TestEngineValidator.init_engine()