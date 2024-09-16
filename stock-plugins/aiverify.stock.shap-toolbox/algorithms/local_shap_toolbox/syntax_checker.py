import ast
import sys


def check_syntax() -> None:
    """
    A function to check the syntax of the input python files
    * Note - while this function does not return any value, the script will exit with
    different codes depending on whether the checked files have any syntax error:
        sys code 0 if the syntax for ALL python file(s) are valid,
        sys code -1 if at least one of the python file(s) is not valid
    """
    valid: int = 0
    for filename in sys.argv[1:]:
        try:
            with open(filename) as f:
                source_code = f.read()

        # catch files that cannot be opened. these file(s) will not be checked
        except Exception:
            print(f"Unable to open {filename}. This file will not be checked.")
            continue

        # check for syntax error in the python file. if there is any syntax error,
        # exit immediately with -1 code
        try:
            ast.parse(source_code)
        except SyntaxError:
            print(f"Syntax error in {filename}.")
            valid = -1
            continue

    sys.exit(valid)


if __name__ == "__main__":
    check_syntax()
    # to run script,
    # python3 checker.py <python file 1> <python file 2> ... <python file n>
