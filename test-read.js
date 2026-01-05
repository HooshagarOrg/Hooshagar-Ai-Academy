const fs = require('fs');

const content = fs.readFileSync('errors.txt', 'utf-8');
const lines = content.split('\n');

console.log(`Total lines: ${lines.length}`);
console.log(`First 10 lines:`);

for (let i = 0; i < 10; i++) {
  const line = lines[i];
  console.log(`Line ${i}: [${line}]`);
  console.log(`  - includes TS6133: ${line.includes('error TS6133')}`);
  console.log(`  - trimmed: [${line.trim()}]`);
}

