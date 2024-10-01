import pytest
from aiverify_test_engine.plugins.metadata.plugin_metadata import PluginMetadata


class TestCollectionPluginMetadata:
    @pytest.mark.parametrize(
        "name, description, version",
        [
            ("name1", "my_description", "version123"),
            # Test name
            (None, "my_description", "version123"),
            ("None", "my_description", "version123"),
            ([], "my_description", "version123"),
            ({}, "my_description", "version123"),
            # Test Description
            ("name1", None, "version123"),
            ("name1", "None", "version123"),
            ("name1", [], "version123"),
            ("name1", {}, "version123"),
        ],
    )
    def test_pluginmetadata(self, name, description, version):
        """
        Test the dataclass function
        """
        new_object = PluginMetadata(name, description, version)
        assert new_object.name == name
        assert new_object.description == description
        assert new_object.version == version
