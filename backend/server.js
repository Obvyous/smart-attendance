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

// --- CORS Configuration (FIXED to allow multiple origins) ---
const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(url => url.trim()) : ['*'];

const corsOptions = {
    // FIX: Checks if the requesting origin is in the allowed list
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        // Allow if origin is in the explicitly defined list
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        // Block all other origins
        callback(new Error('Not allowed by CORS'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions)); // Use the custom CORS options
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
