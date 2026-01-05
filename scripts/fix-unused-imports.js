#!/usr/bin/env node
/**
 * Fix unused imports in TypeScript files automatically
 */

const fs = require('fs');
const path = require('path');

function parseErrorLine(line) {
  // Format: app/(auth)/login/page.tsx(16,3): error TS6133: 'CardDescription' is declared but its value is never read.
  const match1 = line.match(/(.+?)\((\d+),(\d+)\): error TS6133: '(.+?)' is declared/);
  if (match1) {
    return {
      file: match1[1],
      line: parseInt(match1[2]),
      col: parseInt(match1[3]),
      name: match1[4]
    };
  }
  
  // Format: app/(dashboard)/admin/ai-limits/page.tsx(77,1): error TS6192: All imports in import declaration are unused.
  const match2 = line.match(/(.+?)\((\d+),(\d+)\): error TS6192/);
  if (match2) {
    return {
      file: match2[1],
      line: parseInt(match2[2]),
      col: parseInt(match2[3]),
      name: null  // Entire import line
    };
  }
  
  return null;
}

function readErrors(errorFile) {
  const content = fs.readFileSync(errorFile, 'utf-8');
  const lines = content.split('\n');
  console.log(`📖 Read ${lines.length} lines from ${errorFile}`);
  const errors = [];
  
  let foundCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('error TS6133') || line.includes('error TS6192')) {
      const error = parseErrorLine(line);
      if (error) {
        errors.push(error);
        foundCount++;
        if (foundCount <= 5) {
          console.log(`Found error ${foundCount}: ${error.file}:${error.line} - ${error.name || 'FULL IMPORT'}`);
        }
      }
    }
  }
  console.log(`Total errors found: ${foundCount}`);
  
  // Group by file
  const byFile = {};
  for (const error of errors) {
    if (!byFile[error.file]) {
      byFile[error.file] = [];
    }
    byFile[error.file].push(error);
  }
  
  // Sort lines descending (so we can remove from bottom to top)
  for (const file in byFile) {
    byFile[file].sort((a, b) => b.line - a.line);
  }
  
  return byFile;
}

function fixUnusedImport(line, name) {
  // Single import: import { X } from 'y'
  const singleImportRegex = new RegExp(`import\\s+{\\s*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*}\\s+from`);
  if (singleImportRegex.test(line)) {
    return null;  // Delete entire line
  }
  
  // Multiple imports: import { A, B, X, C } from 'y'
  // Remove the specific import
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  line = line.replace(new RegExp(`,\\s*${escapedName}\\s*`, 'g'), '');
  line = line.replace(new RegExp(`${escapedName}\\s*,\\s*`, 'g'), '');
  line = line.replace(new RegExp(`{\\s*${escapedName}\\s*}`, 'g'), '{}');
  
  // If empty braces, delete line
  if (/import\s+{\s*}\s+from/.test(line)) {
    return null;
  }
  
  return line;
}

function fixFile(filePath, errors) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    let lines = content.split('\n');
    
    let modified = false;
    const linesToDelete = new Set();
    
    for (const error of errors) {
      const lineNum = error.line - 1;  // 0-indexed
      if (lineNum < 0 || lineNum >= lines.length) {
        continue;
      }
      
      if (error.name === null) {
        // Entire import is unused (TS6192)
        linesToDelete.add(lineNum);
        modified = true;
      } else {
        // Specific import is unused (TS6133)
        const oldLine = lines[lineNum];
        const newLine = fixUnusedImport(oldLine, error.name);
        if (newLine === null) {
          linesToDelete.add(lineNum);
          modified = true;
        } else if (newLine !== oldLine) {
          lines[lineNum] = newLine;
          modified = true;
        }
      }
    }
    
    if (modified) {
      // Remove deleted lines
      lines = lines.filter((_, idx) => !linesToDelete.has(idx));
      
      fs.writeFileSync(filePath, lines.join('\n'));
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    
  } catch (e) {
    console.error(`❌ Error fixing ${filePath}: ${e.message}`);
    return false;
  }
  
  return false;
}

function main() {
  const errorFile = 'errors-utf8.txt';
  if (!fs.existsSync(errorFile)) {
    console.error(`Error file ${errorFile} not found!`);
    process.exit(1);
  }
  
  console.log('🔍 Parsing errors...');
  const errorsByFile = readErrors(errorFile);
  
  console.log(`📝 Found ${Object.keys(errorsByFile).length} files with unused imports`);
  
  let fixedCount = 0;
  for (const [file, errors] of Object.entries(errorsByFile)) {
    if (fixFile(file, errors)) {
      fixedCount++;
    }
  }
  
  console.log(`\n✅ Fixed ${fixedCount} files`);
}

main();

