const testLine = "app/(auth)/login/page.tsx(16,3): error TS6133: 'CardDescription' is declared but its value is never read.";

function parseErrorLine(line) {
  console.log(`Testing line: ${line}`);
  
  // Test match 1
  const match1 = line.match(/(.+?)\((\d+),(\d+)\): error TS6133: '(.+?)' is declared/);
  console.log(`Match 1:`, match1);
  
  if (match1) {
    return {
      file: match1[1],
      line: parseInt(match1[2]),
      col: parseInt(match1[3]),
      name: match1[4]
    };
  }
  
  return null;
}

const result = parseErrorLine(testLine);
console.log(`Result:`, result);

