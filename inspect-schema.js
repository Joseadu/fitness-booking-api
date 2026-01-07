const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envConfig = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        let val = parts.slice(1).join('=').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        envConfig[key] = val;
    }
});

const client = new Client({
    connectionString: envConfig.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const TARGET_TABLES = [
    'profiles',
    'boxes',
    'disciplines',
    'schedules',
    'bookings',
    'box_memberships',
    'week_templates',
    'week_template_items'
];

async function inspect() {
    try {
        await client.connect();

        for (const table of TARGET_TABLES) {
            console.log(`\n--- TABLE: ${table} ---`);
            const res = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = $1
            ORDER BY ordinal_position
        `, [table]);

            if (res.rows.length === 0) {
                console.log('(Table not found or empty permissions)');
                continue;
            }

            res.rows.forEach(col => {
                console.log(`  ${col.column_name.padEnd(20)} | ${col.data_type.padEnd(15)} | Null: ${col.is_nullable} | Def: ${col.column_default ? 'yes' : 'no'}`);
            });
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

inspect();
