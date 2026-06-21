const fs = require('fs');
const files = ['js/app.js', 'js/gamification.js', 'js/diagnostics.js', 'js/ai-chat.js', 'google-auth.js'];
files.forEach(f => {
  if (!fs.existsSync(f)) return;
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((l, i) => {
    if (l.includes('localStorage')) {
      console.log(`${f}:${i+1}: ${l.trim()}`);
    }
  });
});
