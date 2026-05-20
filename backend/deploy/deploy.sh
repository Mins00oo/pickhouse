#!/usr/bin/env bash
set -euo pipefail

# Usage: ./deploy.sh <ssh-host> <git-rev> [git-remote-url]
#   git-remote-url defaults to ${PICKHOUSE_GIT_URL} env var
HOST="${1:?ssh host required}"
REV="${2:-main}"
GIT_URL="${3:-${PICKHOUSE_GIT_URL:?set PICKHOUSE_GIT_URL or pass as 3rd arg}}"
REMOTE_DIR="/opt/pickhouse"

ssh "$HOST" "
  set -e
  sudo mkdir -p $REMOTE_DIR
  sudo chown -R \$USER:\$USER $REMOTE_DIR
  if [ ! -d $REMOTE_DIR/repo ]; then
    git clone $GIT_URL $REMOTE_DIR/repo
  fi
  cd $REMOTE_DIR/repo
  git fetch --all
  git checkout $REV
  git pull --ff-only
  cd backend
  docker build -t pickhouse-backend:latest .
  cd $REMOTE_DIR
  if [ ! -f docker-compose.prod.yml ]; then
    cp repo/backend/docker-compose.prod.yml .
  fi
  if [ ! -f .env ]; then
    echo 'Missing .env at $REMOTE_DIR/.env - populate from repo/backend/deploy/.env.example'
    exit 1
  fi
  docker compose -f docker-compose.prod.yml --env-file .env up -d --remove-orphans
  docker image prune -f
"

echo "Deployment to $HOST complete."
