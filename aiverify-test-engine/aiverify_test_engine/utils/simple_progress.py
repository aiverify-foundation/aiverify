from typing import Callable, Union


class SimpleProgress:
    """
    SimpleProgress class focuses on calculating and returning the completion percentage.
    """

    def __init__(
        self, total: int = 0, completed: int = 0, callback: Union[Callable, None] = None
    ):
        self.update_progress_threshold = 1

        if total is None or not isinstance(total, int):
            self.total = 0
        else:
            self.total = total

        if completed is None or not isinstance(completed, int):
            self.completed = 0
        else:
            self.completed = completed

        if not callable(callback):
            self.callback = None
        else:
            self.callback = callback

    def add_total(self, total: int) -> None:
        """
        A method to add to the total number for processing

        Args:
            total (int): total number for processing
        """
        if self.total is not None and isinstance(total, int):
            self.total += total

    def get_progress(self) -> int:
        """
        A method to get the current progress

        Returns:
            int: The current progress
        """
        if self.total > 0:
            return int(self.completed / self.total * 100.0)
        else:
            return 0

    def update(self, value: int) -> None:
        """
        A method to update the current value.
        This value will be taken to divide the total number to get the completion percentage
        It will perform update if the difference between now and previous value is more than threshold

        Args:
            value (int): number of items completed
        """
        previous_progress = self.get_progress()
        if self.completed is not None and isinstance(value, int):
            self.completed += value

        current_progress = self.get_progress()
        if self.callback is not None and isinstance(self.callback, Callable):
            if (current_progress - previous_progress) >= self.update_progress_threshold:
                self.callback(self.get_progress())
