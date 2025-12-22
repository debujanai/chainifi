
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

// Mapping of path to board component name for verification
const publicPaths = ['/holdings', '/dex-trades', '/perp-trades', 'page.tsx'];

pages.forEach(filePath => {
    const relativePath = path.relative(appDir, filePath).replace(/\\/g, '/');
    const isRoot = relativePath === 'page.tsx';
    const isPublic = isRoot ||
        relativePath === 'holdings/page.tsx' ||
        relativePath === 'dex-trades/page.tsx' ||
        relativePath === 'perp-trades/page.tsx';

    if (isPublic) {
        console.log(`Skipping public page: ${relativePath}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Extract the board component name
    const boardMatch = content.match(/<(\w+Board)\s*\/>/);
    if (!boardMatch) return;
    const boardName = boardMatch[1];

    // Extract import for the board
    const importMatch = content.match(new RegExp(`import\\s+{\\s*${boardName}\\s*}\\s*from\\s*["'](.*)["'];?`));
    const boardImportPath = importMatch ? importMatch[1] : '';

    const newContent = `import { ${boardName} } from "${boardImportPath}";
import { ComingSoon } from "@/components/coming-soon";
import { isProduction } from "@/lib/config";

export default function Page() {
  if (isProduction) {
    return <ComingSoon />;
  }
  return <${boardName} />;
}
`;
    fs.writeFileSync(filePath, newContent);
    console.log(`Applied Coming Soon logic to: ${relativePath}`);
});
