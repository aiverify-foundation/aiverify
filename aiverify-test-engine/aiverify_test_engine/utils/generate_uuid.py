import uuid


def generate_uuid() -> str:
    """
    A function to generate a unique random uuid4.

    Returns:
        str: A random uuid4 string
    """
    return str(uuid.uuid4())
