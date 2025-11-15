// api/student.js
const express = require('express');
const supabase = require('../backend/supabaseClient'); 
const app = express();
app.use(express.json());

app.post('/mark-attendance', async (req, res) => {
    const { lectureId, studentId } = req.body; 
    try {
        const { data: existing, error: checkError }_ = await supabase.from('attendance').select('id').eq('lecture_id', lectureId).eq('student_id', studentId);
        if (checkError) throw checkError;
        if (existing.length > 0) return res.status(409).json({ message: 'Attendance already marked for this lecture.' });
        const { data, error }_ = await supabase.from('attendance').insert({ lecture_id: lectureId, student_id: studentId, status: 'present' }).select('id').single();   
        if (error) throw error;
        res.status(201).json({ message: 'Attendance marked successfully!', newRecordId: data.id });
    } catch (error) {
        console.error("Error in /mark-attendance:", error);
        res.status(500).json({ error: 'Server error while marking attendance.' });
    }
});

app.get('/lectures', async (req, res) => {
    try {
        const { data, error }_ = await supabase.from('lectures').select(`*, users ( name )`).order('created_at', { ascending: false });
        if (error) throw error;
        const lectures = data.map(lecture => ({ ...lecture, teacher_name: lecture.users ? lecture.users.name : 'Unknown Teacher' }));
        res.json(lectures);
    } catch (error) {
        console.error("Error fetching lectures for student:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/attendance/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { data, error }_ = await supabase.from('attendance').select('*').eq('student_id', studentId).order('timestamp', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error("Error fetching attendance history:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = app;