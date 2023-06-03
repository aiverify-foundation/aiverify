from test_engine_core.utils.generate_uuid import generate_uuid
from test_engine_core.utils.validate_checks import is_empty_string


class TestCollectionGenerateUuid:
    def test_generate_uuid(self):
        """
        Tests generating uuid value
        """
        uuid = generate_uuid()
        assert isinstance(uuid, str)
        assert is_empty_string(uuid) is False
