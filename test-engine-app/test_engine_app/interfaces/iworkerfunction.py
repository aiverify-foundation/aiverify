from abc import ABC, abstractmethod


class IWorkerFunction(ABC):
    """
    The IWorkerFunction interface specifies task or service abstract base methods
    """

    @abstractmethod
    def cancel(self) -> None:
        pass

    @abstractmethod
    def cleanup(self) -> None:
        pass

    @abstractmethod
    def get_formatted_results(self) -> None:
        pass

    @abstractmethod
    def get_id(self) -> None:
        pass

    @abstractmethod
    def get_logger(self) -> None:
        pass

    @abstractmethod
    def process(self) -> None:
        pass
