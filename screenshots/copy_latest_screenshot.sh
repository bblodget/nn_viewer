#!/bin/bash

# Set screenshot source directory
SOURCE_DIR=~/Pictures/Screenshots

# Find the most recent PNG file
latest_file=$(ls -t "$SOURCE_DIR"/*.png 2>/dev/null | head -n 1)

if [[ -z "$latest_file" ]]; then
  echo "No PNG screenshots found in $SOURCE_DIR"
  exit 1
fi

# Find the next available shotXXX.png in the current directory
n=1
while true; do
  filename=$(printf "shot%03d.png" "$n")
  if [[ ! -e "$filename" ]]; then
    break
  fi
  ((n++))
done

# Copy the file
cp "$latest_file" "$filename"
echo "Copied $latest_file to $filename"

