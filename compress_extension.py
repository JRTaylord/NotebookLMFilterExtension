#!/usr/bin/env python3
"""
Build script for NotebookLM Extension
Creates a zip file with only the necessary extension files
"""

import zipfile
import os
from pathlib import Path
from datetime import datetime

# Extension files to include
INCLUDE_FILES = [
    'manifest.json',
    'content.js',
    'filterState.js',
    'popup.css',
    'popup.html',
    'popup.js',
]

# Directories to include
INCLUDE_DIRS = [
    'icons',
]

def create_extension_zip():
    """Create a zip file with extension files"""
    # Get the script directory
    script_dir = Path(__file__).parent

    # Create output filename with timestamp
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    output_filename = f'NotebookLMFilterExtension.zip'
    output_path = script_dir.parent / output_filename

    print(f"Creating extension zip: {output_filename}")

    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add individual files
        for file in INCLUDE_FILES:
            file_path = script_dir / file
            if file_path.exists():
                zipf.write(file_path, file)
                print(f"  Added: {file}")
            else:
                print(f"  Warning: {file} not found")

        # Add directories
        for dir_name in INCLUDE_DIRS:
            dir_path = script_dir / dir_name
            if dir_path.exists() and dir_path.is_dir():
                for root, dirs, files in os.walk(dir_path):
                    for file in files:
                        file_path = Path(root) / file
                        arcname = file_path.relative_to(script_dir)
                        zipf.write(file_path, arcname)
                        print(f"  Added: {arcname}")
            else:
                print(f"  Warning: Directory {dir_name} not found")

    print(f"\nExtension packaged successfully!")
    print(f"Output: {output_path}")
    print(f"Size: {output_path.stat().st_size / 1024:.2f} KB")

if __name__ == '__main__':
    create_extension_zip()
