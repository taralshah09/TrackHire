/**
 * One-time migration: fix the B-tree index on fulltime_jobs that breaks when
 * description text is long (btree max ~2704 bytes per index row).
 *
 * Usage: node scripts/migrate_fix_description_index.js
 */
const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, ".env") });

const DB_SCHEMA = process.env.DB_SCHEMA || "jobs_tracker_v1";

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 5432,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    options: `-c search_path=${DB_SCHEMA}`,
});

async function migrate() {
    const client = await pool.connect();
    try {
        const tables = ["jobs", "fulltime_jobs", "intern_jobs"];
        for (const tbl of tables) {
            const res = await client.query(`
                SELECT indexname FROM pg_indexes
                WHERE schemaname = $1
                  AND tablename = $2
                  AND indexdef ILIKE '%description%'
                  AND indexdef NOT ILIKE '%gin%';
            `, [DB_SCHEMA, tbl]);

            for (const row of res.rows) {
                console.log(`Dropping B-tree description index on ${tbl}: ${row.indexname}`);
                await client.query(`DROP INDEX IF EXISTS ${DB_SCHEMA}."${row.indexname}";`);
                console.log(`✅ Dropped ${row.indexname}`);
            }

            // Ensure a GIN index exists for full-text search
            const ginName = `idx_${tbl}_title_description_fts`;
            console.log(`Ensuring GIN index on ${tbl}...`);
            await client.query(`
                CREATE INDEX IF NOT EXISTS ${ginName}
                ON ${tbl}
                USING gin(to_tsvector('english',
                    coalesce(title, '') || ' ' || coalesce(description, '')
                ));
            `);
            console.log(`✅ GIN index ready on ${tbl}.`);
        }

        console.log("\nMigration complete.");
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
