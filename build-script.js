// Pre-load rxjs to ensure it's loaded as JS before ts-node hooks in
try {
  require('rxjs');
  console.log('rxjs preloaded');
} catch (e) {
  console.log('Could not preload rxjs:', e.message);
}

// Register ts-node with explicit ignore
require('ts-node').register({
  swc: true,
  ignore: ['node_modules']
});
require('tsconfig-paths').register();

// Use the export path that matches package.json exports
// If this fails, we might need to use absolute path
const build = require('@medusajs/medusa/commands/build').default;

console.log('Starting custom build script...');

async function run() {
  try {
    await build({
      directory: process.cwd(),
      adminOnly: false
    });
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
}

run();
