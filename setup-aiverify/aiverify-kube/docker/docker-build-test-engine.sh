#!/bin/bash

docker build ${@:1} -t aiverify-test-engine:0.10 ./test-engine
