import fs from 'fs';
import path from 'path';

const srcDir = 'C:\\Users\\bverag\\.gemini\\antigravity\\brain\\f282b651-6b39-4d24-ad52-3a5ad35217fc';
const destDir = 'c:\\Users\\bverag\\Downloads\\JUEGO-NICE\\js\\data';
const destFile = path.join(destDir, 'images.js');

try {
  if (!fs.existsSync(srcDir)) {
    console.error(`Source directory does not exist: ${srcDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(srcDir);
  const images = {
    warrior: '',
    archer: '',
    mage: '',
    npc_elder: '',
    npc_curandera: '',
    npc_merchant: ''
  };

  files.forEach(f => {
    const fullPath = path.join(srcDir, f);
    if (f.startsWith('avatar_warrior') && f.endsWith('.png')) {
      images.warrior = fs.readFileSync(fullPath).toString('base64');
    }
    if (f.startsWith('avatar_archer') && f.endsWith('.png')) {
      images.archer = fs.readFileSync(fullPath).toString('base64');
    }
    if (f.startsWith('avatar_mage') && f.endsWith('.png')) {
      images.mage = fs.readFileSync(fullPath).toString('base64');
    }
    if (f.startsWith('npc_elder') && f.endsWith('.png')) {
      images.npc_elder = fs.readFileSync(fullPath).toString('base64');
    }
    if (f.startsWith('npc_curandera') && f.endsWith('.png')) {
      images.npc_curandera = fs.readFileSync(fullPath).toString('base64');
    }
    if (f.startsWith('npc_merchant') && f.endsWith('.png')) {
      images.npc_merchant = fs.readFileSync(fullPath).toString('base64');
    }
  });

  // Ensure output dir exists
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const fileContent = `// Base64 compiled high-fidelity illustrations to bypass local path restrictions
export const CHARACTER_IMAGES = ${JSON.stringify(images, null, 2)};
`;

  fs.writeFileSync(destFile, fileContent);
  console.log('================================================================');
  console.log('🎉 ¡PORTRETS COMPILADOS CON ÉXITO A BASE64 EN js/data/images.js!');
  console.log('================================================================');
} catch (err) {
  console.error('Error compiling assets:', err);
}
