require('dotenv').config();
const express = require('express');
const cors = require('cors'); 

// Import all routers
const authRoutes = require('./routes/auth');
const teacherRoutes = require('./routes/teacher');
const studentRoutes = require('./routes/student');

const app = express();
// Render provides this PORT, or we use 3001 for local testing
const PORT = process.env.PORT || 3001;

// --- Middleware Setup ---
app.use(cors()); // Allow requests from your Vercel frontend
app.use(express.json()); // Allow server to accept JSON data

// --- Health Check / Base Route ---
app.get('/', (req, res) => {
    res.send('Smart Attendance Backend is running ;D!');
});

// --- API Router Setup (FIX) ---
// By mounting all routers under a single prefix like '/api/v1',
// the full URL becomes standardized (e.g., /api/v1/teacher/login, /api/v1/lectures).
app.use('/api/v1', authRoutes);     // Handles /api/v1/register, /api/v1/teacher/login, etc.
app.use('/api/v1', teacherRoutes);  // Handles /api/v1/lectures, /api/v1/reports, etc.
app.use('/api/v1', studentRoutes);  // Handles /api/v1/mark-attendance, /api/v1/attendance/:id, etc.

// --- Server Startup ---
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
