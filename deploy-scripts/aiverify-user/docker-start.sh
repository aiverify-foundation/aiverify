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
  mkdir -p ~/data/db
  mkdir -p ~/uploads/data
  mkdir -p ~/uploads/model
  docker compose down --volumes
fi

echo "Starting containers..."
docker compose up $DETACH


