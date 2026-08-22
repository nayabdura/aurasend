const fs = require('fs');
const path = require('path');

const DIRECTORIES = [
    path.join(__dirname, '../app'),
    path.join(__dirname, '../components')
];

// Mapping of Light Mode hardcodes to Light + Dark mode responsive pairs
const REPLACEMENTS = [
    { regex: /(?<!dark:)bg-white/g, replacement: 'bg-white dark:bg-zinc-900/60' },
    { regex: /(?<!dark:)text-gray-900/g, replacement: 'text-slate-900 dark:text-zinc-50' },
    { regex: /(?<!dark:)text-gray-800/g, replacement: 'text-slate-800 dark:text-zinc-200' },
    { regex: /(?<!dark:)text-gray-700/g, replacement: 'text-slate-700 dark:text-zinc-300' },
    { regex: /(?<!dark:)text-gray-600/g, replacement: 'text-slate-600 dark:text-zinc-400' },
    { regex: /(?<!dark:)text-gray-500/g, replacement: 'text-slate-500 dark:text-zinc-400' },
    
    { regex: /(?<!dark:)border-gray-100/g, replacement: 'border-slate-100 dark:border-zinc-800/80' },
    { regex: /(?<!dark:)border-gray-200/g, replacement: 'border-slate-200 dark:border-zinc-800' },
    { regex: /(?<!dark:)border-gray-300/g, replacement: 'border-slate-300 dark:border-zinc-700' },

    { regex: /(?<!dark:)bg-gray-50/g, replacement: 'bg-slate-50 dark:bg-zinc-900/30' },
    { regex: /(?<!dark:)bg-gray-100/g, replacement: 'bg-slate-100 dark:bg-zinc-800/50' },
    { regex: /(?<!dark:)bg-gray-200/g, replacement: 'bg-slate-200 dark:bg-zinc-800' },

    { regex: /(?<!dark:)text-slate-900/g, replacement: 'text-slate-900 dark:text-zinc-50' },
    { regex: /(?<!dark:)text-slate-800/g, replacement: 'text-slate-800 dark:text-zinc-200' },
    { regex: /(?<!dark:)text-slate-700/g, replacement: 'text-slate-700 dark:text-zinc-300' },
    { regex: /(?<!dark:)text-slate-600/g, replacement: 'text-slate-600 dark:text-zinc-400' },
    { regex: /(?<!dark:)text-slate-500/g, replacement: 'text-slate-500 dark:text-zinc-400' },
    
    { regex: /(?<!dark:)border-slate-100/g, replacement: 'border-slate-100 dark:border-zinc-800/80' },
    { regex: /(?<!dark:)border-slate-200/g, replacement: 'border-slate-200 dark:border-zinc-800' },
    
    { regex: /(?<!dark:)bg-slate-50/g, replacement: 'bg-slate-50 dark:bg-zinc-900/30' },
    { regex: /(?<!dark:)bg-slate-100/g, replacement: 'bg-slate-100 dark:bg-zinc-800/50' }
];

function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;
            
            for (const { regex, replacement } of REPLACEMENTS) {
                if (regex.test(content)) {
                    content = content.replace(regex, replacement);
                    modified = true;
                }
            }
            
            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated: ${fullPath}`);
            }
        }
    }
}

for (const dir of DIRECTORIES) {
    walkDir(dir);
}
console.log('UI Dark Mode mappings completed!');
