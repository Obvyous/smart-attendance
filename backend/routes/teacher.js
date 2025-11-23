const express = require('express');
const router = express.Router(); // Use express.Router() to define routes
const supabase = require('../supabaseClient'); // Assuming this path is correct relative to the main server file

// Note: This router does not need to call app.use(express.json()) or require express twice.

/**
 * @route POST /lectures
 * @description Creates a new lecture record and returns the QR code URL.
 */
router.post('/lectures', async (req, res) => {
    // Expecting subject, date, time, and teacher_id from the front-end form
    const { subject, date, time, teacher_id } = req.body;
    
    // Auto-generate the 'name' field
    const name = `${subject} - ${date}`;

    // IMPORTANT: Make sure FRONTEND_URL is set in your Render environment variables (e.g., https://smart-attendance-c71a.vercel.app)

    try {
        const { data, error } = await supabase
            .from('lectures')
            .insert({ name, subject, date, time, teacher_id })
            .select('id')
            .single();

        if (error) throw error;
        
        const newLectureId = data.id;
        // Use the environment variable for the frontend URL
        const qrUrl = `${process.env.FRONTEND_URL}/attend?lectureId=${newLectureId}`;
        
        res.status(201).json({
            id: newLectureId,
            qrUrl: qrUrl,
            name, subject, time, teacher_id
        });
    } catch (error) {
        // Log the full error to the console for debugging the 500 error
        console.error("Error creating lecture:", error.message || error);
        res.status(500).json({ error: 'Server error while creating lecture' });
    }
});

/**
 * @route GET /lectures/:teacherId
 * @description Gets all lectures for a specific teacher.
 */
router.get('/lectures/:teacherId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('lectures')
            .select('*')
            .eq('teacher_id', req.params.teacherId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Map the data to include the QR code URL using the environment variable
        const lecturesWithQrUrls = data.map(lecture => ({
            ...lecture,
            qrUrl: `${process.env.FRONTEND_URL}/attend?lectureId=${lecture.id}`
        }));

        res.json(lecturesWithQrUrls);
    } catch (error) {
        console.error("Error fetching teacher lectures:", error.message || error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route GET /reports/defaulters/:teacherId
 * @description Gets the defaulter report using a Supabase Remote Procedure Call (RPC).
 */
router.get('/reports/defaulters/:teacherId', async (req, res) => {
    try {
        // Calls the 'get_defaulters' function in Supabase
        const { data, error } = await supabase.rpc('get_defaulters', {
            teacher_id_param: req.params.teacherId
        });

        if (error) throw error;
        
        // This is a simulation/logging step, not strictly necessary for the API response
        if(data.length > 0) {
            console.log(`Defaulters found for Teacher ${req.params.teacherId}:`);
            data.forEach(defaulter => console.log(`- ${defaulter.name} (${defaulter.percentage_present}%)`));
        }
        
        res.json(data);
    } catch (error) {
        console.error("Error fetching defaulter report:", error.message || error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route GET /lectures/:lectureId/attendance
 * @description Gets live attendance records for a specific active lecture.
 */
router.get('/lectures/:lectureId/attendance', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('attendance')
            .select(`
                id,
                timestamp,
                users ( name ) // Fetch student name from the linked 'users' table
            `)
            .eq('lecture_id', req.params.lectureId)
            .order('timestamp', { ascending: true });

        if (error) throw error;
        
        // Flatten the nested data structure for easier front-end consumption
        const records = data.map(record => ({
            id: record.id,
            timestamp: record.timestamp,
            student_name: record.users ? record.users.name : 'Unknown'
        }));

        res.json(records);
    } catch (error) {
        console.error("Error fetching live attendance:", error.message || error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route GET /lecture-report/:lectureId
 * @description Gets the detailed day-wise report for a single lecture.
 */
router.get('/lecture-report/:lectureId', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('attendance')
            .select(`
                id,
                timestamp,
                users ( id, name, roll_number, enrollment_number ) // Fetch student details
            `)
            .eq('lecture_id', req.params.lectureId)
            // Assuming you only want 'present' records for the report
            // .eq('status', 'present') 
            .order('timestamp', { ascending: true });

        if (error) throw error;

        // Flatten the data for the frontend
        const reportData = data.map(record => ({
            attendance_id: record.id,
            timestamp: record.timestamp,
            student_id: record.users ? record.users.id : 'N/A',
            student_name: record.users ? record.users.name : 'Unknown',
            roll_number: record.users ? record.users.roll_number : 'N/A',
            enrollment_number: record.users ? record.users.enrollment_number : 'N/A'
        }));
        
        res.json(reportData);
    } catch (error) {
        console.error("Error fetching lecture report:", error.message || error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
