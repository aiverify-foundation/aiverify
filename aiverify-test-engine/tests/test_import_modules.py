import sys
from importlib.machinery import ModuleSpec
from types import ModuleType

import pytest

from aiverify_test_engine.utils.import_modules import (
    create_module_spec,
    get_non_python_files,
    import_module_from_spec,
    import_python_modules,
)


class TestCollectionImportModules:
    @pytest.mark.parametrize(
        "module_name, module_file_path, expected_result",
        [
            ("modulename", "tests/importmodules/example_serializer.py", True),
            ("newmodulename", "tests/importmodules/example_serializer.py", True),
            (None, "tests/importmodules/example_serializer.py", None),
            ("None", "tests/importmodules/example_serializer.py", True),
            ({}, "tests/importmodules/example_serializer.py", None),
            ([], "tests/importmodules/example_serializer.py", None),
            (123, "tests/importmodules/example_serializer.py", None),
            ("modulename", None, None),
            ("modulename", "None", None),
            ("modulename", {}, None),
            ("modulename", [], None),
            ("modulename", 123, None),
        ],
    )
    def test_create_module_spec(self, module_name, module_file_path, expected_result):
        """
        Tests that it can create module spec
        """
        output = create_module_spec(module_name, module_file_path)
        if expected_result:
            assert isinstance(output, ModuleSpec)
        else:
            assert output == expected_result

    def test_import_module_from_spec(self):
        """
        Tests that it can import modules from spec
        """
        module_spec = create_module_spec(
            "module_name", "tests/importmodules/example_serializer.py"
        )
        output = import_module_from_spec(module_spec)
        assert isinstance(output, ModuleType)

    @pytest.mark.parametrize(
        "module_spec, expected_result",
        [
            ("modulename", None),
            (None, None),
            ("None", None),
            ({}, None),
            ([], None),
            (123, None),
        ],
    )
    def test_import_module_from_spec_errors(self, module_spec, expected_result):
        """
        Tests that it can create module spec
        """
        output = import_module_from_spec(module_spec)
        if expected_result:
            assert isinstance(output, ModuleType)
        else:
            assert output == expected_result

    @pytest.mark.parametrize(
        "discover_folder, module_name, expected_result",
        [
            ("tests/data/folderofcsv", None, False),
            ("tests/data/folderofimage", None, False),
            ("tests/data/folderofsav", None, False),
            ("tests/data/mixedfolder", None, False),
            ("tests/importmodules/", "example_serializer", True),
            ("", None, False),
            (None, None, False),
            ("None", None, False),
            ([], None, False),
            ({}, None, False),
        ],
    )
    def test_import_python_modules(self, discover_folder, module_name, expected_result):
        """
        Tests that it can import the python modules
        """
        import_python_modules(discover_folder)
        if expected_result:
            assert sys.modules[module_name]

    def test_import_python_modules_same_name_different_origin(self):
        """
        Tests that it can import duplicate modules and override the existing ones
        """
        import_python_modules("tests/duplicate_import_modules/original")
        assert sys.modules["example_serializer"]
        from example_serializer import Plugin  # type: ignore

        assert Plugin._name == "original_delimiterserializer"  # Loaded original

        import_python_modules("tests/duplicate_import_modules/duplicate")
        assert sys.modules["example_serializer"]
        from example_serializer import Plugin  # type: ignore

        assert Plugin._name == "duplicate_delimiterserializer"  # Loaded duplicate

    def test_import_python_modules_same_name_same_origin(self):
        """
        Tests that it can import duplicate modules and override the existing ones
        """
        import_python_modules("tests/duplicate_import_modules/original")
        assert sys.modules["example_serializer"]
        from example_serializer import Plugin  # type: ignore

        assert Plugin._name == "original_delimiterserializer"  # Loaded original
        Plugin._name = "duplicate_delimiterserializer"  # Modify original cache

        import_python_modules("tests/duplicate_import_modules/original")
        assert sys.modules["example_serializer"]
        from example_serializer import Plugin  # type: ignore

        assert Plugin._name == "original_delimiterserializer"  # Cache is reloaded

    @pytest.mark.parametrize(
        "discover_folder, expected_result",
        [
            (
                "tests/data/folderofcsv",
                {
                    "comma2.csv": "tests/data/folderofcsv/comma2.csv",
                    "comma1.csv": "tests/data/folderofcsv/comma1.csv",
                    "comma.csv": "tests/data/folderofcsv/comma.csv",
                },
            ),
            ("tests/importmodules", {}),
            (None, {}),
            ("None", {}),
            ({}, {}),
            ([], {}),
        ],
    )
    def test_get_non_python_files(self, discover_folder, expected_result):
        """
        Tests that it can get the number of non python files
        """
        output = get_non_python_files(discover_folder)
        assert output == expected_result
