#!/bin/bash
source_dir=test_engine_app

flake8 --format=html --htmldir=flake8-report --count  $source_dir > flake8-report.txt
