require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const url = require('url'); // <-- NEW: Import Node's URL module for parsing

// --- Deriving SUPABASE_URL from DATABASE_URL ---
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    throw new Error("Missing DATABASE_URL environment variable.");
}

try {
    // 1. Parse the PostgreSQL connection string
    // This handles the structure: postgresql://[user]:[pass]@[hostname]:[port]/[db_name]
    const parsedUrl = url.parse(dbUrl); 
    let supabaseUrl;

    // Extract hostname (e.g., db.heegldqwbtywjzmwmqra.supabase.co)
    const dbHostname = parsedUrl.hostname;

    // 2. Derive the required Supabase REST URL format (https://[project-ref].supabase.co)
    if (dbHostname && dbHostname.startsWith('db.')) {
        // Remove 'db.' prefix and use HTTPS protocol
        supabaseUrl = `https://${dbHostname.substring(3)}`;
    } else {
        // This handles cases where the DATABASE_URL format is non-standard
        throw new Error("Hostname format unexpected. Could not derive Supabase URL from DATABASE_URL.");
    }

    // 3. Supabase Key Check (Still Required)
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY; 

    if (!supabaseKey) {
        throw new Error("Missing Supabase key. Ensure SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) is set in environment variables.");
    }

    // 4. Create the client using the derived URL and provided key
    const supabase = createClient(supabaseUrl, supabaseKey);

    module.exports = supabase;
    
} catch (error) {
    // Catch errors from URL parsing or derivation
    console.error("Error setting up Supabase client:", error.message);
    throw new Error("Failed to configure Supabase client. Check DATABASE_URL format.");
}
