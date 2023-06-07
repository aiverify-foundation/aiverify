#!/bin/bash

export CUR_UID=$(id -u)
export CUR_GID=$(id -g)
echo "uid=$CUR_UID gid=$CUR_GID"

i=$(($#-1))
while [ $i -ge 0 ];
do
  if [ ${BASH_ARGV[$i]} == "--reset" ]; then
    RESET="--reset"
  elif [ ${BASH_ARGV[$i]} == "--detach" ]; then
    DETACH="--detach"
  elif [ ${BASH_ARGV[$i]} == "--logfile" ]; then
    echo ${BASH_ARGV[$i]}
    i=$((i-1))
    LOGFILE=">> ${BASH_ARGV[$i]}"
  fi
  echo ${BASH_ARGV[$i]}
  i=$((i-1))
done

if [ "$RESET" == "--reset" ]; then
  echo "Cleaning up volumes"
  sudo rm -rf ~/data
  sudo rm -rf ~/uploads
  sudo rm -rf ~/logs
  docker-compose down --volumes
fi

[ ! -d "~/data/db" ] && mkdir -p ~/data/db
[ ! -d "~/uploads/data" ] && mkdir -p ~/uploads/data
[ ! -d "~/uploads/model" ] && mkdir -p ~/uploads/model
[ ! -d "~/logs/db" ] && mkdir -p ~/logs/db
[ ! -d "~/logs/test-engine" ] && mkdir -p ~/logs/test-engine

echo "Starting containers..."
docker-compose up $DETACH


