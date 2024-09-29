from time import sleep

from aiverify_test_engine.utils.time import time_class_method


class TestCollectionTimeClassMethod:
    @staticmethod
    def time_me():
        """
        Test function to perform sleep to simulate work done
        """
        sleep(5)

    def test_time_class_method(self, capsys):
        """
        Run the wrapper function on the time_me which simulates work done.
        Validate the sysout output that it took the correct number of seconds.
        """
        test_func = time_class_method(self.time_me)
        test_func()
        captured_sys_output = capsys.readouterr()
        # Compare the output. Omitted the decimal seconds
        assert (
            captured_sys_output.out[:76]
            == "==================================================\nFunction (time_me) took 5"
        )
        assert (
            captured_sys_output.out[81:]
            == " seconds to complete\n==================================================\n"
        )
