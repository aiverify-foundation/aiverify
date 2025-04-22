## Introduction
This is a user guide for AI Verify. 

<br>

## Setting Up the Documentation Server
We are using **MkDocs** for our documentation so we will need to install a few Python packages. 

It is recommended that you install the Python packages in an isolated environment so that they do not affect the packages on your host machine.

1. Install Python virtual environment package:
    ```
    python3 -m pip install --user virtualenv
    ```

2. Create a virtual environment:
    ```
    python3 -m venv my_virtual_env
    ```

3. Activate the virtual environment
    ```
    source my_virtual_env/bin/activate 
    ```
    You should see `(my_virtual_env)`  in your terminal:
    ```
    (my_virtual_env) user@LAPTOP-123: 
    ```

4. To install all the required packages:
    ```
    pip install -r requirements.txt
    ```

## Running the Documentation Server 
Once you have installed all the required packages, run the server:
```
mkdocs serve
```
Visit http://127.0.0.1:8001/ to access the documentations

