console.log("Script started");
const { Client } = require('pg');

const candidates = [
  "postgres://postgres:edux_password@localhost:5432/medusa-backend",
  "postgres://postgres:edux_password@localhost:5432/medusa_db",
];

async function tryConnect(url) {
  console.log("---------------------------------------------------");
  console.log("Testing URL:", url.replace(/:[^:]*@/, ':****@')); 
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    console.log("✅ Connected successfully!");
    const res = await client.query('SELECT NOW()');
    console.log('Time:', res.rows[0]);
    await client.end();
    return true;
  } catch (err) {
    console.log("❌ Failed:", err.message);
    if (err.message.includes("database") && err.message.includes("does not exist")) {
        console.log("Database does not exist, but authentication might be correct.");
        return true; // We found the password, just wrong DB
    }
    return false;
  }
}

async function testAll() {
  for (const url of candidates) {
    if (await tryConnect(url)) {
      console.log("\nFound working credentials!");
      console.log(url);
      // Don't break if it's just DB missing, we want to see if other DB works
    }
  }
}

testAll();
