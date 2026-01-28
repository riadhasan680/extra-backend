
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres:edux_password@localhost:5432/medusa_db',
});

console.log('Connecting to database...');
client.connect()
  .then(() => {
    console.log('Connected successfully');
    return client.end();
  })
  .catch(err => {
    console.error('Connection error', err.stack);
    process.exit(1);
  });
