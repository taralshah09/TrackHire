const pool = require("./db_pool");

async function check() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log("Tables in DB:");
        res.rows.forEach(r => console.log(` - ${r.table_name}`));
    } catch (err) {
        console.error("Error checking tables:", err);
    } finally {
        client.release();
        pool.end();
    }
}

check();
