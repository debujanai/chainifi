
const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('page.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const appDir = 'd:/chainfi/chainifi/app';
const pages = walk(appDir);

pages.forEach(filePath => {
    // Skip the root page as it has special ternary logic
    if (filePath.toLowerCase().endsWith('app\\page.tsx') || filePath.toLowerCase().endsWith('app/page.tsx')) return;

    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Remove Sidebar and PropertiesPanel imports
    content = content.replace(/import\s+{\s*Sidebar\s*}\s*from\s*["']@\/components\/sidebar["'];?\n?/g, '');
    content = content.replace(/import\s+{\s*PropertiesPanel\s*}\s*from\s*["']@\/components\/properties-panel["'];?\n?/g, '');

    // 2. Extract the board component name
    const boardMatch = content.match(/<(\w+Board)\s*\/>/);
    if (!boardMatch) return;
    const boardName = boardMatch[1];

    // 3. Rebuild the file with just the board
    const importMatch = content.match(new RegExp(`import\\s+{\\s*${boardName}\\s*}\\s*from\\s*["'].*["'];?`));
    const imports = importMatch ? importMatch[0] : '';

    const newContent = `${imports}

export default function Page() {
  return <${boardName} />;
}
`;
    fs.writeFileSync(filePath, newContent);
    console.log(`Cleaned up: ${filePath}`);
});
