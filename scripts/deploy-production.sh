#!/usr/bin/env bash

# Run from the application's Compose directory on the production VPS.
# The GitHub Actions deployment job copies this script and
# compose.production.yaml here before invoking it.
set -Eeuo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <image-tag>" >&2
  exit 64
fi

new_image_tag="$1"
state_directory=".deployment"
current_tag_file="$state_directory/current-image-tag"
previous_image_tag=""
switched_release=false

mkdir -p "$state_directory"
if [[ -f "$current_tag_file" ]]; then
  previous_image_tag="$(<"$current_tag_file")"
fi

compose() {
  docker compose -f compose.yaml -f compose.production.yaml "$@"
}

rollback() {
  local exit_code=$?

  if [[ "$switched_release" == true && -n "$previous_image_tag" ]]; then
    echo "Deployment failed; restoring image tag $previous_image_tag" >&2
    export IMAGE_TAG="$previous_image_tag"
    compose pull server client
    compose up -d --no-build server client
  elif [[ "$switched_release" == true ]]; then
    echo "Deployment failed and no prior image tag is recorded; manual recovery is required." >&2
  fi

  exit "$exit_code"
}
trap rollback ERR

export IMAGE_TAG="$new_image_tag"

echo "Pulling image tag $IMAGE_TAG"
compose pull server client

echo "Applying database migrations"
compose run --rm server node dist/database/runMigrations.js

echo "Switching application containers to image tag $IMAGE_TAG"
compose up -d --no-build server client
switched_release=true

for attempt in {1..30}; do
  if curl --fail --silent --show-error "http://127.0.0.1:${CLIENT_PORT:-8080}/ready" > /dev/null; then
    printf '%s\n' "$new_image_tag" > "$current_tag_file"
    echo "Deployment succeeded with image tag $new_image_tag"
    exit 0
  fi

  if [[ "$attempt" -eq 30 ]]; then
    echo "The new release did not become ready within 30 seconds." >&2
    compose logs --tail=100 server client >&2
    false
  fi

  sleep 1
done
