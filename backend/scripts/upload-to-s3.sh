#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Upload local video & thumbnail files to the S3 bucket, then print the S3 URLs
# so you can use them in the frontend or seed the database.
#
# Usage:
#   chmod +x backend/scripts/upload-to-s3.sh
#
#   # Upload a single video
#   ./backend/scripts/upload-to-s3.sh video ~/Videos/my-movie.mp4
#
#   # Upload a single thumbnail
#   ./backend/scripts/upload-to-s3.sh thumbnail ~/Pictures/my-thumb.jpg
#
#   # Upload multiple files at once
#   ./backend/scripts/upload-to-s3.sh video ~/Videos/*.mp4
#   ./backend/scripts/upload-to-s3.sh thumbnail ~/Pictures/*.jpg
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

BUCKET="${AWS_S3_BUCKET:-netflixclonedata}"
REGION="${AWS_REGION:-us-east-1}"

if [ $# -lt 2 ]; then
  echo "Usage: $0 <type> <file1> [file2] ..."
  echo "  type = 'video' or 'thumbnail'"
  exit 1
fi

TYPE="$1"
shift

for FILE in "$@"; do
  if [ ! -f "$FILE" ]; then
    echo "⚠ Skipping '$FILE' – not a file"
    continue
  fi

  BASENAME=$(basename "$FILE")
  FOLDER="${TYPE}s" # → "videos" or "thumbnails"
  TIMESTAMP=$(date +%s)
  S3_KEY="${FOLDER}/${TIMESTAMP}-${BASENAME}"

  echo "📤 Uploading $FILE → s3://${BUCKET}/${S3_KEY}"
  aws s3 cp "$FILE" "s3://${BUCKET}/${S3_KEY}"

  S3_URL="https://${BUCKET}.s3.${REGION}.amazonaws.com/${S3_KEY}"
  echo "✅ Uploaded! URL: ${S3_URL}"
  echo ""
done