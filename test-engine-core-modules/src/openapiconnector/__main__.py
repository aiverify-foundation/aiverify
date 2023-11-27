from pathlib import Path

from module_tests.plugin_test import PluginTest

if __name__ == "__main__":
    discover_path = Path.cwd().parent
    # api_schema_path = str(
    #     discover_path / "openapiconnector/user_defined_files/test_api_schema.json"
    # )
    # api_config_path = str(
    #     discover_path / "openapiconnector/user_defined_files/test_api_config.json"
    # )

    # Test Schema 1
    api_schema_path = str(
        discover_path / "openapiconnector/user_defined_files/test_schema1.json"
    )
    api_config_path = str(
        discover_path / "openapiconnector/user_defined_files/test_config1.json"
    )
    # # Test Schema 2
    # api_schema_path = str(
    #     discover_path / "openapiconnector/user_defined_files/test_schema2.json"
    # )
    # api_config_path = str(
    #     discover_path / "openapiconnector/user_defined_files/test_config2.json"
    # )
    # # Test Schema 3
    # api_schema_path = str(
    #     discover_path / "openapiconnector/user_defined_files/test_schema3.json"
    # )
    # api_config_path = str(
    #     discover_path / "openapiconnector/user_defined_files/test_config3.json"
    # )
    # # Test Schema 4
    # api_schema_path = str(
    #     discover_path / "openapiconnector/user_defined_files/test_schema4.json"
    # )
    # api_config_path = str(
    #     discover_path / "openapiconnector/user_defined_files/test_config4.json"
    # )
    # # Test Schema 5
    # api_schema_path = str(
    #     discover_path / "openapiconnector/user_defined_files/test_schema5.json"
    # )
    # api_config_path = str(
    #     discover_path / "openapiconnector/user_defined_files/test_config5.json"
    # )
    # # Test Schema 6
    # api_schema_path = str(
    #     discover_path / "openapiconnector/user_defined_files/test_schema6.json"
    # )
    # api_config_path = str(
    #     discover_path / "openapiconnector/user_defined_files/test_config6.json"
    # )
    # # Test Schema 7
    # api_schema_path = str(
    #     discover_path / "openapiconnector/user_defined_files/test_schema7.json"
    # )
    # api_config_path = str(
    #     discover_path / "openapiconnector/user_defined_files/test_config7.json"
    # )
    # # Test Schema 8
    # api_schema_path = str(
    #     discover_path / "openapiconnector/user_defined_files/test_schema8.json"
    # )
    # api_config_path = str(
    #     discover_path / "openapiconnector/user_defined_files/test_config8.json"
    # )
    # # Test Schema 9
    # api_schema_path = str(
    #     discover_path / "openapiconnector/user_defined_files/test_schema9.json"
    # )
    # api_config_path = str(
    #     discover_path / "openapiconnector/user_defined_files/test_config9.json"
    # )

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
