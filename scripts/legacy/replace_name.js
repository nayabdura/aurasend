const fs = require('fs');
const path = require('path');

const targetName = 'AuraSend';
const targetDomain = 'aurasend';

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Replace variations
    content = content.replace(/MailPilot/g, targetName);
    content = content.replace(/mailpilot/g, targetDomain);

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function traverseDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            replaceInFile(fullPath);
        }
    }
}

traverseDir(path.join(__dirname, 'app'));
traverseDir(path.join(__dirname, 'components'));
console.log('Replacement complete.');
