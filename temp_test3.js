const path = require('path');
const fs = require('fs');
const filePath = path.resolve('cookies.txt');

function parseCookiesFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));
    const cookies = [];
    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length >= 7) {
        const name = parts[5];
        let value = parts[6];
        value = value.replace(/[\r\n\t]/g, '');
        cookies.push(`${name}=${value}`);
      }
    }
    return cookies.join('; ');
  } catch {
    return '';
  }
}

const cookieStr = parseCookiesFile(filePath);
console.log('Cookie string length:', cookieStr.length);
console.log('First 100 chars:', cookieStr.substring(0, 100));
