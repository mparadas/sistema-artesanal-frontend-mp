import { execSync } from 'child_process';

console.log('Regenerating package-lock.json...');
try {
  execSync('cd /vercel/share/v0-project && npm install --legacy-peer-deps', { 
    stdio: 'inherit',
    timeout: 120000 
  });
  console.log('Dependencies installed successfully!');
} catch (e) {
  console.error('Install failed:', e.message);
  process.exit(1);
}
