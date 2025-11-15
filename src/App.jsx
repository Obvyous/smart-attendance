import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.jsx';
import { LandingPage } from './pages/LandingPage.jsx';
import { TeacherLoginPage, TeacherRegisterPage, StudentLoginPage, StudentRegisterPage } from './pages/AuthPages.jsx';
import { TeacherDashboard, AttendanceReportsPage, CreateLecturePage } from './pages/TeacherPages.jsx';
import { StudentDashboard, ScanQRCodePage, ViewSchedulePage } from './pages/StudentPages.jsx';

// This API_URL logic is 100% correct for Vercel + Local testing
const API_URL = import.meta.env.PROD ? 'https://smart-attendance-1-49fb.onrender.com/api' : 'http://localhost:3001/api';

export default function App() {
    // --- STATE MANAGEMENT ---
    const [user, setUser] = useState(null);
    const [view, setView] = useState('landing');
    const [lectures, setLectures] = useState([]);
    const [activeLecture, setActiveLecture] = useState(null);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [registeredStudents, setRegisteredStudents] = useState([]); // Used for teacher reports
    // UPDATED: Use sessionStorage to log out when browser closes
    const [token, setToken] = useState(sessionStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);
    const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
    const [lectureNotification, setLectureNotification] = useState(null);

    // --- EFFECT HOOKS ---
    useEffect(() => {
        const initializeApp = async () => {
            // UPDATED: Use sessionStorage
            const storedToken = sessionStorage.getItem('token');
            const storedUser = JSON.parse(sessionStorage.getItem('user'));
            const urlParams = new URLSearchParams(window.location.search);
            const lectureIdFromUrl = urlParams.get('lectureId');

            if (storedToken && storedUser) {
                setUser(storedUser);
                setToken(storedToken);
                await fetchDataForUser(storedUser, storedToken, lectureIdFromUrl);
            } else if (lectureIdFromUrl) {
                // UPDATED: Use sessionStorage
                sessionStorage.setItem('pendingLectureId', lectureIdFromUrl);
                setView('studentLogin');
                setIsLoading(false);
            } else {
                setIsLoading(false);
            }
        };
        initializeApp();
    // THIS IS THE FIX: The dependency array MUST be empty '[]'
    // This ensures the app initializes only ONCE on page load.
    }, []); 
    
    useEffect(() => {
        if (user?.role === 'student' && notificationPermission === 'default') {
            Notification.requestPermission().then(setNotificationPermission);
        }
    }, [user, notificationPermission]);

    // --- DATA FETCHING LOGIC (COMPLETE) ---
    const fetchDataForUser = async (userData, userToken, lectureIdFromUrl = null) => {
        try {
            let lectureData = [];
            let attendanceData = [];

            if (userData.role === 'teacher') {
                const lectureRes = await fetch(`${API_URL}/teacher/lectures/${userData.id}`, { headers: { 'Authorization': `Bearer ${userToken}` } });
                if (!lectureRes.ok) throw new Error('Failed to fetch lectures');
                lectureData = await lectureRes.json();
                
                // We must also fetch all students and attendance for reports
                const studentsRes = await fetch(`${API_URL}/teacher/all-students`, { headers: { 'Authorization': `Bearer ${userToken}` } });
                const allAttendanceRes = await fetch(`${API_URL}/teacher/all-attendance`, { headers: { 'Authorization': `Bearer ${userToken}` } });

                if (studentsRes.ok) setRegisteredStudents(await studentsRes.json());
                if (allAttendanceRes.ok) setAttendanceRecords(await allAttendanceRes.json());

            } else { // Student role
                // Fetch in parallel to prevent race conditions
                const [lectureRes, attendanceRes] = await Promise.all([
                    fetch(`${API_URL}/student/lectures`, { headers: { 'Authorization': `Bearer ${userToken}` } }),
                    fetch(`${API_URL}/student/attendance/${userData.id}`, { headers: { 'Authorization': `Bearer ${userToken}` } })
                ]);
                
                if (!lectureRes.ok) throw new Error('Failed to fetch lectures');
                lectureData = await lectureRes.json();

                if (attendanceRes.ok) {
                    attendanceData = await attendanceRes.json();
                }
            }
            
            // Set state AFTER all data is fetched
            setLectures(lectureData);
            setAttendanceRecords(attendanceData);

            // Now, handle navigation
            if (lectureIdFromUrl && userData.role === 'student') {
                const lectureToAttend = lectureData.find(l => l.id === parseInt(lectureIdFromUrl));
                if (lectureToAttend) {
                    setLectureNotification(lectureToAttend);
                    setView('studentHome');
                } else {
                    setView('studentHome');
                }
            } else {
                setView(userData.role === 'teacher' ? 'teacherHome' : 'studentHome');
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };
    
    // --- NOTIFICATION & API HANDLERS ---
    const showNotification = (lecture) => {
        if (notificationPermission === 'granted' && lecture) {
            new Notification(`Attendance Open: ${lecture.name}`, { body: `Tap to mark your presence.`, icon: '/vite.svg' }).onclick = () => {
                handleAttendFromNotification(lecture);
            };
        }
    };

    const handleLogin = async (email, password, role) => {
        try {
            const res = await fetch(`${API_URL}/auth/${role}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');
            
            // UPDATED: Use sessionStorage
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('user', JSON.stringify(data.user));
            setToken(data.token);
            setUser(data.user);
            
            if (data.user.role === 'student' && !registeredStudents.find(s => s.id === data.user.id)) {
                setRegisteredStudents(prev => [...prev, data.user]);
            }
            
            // UPDATED: Use sessionStorage
            const pendingLectureId = sessionStorage.getItem('pendingLectureId');
            await fetchDataForUser(data.user, data.token, pendingLectureId);
            if (pendingLectureId) sessionStorage.removeItem('pendingLectureId');
        } catch (error) {
            alert(`Login Failed: ${error.message}`);
        }
    };

    const handleRegister = async (formData) => {
        try {
            const res = await fetch(`${API_URL}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration failed');
            
            if(formData.role === 'student') {
                setRegisteredStudents(prev => [...prev, formData]);
            }

            alert('Registration successful! Please log in.');
            setView(formData.role === 'teacher' ? 'teacherLogin' : 'studentLogin');
        } catch (error) {
            alert(`Registration Failed: ${error.message}`);
        }
    };

    const handleLogout = () => {
        // UPDATED: Use sessionStorage
        sessionStorage.clear();
        setUser(null); setToken(null); setView('landing');
        setLectures([]); setActiveLecture(null); setAttendanceRecords([]);
        window.history.pushState({}, '', window.location.pathname);
    };

    const addLecture = async (lectureData) => {
        try {
            const res = await fetch(`${API_URL}/teacher/lectures`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ ...lectureData, teacher_id: user.id }) });
            const newLecture = await res.json();
            if (!res.ok) throw new Error(newLecture.error || 'Failed to create lecture');
            setLectures(prev => [{ ...newLecture, teacher_name: user.name }, ...prev]);
            return newLecture;
        } catch (error) {
            alert(`Error: ${error.message}`);
            return null;
        }
    };
    
    const markAttendance = async (lectureId) => {
        if (!lectureId) {
             alert("Invalid Lecture ID.");
             return false;
        }
        try {
            const res = await fetch(`${API_URL}/student/mark-attendance`, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
                body: JSON.stringify({ lectureId: lectureId, studentId: user.id }) 
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to mark attendance');
            setAttendanceRecords(prev => [...prev, { id: data.newRecordId, lecture_id: parseInt(lectureId), student_id: user.id, status: 'present', timestamp: new Date().toISOString() }]);
            return true;
        } catch (error) {
            alert(`Attendance Failed: ${error.message}`);
            return false;
        }
    };

    const handleSetActiveLecture = (lecture) => {
        setActiveLecture(lecture);
        if (lecture) {
            setLectureNotification(lecture);
            showNotification(lecture);
        }
    };
    
    const handleAttendFromNotification = (lecture) => {
        if (lecture) {
            setActiveLecture(lecture);
            setView('scanQRCode'); // Go to the scanner page
        }
        setLectureNotification(null);
    };

    // --- RENDER LOGIC (CORRECTED) ---
    const renderContent = () => {
        if (isLoading) return <div className="flex justify-center items-center h-screen"><h1 className="text-2xl font-bold">Loading...</h1></div>;

        if (user) {
            switch (view) {
                case 'teacherHome': return <TeacherDashboard user={user} setView={setView} lectures={lectures} activeLecture={activeLecture} setActiveLecture={handleSetActiveLecture} token={token} allStudents={registeredStudents} />;
                // THIS IS THE FIX: Pass 'attendanceRecords' and 'allStudents' to the reports page
                case 'reports': return <AttendanceReportsPage setView={setView} lectures={lectures} attendanceRecords={attendanceRecords} allStudents={registeredStudents} teacherId={user.id} token={token} />;
                case 'createLecture': return <CreateLecturePage setView={setView} addLecture={addLecture} setActiveLecture={handleSetActiveLecture} />;
                
                case 'studentHome': return <StudentDashboard user={user} setView={setView} lectures={lectures} attendanceRecords={attendanceRecords} lectureNotification={lectureNotification} onAttendNow={handleAttendFromNotification} />;
                case 'scanQRCode': return <ScanQRCodePage setView={setView} markAttendance={markAttendance} />;
                case 'viewSchedule': return <ViewSchedulePage setView={setView} lectures={lectures} />;
                
                default: setView(user.role === 'teacher' ? 'teacherHome' : 'studentHome'); return null;
            }
        }
        
        switch (view) {
            case 'teacherLogin': return <TeacherLoginPage setView={setView} onLogin={handleLogin} />;
            case 'teacherRegister': return <TeacherRegisterPage setView={setView} onRegister={handleRegister} />;
            case 'studentLogin': return <StudentLoginPage setView={setView} onLogin={handleLogin} />;
            case 'studentRegister': return <StudentRegisterPage setView={setView} onRegister={handleRegister} />;
            default: return <LandingPage setView={setView} />;
        }
    };

    return (
        <>
            <Navbar user={user} setView={setView} onLogout={handleLogout} />
            <div key={view} className="animate-fadeIn">
                {renderContent()}
            </div>
        </>
    );
}
