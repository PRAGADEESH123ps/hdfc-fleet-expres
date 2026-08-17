import fs from 'fs';

const seedJson = fs.readFileSync('c:/Users/Pragadeesh S/Desktop/advance/master_seed.json', 'utf8');
const indexPath = 'c:/Users/Pragadeesh S/Desktop/advance/server/index.ts';
let content = fs.readFileSync(indexPath, 'utf8');

const targetStart = 'const seed = [';
const targetEnd = '];\nfor (const x of seed) {';

const startIndex = content.indexOf(targetStart);
const endIndex = content.indexOf(targetEnd);

if (startIndex === -1 || endIndex === -1) {
    console.error('Target not found in server/index.ts');
    process.exit(1);
}

const replacement = `const seed = ${seedJson}`;
const newContent = content.slice(0, startIndex) + replacement + content.slice(endIndex);

fs.writeFileSync(indexPath, newContent);
console.log('Successfully embedded 165 master vehicles into server/index.ts!');
