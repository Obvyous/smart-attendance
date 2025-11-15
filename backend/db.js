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
}  else {
    console.error("Database connection string not found. Please check your backend/.env file.");
    process.exit(1);
}

module.exports = pool;
