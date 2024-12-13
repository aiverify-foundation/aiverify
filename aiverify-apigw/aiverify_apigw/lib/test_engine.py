from pathlib import Path
from aiverify_test_engine.plugins.plugins_manager import PluginManager, IModel
# from aiverify_test_engine.plugins.enums.model_plugin_type import ModelPluginType
# from aiverify_test_engine.plugins.enums.serializer_plugin_type import SerializerPluginType
from aiverify_test_engine.plugins.enums.plugin_type import PluginType
from .logging import logger


class TestEngineValidatorException(BaseException):
    pass


class TestEngineValidator:
    core_modules_path = Path(__file__).parent.parent.parent.parent.joinpath("aiverify-test-engine/aiverify_test_engine/io").absolute()

    @classmethod
    def init_engine(cls):
        logger.debug(f"core_modules_path: {cls.core_modules_path}")
        PluginManager.discover(cls.core_modules_path.as_posix())
        logger.info(f"Test Engine Plugins: {PluginManager.get_printable_plugins()}")

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
        try:
            (model_instance, model_serializer, errmsg) = PluginManager.get_instance(
                PluginType.MODEL, **{"filename": model_path.absolute().as_posix()}
            )
        except:
            raise TestEngineValidatorException(f"Invalid model format")
        logger.debug(f"validate_model. model_instance:{model_instance}, model_serializer: {model_serializer}, errmsg: {errmsg}")
        if not isinstance(model_instance, IModel):
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

        
# initialize the test engine
TestEngineValidator.init_engine()