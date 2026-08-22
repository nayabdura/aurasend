import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('  AuraSend — Security & Production Artifact Audit');
console.log('====================================================');

const forbiddenPatterns = [
  /\.db$/i,
  /\.sqlite$/i,
  /\.sqlite3$/i,
  /\.bak$/i,
  /\.env$/i,
  /\.env\.local$/i,
  /\.env\.production$/i,
  /cold-email\.db/i,
];

function checkDirectory(dirPath: string, relativePath = '') {
  let violations: string[] = [];
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    if (item === 'node_modules' || item === '.git') continue;
    const fullPath = path.join(dirPath, item);
    const rel = path.join(relativePath, item);

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(item)) {
        violations.push(rel);
      }
    }

    if (fs.statSync(fullPath).isDirectory()) {
      violations = violations.concat(checkDirectory(fullPath, rel));
    }
  }

  return violations;
}

// 1. Check public/ folder
const publicDir = path.resolve(process.cwd(), 'public');
if (fs.existsSync(publicDir)) {
  const publicViolations = checkDirectory(publicDir);
  if (publicViolations.length > 0) {
    console.error('❌ SECURITY FAILURE: Database/Secret file found in public/ folder:', publicViolations);
    process.exit(1);
  }
}

// 2. Check .next/ standalone / static build directory if present
const nextDir = path.resolve(process.cwd(), '.next/static');
if (fs.existsSync(nextDir)) {
  const nextViolations = checkDirectory(nextDir);
  if (nextViolations.length > 0) {
    console.error('❌ SECURITY FAILURE: Database/Secret file found in Next.js static output:', nextViolations);
    process.exit(1);
  }
}

console.log('✅ PASS: Zero database or secret files found in public/ or client output directories.');
