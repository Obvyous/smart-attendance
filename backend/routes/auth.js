const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// FIX 1: Import the Supabase client for database interaction
const supabase = require('../supabaseClient'); 

// --- User Registration (Supabase syntax) ---
router.post('/register', async (req, res) => {
    // Note: Supabase's auth service usually handles user creation, 
    // but here we are using the 'users' table directly for custom fields (roll_number, etc.)
    const { id, name, email, password, role, roll_number, enrollment_number } = req.body;
    
    // Validate required fields
    if (!email || !password || !name || !role) {
        return res.status(400).json({ error: 'Missing required registration fields.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // FIX 2: Use Supabase .insert() for registration
        const { error } = await supabase
            .from('users')
            .insert({ 
                id, 
                name, 
                email, 
                password: hashedPassword, // Storing hashed password in 'users' table
                role, 
                roll_number: roll_number || null, 
                enrollment_number: enrollment_number || null 
            });
        
        if (error) throw error;
        
        res.status(201).json({ message: 'User registered successfully!' });

    } catch (error) {
        console.error('Registration Error:', error.message || error);
        
        // Supabase error codes for uniqueness violations might differ from raw PostgreSQL
        // Assuming PostgreSQL unique constraint error on email/id: 
        if (error.code === '23505') { 
            return res.status(409).json({ error: 'Email or ID already exists.' });
        }
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

// --- Role-Specific Login Logic (Helper Function) ---
const handleLogin = async (req, res, expectedRole) => {
    const { email, password } = req.body;
    
    // SECURITY CHECK: Ensure JWT_SECRET is available
    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET environment variable is not set!");
        return res.status(500).json({ error: 'Server configuration error: JWT secret missing.' });
    }

    try {
        // FIX 3: Use Supabase .select().eq() for fetching user
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is for 'no rows found'

        const user = data;

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials or user not found.' });
        }
        
        if (user.role !== expectedRole) {
            return res.status(403).json({ error: `Access denied. Please use the '${user.role}' login portal.` });
        }

        // 4. Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // 5. Generate JWT
        const payload = { user: { id: user.id, role: user.role, name: user.name } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }); // Increased expiry for testing
        
        res.json({ token, user: payload.user });

    } catch (error) {
        console.error(`Login Error for ${expectedRole}:`, error.message || error);
        // This is the line where the ENETUNREACH error was occurring previously
        res.status(500).json({ error: 'Server error during login.' });
    }
};

// --- Separate Login Routes ---
router.post('/teacher/login', (req, res) => handleLogin(req, res, 'teacher'));
router.post('/student/login', (req, res) => handleLogin(req, res, 'student'));

module.exports = router;
