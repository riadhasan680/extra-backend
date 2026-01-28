try {
  const config = require('./medusa-config.js');
  console.log('Config loaded successfully');
  console.log(JSON.stringify(config, null, 2));
} catch (e) {
  console.error('Failed to load config:', e);
}