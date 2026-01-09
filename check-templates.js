require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');

async function inspect() {
    const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();

    const tables = ['week_templates', 'week_template_items'];
    let output = '';

    for (const table of tables) {
        output += `\n--- Table: ${table} ---\n`;
        const res = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = '${table}'
      ORDER BY ordinal_position;
    `);

        if (res.rows.length === 0) {
            output += '  (Table not found)\n';
        } else {
            res.rows.forEach(row => {
                output += `  ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} Default: ${row.column_default}\n`;
            });
        }
    }

    fs.writeFileSync('template_schema_dump.txt', output);
    console.log('Dumped schema to template_schema_dump.txt');
    await client.end();
}

inspect().catch(console.error);
