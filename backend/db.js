require('dotenv').config();
const { Pool } = require('pg');

let pool;

if (process.env.DATABASE_URL) {
    // LIVE deployment (Render/Supabase/Heroku)
    console.log("Connecting using DATABASE_URL...");
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
} else if (
    process.env.SUPABASE_DB_HOST &&
    process.env.SUPABASE_DB_PASSWORD &&
    process.env.SUPABASE_DB_USER
) {
    // LOCAL development with Supabase/Postgres
    console.log("Connecting to Supabase/Postgres for local development...");
    pool = new Pool({
        host: process.env.SUPABASE_DB_HOST,
        port: 5432,
        user: process.env.SUPABASE_DB_USER,
        password: process.env.SUPABASE_DB_PASSWORD,
        database: process.env.SUPABASE_DB_NAME || 'postgres'
    });
} else {
    console.error("Database connection string not found. Please check your backend/.env file.");
    process.exit(1);
}

module.exports = pool;
