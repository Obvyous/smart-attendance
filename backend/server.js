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

// --- Middleware Setup ---
// Allow CORS requests from the Vercel frontend domain
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', // Use the FRONTEND_URL environment variable for security
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // Allow server to accept JSON data

// --- Health Check / Base Route ---
app.get('/', (req, res) => {
    res.send('Smart Attendance Backend is running!');
});

// --- API Router Setup (SYNCHRONIZED WITH FRONTEND) ---
// Mounting all specific role routers under the /api/v1 prefix
app.use('/api/v1/auth', authRoutes);     
app.use('/api/v1/teacher', teacherRoutes);  
app.use('/api/v1/student', studentRoutes);  

// --- Server Startup ---
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
