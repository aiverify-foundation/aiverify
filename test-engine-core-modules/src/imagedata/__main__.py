from pathlib import Path

from module_tests.plugin_test import PluginTest

if __name__ == "__main__":
    discover_path = Path.cwd().parent
    file_path = str(discover_path / "imagedata/user_defined_files/0.png")

    # =================================================================================
    # NOTE: Do not modify the code below
    # =================================================================================
    # Perform Plugin Testing
    try:
        # Create an instance of PluginTest with defined paths and arguments and Run.
        plugin_test = PluginTest(file_path, discover_path)
        plugin_test.run()

    except Exception as exception:
        print(f"Exception caught while running the plugin test: {str(exception)}")
