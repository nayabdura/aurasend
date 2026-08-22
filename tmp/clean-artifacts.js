const fs = require('fs');
const path = require('path');

const DIRECTORIES = [
    path.join(__dirname, '../app'),
    path.join(__dirname, '../components')
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
            
            const REPLACE_RULES = [
                // Fix transparency suffix crashes from previous blind script injections
                { regex: /dark:bg-zinc-900\/60\/\d+/g, replacement: 'dark:bg-zinc-900' },
                { regex: /dark:bg-zinc-900\/60\/[^\s'"`]+/g, replacement: 'dark:bg-zinc-900' },
                
                // Fix duplicate dark text injections
                { regex: /dark:text-zinc-[0-9]+\s+dark:text-zinc-[0-9]+/g, replacement: 'dark:text-zinc-50' },
                { regex: /text-slate-900 dark:text-zinc-500/g, replacement: 'text-slate-900 dark:text-zinc-400' }, // better contrast
                
                // Address nested component backgrounds to prevent pure text overlays in Dark Mode
                { regex: /bg-slate-50 dark:bg-zinc-900\/30/g, replacement: 'bg-slate-50 dark:bg-zinc-900/50' },
                
                // Fix focus rings
                { regex: /focus:ring-indigo-\[0\.4\][0-9]+/g, replacement: 'focus:ring-indigo-500/40' },
            ];
            
            for (const rule of REPLACE_RULES) {
                if (rule.regex.test(content)) {
                    content = content.replace(rule.regex, rule.replacement);
                    modified = true;
                }
            }
            
            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log(`Cleaned syntax artifacts: ${path.basename(fullPath)}`);
            }
        }
    }
}

for (const dir of DIRECTORIES) {
    walkDir(dir);
}
console.log('Artifacts cleaned!');
