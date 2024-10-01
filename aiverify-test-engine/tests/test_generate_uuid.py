from aiverify_test_engine.utils.generate_uuid import generate_uuid
from aiverify_test_engine.utils.validate_checks import is_empty_string


class TestCollectionGenerateUuid:
    def test_generate_uuid(self):
        """
        Tests generating uuid value
        """
        uuid = generate_uuid()
        assert isinstance(uuid, str)
        assert is_empty_string(uuid) is False
