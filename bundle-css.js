const fs = require('fs');
const path = require('path');

const files = [
  'css/style.css',
  'css/components.css',
  'css/animations.css',
  'css/extracted-inline.css',
  'css/google-auth.css',
  'css/diet-calculator.css'
];

const root = path.resolve(__dirname, '..');
const bundlePath = path.join(root, 'css/bundle.css');

let bundledContent = '';

files.forEach(file => {
  const filePath = path.join(root, file);
  if (fs.existsSync(filePath)) {
    console.log(`Bundling ${file}...`);
    let content = fs.readFileSync(filePath, 'utf8');
    bundledContent += `\n/* --- BUNDLED FROM ${file} --- */\n` + content;
  } else {
    console.warn(`WARNING: File not found: ${filePath}`);
  }
});

// Simple CSS minification
let minified = bundledContent
  .replace(/\/\*[\s\S]*?\*\//g, '')   // remove comments
  .replace(/\s+/g, ' ')               // collapse whitespace
  .replace(/\s*([{\}:;,])\s*/g, '$1') // remove spaces around braces/colons/semicolons
  .trim();

fs.writeFileSync(bundlePath, minified, 'utf8');
console.log(`CSS bundled and minified successfully to: css/bundle.css (${minified.length} bytes)`);
