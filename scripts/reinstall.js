import { execSync } from 'child_process';
import { rmSync, existsSync } from 'fs';

const projectDir = '/vercel/share/v0-project';

// Step 1: Remove corrupted lockfile and node_modules
console.log('Step 1: Removing corrupted package-lock.json and node_modules...');
try {
  if (existsSync(`${projectDir}/package-lock.json`)) {
    rmSync(`${projectDir}/package-lock.json`, { force: true });
    console.log('Removed package-lock.json');
  }
  if (existsSync(`${projectDir}/node_modules`)) {
    rmSync(`${projectDir}/node_modules`, { recursive: true, force: true });
    console.log('Removed node_modules');
  }
} catch (e) {
  console.log('Cleanup warning:', e.message);
}

// Step 2: Run npm install to regenerate everything fresh
console.log('Step 2: Running npm install...');
try {
  execSync('npm install --legacy-peer-deps', { 
    cwd: projectDir,
    stdio: 'inherit',
    timeout: 180000,
    env: { ...process.env, npm_config_fund: 'false', npm_config_audit: 'false' }
  });
  console.log('Dependencies installed successfully!');
} catch (e) {
  console.error('npm install failed:', e.message);
  process.exit(1);
}

// Step 3: Verify vite version in lockfile
console.log('Step 3: Verifying installation...');
try {
  const result = execSync('npx vite --version', { cwd: projectDir, encoding: 'utf-8' });
  console.log('Vite version:', result.trim());
} catch (e) {
  console.log('Vite check warning:', e.message);
}
