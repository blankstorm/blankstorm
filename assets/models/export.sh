#!/bin/sh
dir_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P ) # https://stackoverflow.com/a/24112741


# Check if Blender is not installed
if ! command -v blender >/dev/null 2>&1; then
    echo "Blender is not installed. Please install Blender to export models."
    exit 1
fi

# Blender is installed, so run Blender with Python script
echo "found Blender! Exporting models..."
blender -P "$dir_path/export.py" -- -i "$dir_path" -o "$dir_path/../../dist/tmp/assets/models"
echo "Done!"
