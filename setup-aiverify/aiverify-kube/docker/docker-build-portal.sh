#!/bin/bash

docker build ${@:1} -t aiverify-portal:0.10 ./portal
