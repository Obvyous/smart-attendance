const express = require('express');
const router = express.Router(); 
// FIX 1: Import the Supabase client, not the raw PostgreSQL pool
const supabase = require('../supabaseClient'); 

/**
 * @route POST /mark-attendance
 * @description Marks attendance for a student in a specific lecture.
 */
router.post('/mark-attendance', async (req, res) => {
    // Expecting lectureId and studentId from the front-end
    const { lectureId, studentId } = req.body; 

    try {
        // 1. Check if attendance is already marked (Supabase equivalent of SELECT)
        const { data: existingData, error: checkError } = await supabase
            .from('attendance')
            .select('id')
            .eq('lecture_id', lectureId)
            .eq('student_id', studentId);

        if (checkError) throw checkError;

        if (existingData && existingData.length > 0) {
            return res.status(409).json({ message: 'Attendance already marked for this lecture.' });
        }

        // 2. Insert the new attendance record (Supabase equivalent of INSERT)
        const { data: insertData, error: insertError } = await supabase
            .from('attendance')
            .insert([
                { lecture_id: lectureId, student_id: studentId, status: 'present' }
            ])
            .select('id')
            .single();

        if (insertError) throw insertError;
        
        res.status(201).json({ 
            message: 'Attendance marked successfully!',
            newRecordId: insertData.id 
        });

    } catch (error) {
        // Log the full error for debugging
        console.error("Error in /mark-attendance:", error.message || error);
        res.status(500).json({ error: 'Server error while marking attendance.' });
    }
});

/**
 * @route GET /lectures
 * @description Gets a list of all lectures along with the teacher's name.
 */
router.get('/lectures', async (req, res) => {
    try {
        // FIX 2: Use Supabase select with Foreign Table Joins ('select' function)
        // Selects all lecture fields (*) and performs a join to fetch the teacher's name.
        const { data, error } = await supabase
            .from('lectures')
            .select(`
                *,
                teacher:users ( name )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Flatten the data to make it easier for the frontend (e.g., lecture.teacher_name)
        const lectures = data.map(lecture => ({
            ...lecture,
            teacher_name: lecture.teacher ? lecture.teacher.name : 'Unknown Teacher'
        }));
        
        res.json(lectures);
        
    } catch (error) {
        console.error("Error fetching lectures for student:", error.message || error);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @route GET /attendance/:studentId
 * @description Gets a specific student's full attendance history.
 */
router.get('/attendance/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        
        // FIX 3: Use Supabase .eq() for filtering
        const { data, error } = await supabase
            .from('attendance')
            .select(`
                *,
                lecture:lectures ( name, subject, date, time ) // Fetch lecture details for context
            `) 
            .eq('student_id', studentId)
            .order('timestamp', { ascending: false });

        if (error) throw error;
        
        // Flatten the data for easy consumption
        const history = data.map(record => ({
            ...record,
            lecture_name: record.lecture.name,
            lecture_subject: record.lecture.subject,
            lecture_date: record.lecture.date,
            lecture_time: record.lecture.time,
            lecture: undefined // Remove the nested object
        }));
        
        res.json(history);
        
    } catch (error) {
        console.error("Error fetching attendance history:", error.message || error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
