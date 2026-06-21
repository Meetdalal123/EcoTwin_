const fs = require('fs');
const content = fs.readFileSync('js/app.js', 'utf8').split('\n');
content.forEach((l, i) => {
  if (l.includes('capsules') || l.includes('star') || l.includes('pledges')) {
    console.log(i+1, l.trim());
  }
});
