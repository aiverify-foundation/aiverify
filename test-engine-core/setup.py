from distutils.core import setup

setup(
    name="test_engine_core",
    version="0.9.0",
    packages=[
        "test_engine_core",
        "test_engine_core.utils",
        "test_engine_core.logging",
        "test_engine_core.logging.enums",
        "test_engine_core.network",
        "test_engine_core.network.redis",
        "test_engine_core.plugins",
        "test_engine_core.plugins.metadata",
        "test_engine_core.plugins.enums",
        "test_engine_core.interfaces",
        "test_engine_core.converters",
    ],
    license="Apache Software License 2.0",
    author="AI Verify",
    description="This core project will support critical functionalities to support plugins and apps",
    python_requires=">=3.7, <4",
    install_requires=[
        "async-timeout==4.0.2",
        "attrs==23.1.0",
        "jsonschema==4.17.3",
        "numpy==1.23.5",
        "pyrsistent==0.19.3",
        "redis==4.5.5",
    ],
)
