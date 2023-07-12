from pathlib import Path

from module_tests.plugin_test import PluginTest

if __name__ == "__main__":
    discover_path = Path.cwd().parent
    api_schema_path = str(
        discover_path / "apiconnector/user_defined_files/test_api_schema.json"
    )
    api_config_path = str(
        discover_path / "apiconnector/user_defined_files/test_api_config.json"
    )

    # =================================================================================
    # NOTE: Do not modify the code below
    # =================================================================================
    # Perform Plugin Testing
    try:
        # Create an instance of PluginTest with defined paths and arguments and Run.
        plugin_test = PluginTest(api_schema_path, api_config_path, discover_path)
        plugin_test.run()

    except Exception as exception:
        print(f"Exception caught while running the plugin test: {str(exception)}")
