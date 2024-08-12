#!/bin/bash
source .venv/bin/activate
STARTDIR=`pwd`
python -m aiverify_apigw
deactivate
