const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./app/api');
let count = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace e.message || 'some string'
    content = content.replace(/error:\s*e\.message\s*\|\|\s*['"][^'"]+['"]/g, "error: 'An internal server error occurred.'");
    // Replace raw e.message
    content = content.replace(/error:\s*e\.message/g, "error: 'An internal error occurred.'");
    
    if (content !== original) {
        fs.writeFileSync(file, content);
        count++;
    }
});
console.log(`Security Patch: Updated ${count} API routes to hide internal SQL/Server errors from clients.`);
