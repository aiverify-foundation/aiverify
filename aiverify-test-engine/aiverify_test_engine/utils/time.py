import time
from functools import wraps


def time_class_method(func):
    """
    A decorator function to measure execution time of a method inside a class
    """

    @wraps(func)
    def timeit_wrapper(*args, **kwargs):
        start_time = time.perf_counter()

        func_result = func(*args, **kwargs)

        end_time = time.perf_counter()
        time_diff = end_time - start_time

        # Print time taken
        print("=" * 50)
        print(f"Function ({func.__name__}) took {time_diff:.4f} seconds to complete")
        print("=" * 50)
        return func_result

    return timeit_wrapper
