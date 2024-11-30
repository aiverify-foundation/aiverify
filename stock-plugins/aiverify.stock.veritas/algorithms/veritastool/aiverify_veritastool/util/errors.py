import sys


class MyError(Exception):
    """
    Helper class to return error messages
    """

    def __init__(self, *args):
        """
        Instance attributes
        ----------------------Constants
        message : str
               Holds the messages for errors
        """
        if args:
            self.message = args[0]
        else:
            self.message = None

    def __str__(self):
        """
        Returns error messages
        """
        return self.message


class VeritasError:
    """
    Class that saves the errors made by users in the Veritas library.
    """

    def __init__(self):
        """
        Instance attributes
        -----------------------
        queue : list
               Holds the messages for errors
        """
        self.queue = list()

    def push(self, error_type, **kwargs):
        """
        Formats the errors to a template message depending on their error type to a list and appends error messages to the queue

        Parameters
        --------------
        error_type : str
                Each error_type corresponds to a message template

        Other parameters
        --------------
        **kwargs : dict
                Various arguments for the error messages
        """

        if error_type == "value_error":
            var_name = kwargs["var_name"]
            expected = kwargs["expected"]
            given = kwargs["given"]
            function_name = kwargs["function_name"]
            errMsg = "{}: given {}, expected {}".format(var_name, given, expected)
            self.queue.append([error_type, errMsg, function_name])

        if error_type == "value_error_compare":
            var_name_a = kwargs["var_name_a"]
            var_name_b = kwargs["var_name_b"]
            function_name = kwargs["function_name"]
            errMsg = "{} cannot be less than {}".format(var_name_a, var_name_b)
            self.queue.append([error_type, errMsg, function_name])

        if error_type == "conflict_error":
            var_name_a = kwargs["var_name_a"]
            some_string = kwargs["some_string"]
            value = kwargs["value"]
            function_name = kwargs["function_name"]
            errMsg = "{}: {} {}".format(var_name_a, some_string, value)
            self.queue.append([error_type, errMsg, function_name])

        if error_type == "type_error":
            var_name = kwargs["var_name"]
            expected = kwargs["expected"]
            given = kwargs["given"]
            function_name = kwargs["function_name"]
            errMsg = "{}: given {}, expected {}".format(var_name, given, expected)
            self.queue.append([error_type, errMsg, function_name])

        if error_type == "length_error":
            var_name = kwargs["var_name"]
            expected = kwargs["expected"]
            given = kwargs["given"]
            function_name = kwargs["function_name"]
            errMsg = "{}: given length {}, expected length {}".format(var_name, given, expected)
            self.queue.append([error_type, errMsg, function_name])

        if error_type == "column_value_error":
            var_name = kwargs["var_name"]
            given = kwargs["given"]
            expected = kwargs["expected"]
            function_name = kwargs["function_name"]
            errMsg = "{}: given {} expected {}".format(var_name, given, expected)
            self.queue.append([error_type, errMsg, function_name])

    def pop(self):
        """
        Prints error messages and exits the programme.
        """
        msgs = ""
        if len(self.queue) > 0:
            for i in self.queue:
                msgs += "[{}]: {} at {}()\n".format(i[0], i[1], i[2])
            self.queue = list()
            raise MyError(msgs)


def my_except_hook(exctype, value, traceback):
    """
    Helper function to print error without traceback
    """
    if exctype == MyError:
        print(value)
    else:
        sys.__excepthook__(exctype, value, traceback)


try:
    obj = get_ipython()  # noqa: F821
    obj._showtraceback = my_except_hook
except:
    sys.excepthook = my_except_hook
