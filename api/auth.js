// api/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../backend/supabaseClient'); 
const app = express();
app.use(express.json());

// Vercel routes '/api/auth/register' to this file.
// The route here must be relative.
app.post('/register', async (req, res) => {
    const { id, name, email, password, role, roll_number, enrollment_number } = req.body;
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const { data, error }_ = await supabase.from('users').insert([{ id, name, email, password: hashedPassword, role, roll_number, enrollment_number }]);
        if (error) throw error;
        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        console.error('Supabase registration error:', error);
        if (error.code === '23505') return res.status(409).json({ error: 'Email or ID already exists.' });
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

const handleLogin = async (req, res, expectedRole) => {
    const { email, password } = req.body;
    try {
        const { data: user, error }_ = await supabase.from('users').select('*').eq('email', email).single();
        if (error || !user) return res.status(401).json({ error: 'Invalid credentials or user not found.' });
        if (user.role !== expectedRole) return res.status(403).json({ error: `Access denied. Please use the '${user.role}' login portal.` });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials.' });
        const payload = { user: { id: user.id, role: user.role, name: user.name } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: payload.user });
    } catch (error) {
        console.error(`Supabase login error for role ${expectedRole}:`, error);
        res.status(500).json({ error: 'Server error during login' });
    }
};

app.post('/teacher/login', (req, res) => handleLogin(req, res, 'teacher'));
app.post('/student/login', (req, res) => handleLogin(req, res, 'student'));

module.exports = app;