#!/bin/bash

pip-audit --format markdown --desc on -o pip-audit-report.md
mdtree pip-audit-report.md > pip-audit-report.html

