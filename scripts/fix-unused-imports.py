#!/usr/bin/env python3
"""
Fix unused imports in TypeScript files automatically
"""

import re
import sys
from pathlib import Path

def parse_error_line(line: str):
    """Parse TypeScript error line to extract file path, line number, and unused variable"""
    # Format: app/(auth)/login/page.tsx(16,3): error TS6133: 'CardDescription' is declared but its value is never read.
    match = re.match(r"(.+?)\((\d+),(\d+)\): error TS6133: '(.+?)' is declared", line)
    if match:
        return {
            'file': match.group(1),
            'line': int(match.group(2)),
            'col': int(match.group(3)),
            'name': match.group(4)
        }
    
    # Format: app/(dashboard)/admin/ai-limits/page.tsx(77,1): error TS6192: All imports in import declaration are unused.
    match = re.match(r"(.+?)\((\d+),(\d+)\): error TS6192", line)
    if match:
        return {
            'file': match.group(1),
            'line': int(match.group(2)),
            'col': int(match.group(3)),
            'name': None  # Entire import line
        }
    
    return None

def read_errors(error_file: str):
    """Read and parse error file"""
    errors = []
    with open(error_file, 'r', encoding='utf-8') as f:
        for line in f:
            error = parse_error_line(line.strip())
            if error:
                errors.append(error)
    
    # Group by file
    by_file = {}
    for error in errors:
        file = error['file']
        if file not in by_file:
            by_file[file] = []
        by_file[file].append(error)
    
    # Sort lines descending (so we can remove from bottom to top)
    for file in by_file:
        by_file[file].sort(key=lambda x: x['line'], reverse=True)
    
    return by_file

def fix_unused_import(line: str, name: str):
    """Remove unused import from a line"""
    # Single import: import { X } from 'y'
    if re.match(rf"import\s+{{\s*{re.escape(name)}\s*}}\s+from", line):
        return None  # Delete entire line
    
    # Multiple imports: import { A, B, X, C } from 'y'
    # Remove the specific import
    line = re.sub(rf",\s*{re.escape(name)}\s*", "", line)
    line = re.sub(rf"{re.escape(name)}\s*,\s*", "", line)
    line = re.sub(rf"{{\s*{re.escape(name)}\s*}}", "{}", line)
    
    # If empty braces, delete line
    if re.match(r"import\s+{{\s*}}\s+from", line):
        return None
    
    return line

def fix_file(file_path: str, errors: list):
    """Fix unused imports in a file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        modified = False
        for error in errors:
            line_num = error['line'] - 1  # 0-indexed
            if line_num < 0 or line_num >= len(lines):
                continue
            
            if error['name'] is None:
                # Entire import is unused (TS6192)
                lines[line_num] = None  # Mark for deletion
                modified = True
            else:
                # Specific import is unused (TS6133)
                old_line = lines[line_num]
                new_line = fix_unused_import(old_line, error['name'])
                if new_line != old_line:
                    lines[line_num] = new_line
                    modified = True
        
        if modified:
            # Remove None lines
            lines = [l for l in lines if l is not None]
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.writelines(lines)
            
            print(f"✅ Fixed: {file_path}")
            return True
        
    except Exception as e:
        print(f"❌ Error fixing {file_path}: {e}")
        return False
    
    return False

def main():
    error_file = 'errors.txt'
    if not Path(error_file).exists():
        print(f"Error file {error_file} not found!")
        sys.exit(1)
    
    print("🔍 Parsing errors...")
    errors_by_file = read_errors(error_file)
    
    print(f"📝 Found {len(errors_by_file)} files with unused imports")
    
    fixed_count = 0
    for file, errors in errors_by_file.items():
        if fix_file(file, errors):
            fixed_count += 1
    
    print(f"\n✅ Fixed {fixed_count} files")

if __name__ == '__main__':
    main()

