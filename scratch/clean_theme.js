const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace dark: classes like dark:bg-zinc-900/60 or dark:text-zinc-50
// Also clean up any double spaces that result from this
let cleaned = content.replace(/\bdark:[^\s"]+/g, '');
cleaned = cleaned.replace(/class(Name)?="([^"]*)"/g, (match, p1, p2) => {
    // Normalize spaces: replace multiple spaces with a single space
    const normalized = p2.replace(/\s+/g, ' ').trim();
    return `class${p1 || ''}="${normalized}"`;
});

fs.writeFileSync(filePath, cleaned, 'utf8');
console.log('Successfully stripped dark mode styles from landing page (page.tsx).');
