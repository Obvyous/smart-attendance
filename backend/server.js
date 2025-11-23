const express = require('express');
const cors = require('cors'); 
// Ensure dotenv is imported if you are using a local .env file during development
// require('dotenv').config(); 

// Import all routers
const authRoutes = require('./routes/auth');
const teacherRoutes = require('./routes/teacher');
const studentRoutes = require('./routes/student');

const app = express();
// Render provides this PORT, or we use 3001 for local testing
const PORT = process.env.PORT || 3001;

// --- CORS Configuration (ROBUST FIX) ---
// Gets a comma-separated list of origins, plus a fallback for local testing
const ALLOWED_ORIGINS = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : ['http://localhost:3000', 'http://localhost:5173']; // Default local origins

const corsOptions = {
    // FIX: Uses the standard CORS package implementation for origin checking
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true 
};

app.use(cors(corsOptions)); // Use the robust CORS options
app.use(express.json()); // Allow server to accept JSON data

// --- Health Check / Base Route ---
app.get('/', (req, res) => {
    res.send('Smart Attendance Backend is running!');
});

// --- API Router Setup (SYNCHRONIZED WITH FRONTEND) ---
app.use('/api/v1/auth', authRoutes);     
app.use('/api/v1/teacher', teacherRoutes);  
app.use('/api/v1/student', studentRoutes);  

// --- Server Startup ---
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
