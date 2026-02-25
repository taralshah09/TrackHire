const pool = require("./db_pool");

async function check() {
    try {
        const res = await pool.query(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_schema IN ('public', 'jobs_tracker_v1')
            ORDER BY table_schema, table_name
        `);
        console.log("Tables found:");
        res.rows.forEach(r => console.log(` - ${r.table_schema}.${r.table_name}`));
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

check();
