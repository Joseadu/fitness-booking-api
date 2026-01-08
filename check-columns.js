require('dotenv').config();
const { Client } = require('pg');

async function inspect() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'box_memberships';
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

inspect().catch(console.error);
