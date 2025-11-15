import React, { useState, useEffect } from 'react';
import { InputField } from '../components/InputField.jsx';
import { BookOpenIcon, PlusIcon, QrCodeIcon, CalendarIcon, DownloadIcon, BarChartIcon } from '../components/Icons.jsx';

// Define the API_URL at the top of the file to be used by all components
const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

// --- Helper function to trigger CSV download ---
const downloadCSV = (csvContent, fileName) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const TeacherDashboard = ({ user, setView, lectures, activeLecture, setActiveLecture, token, allStudents }) => {
    const [liveAttendance, setLiveAttendance] = useState([]);
    const [countdown, setCountdown] = useState(30);

    useEffect(() => {
        if (!activeLecture) {
            setLiveAttendance([]); 
            return;
        }
        setCountdown(30);

        const fetchLiveAttendance = async () => {
            try {
                // THIS IS THE FIX: Use the API_URL variable
                const res = await fetch(`${API_URL}/teacher/lectures/${activeLecture.id}/attendance`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) setLiveAttendance(data);
            } catch (error) {
                console.error("Failed to fetch live attendance:", error);
            }
        };

        fetchLiveAttendance();
        const pollInterval = setInterval(fetchLiveAttendance, 5000); 
        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    clearInterval(pollInterval);
                    setActiveLecture(null); 
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => { clearInterval(pollInterval); clearInterval(countdownInterval); };
    }, [activeLecture, token, setActiveLecture]);

    const handleDownloadLectureReport = async (lecture) => {
        try {
            const res = await fetch(`${API_URL}/teacher/lecture-report/${lecture.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch report');
            
            const headers = "Student ID,Roll Number,Enrollment Number,Name,Time Attended\n";
            let rows = "";

            if (data.length > 0) {
                rows = data.map(row => 
                    `${row.student_id},${row.roll_number || 'N/A'},${row.enrollment_number || 'N/A'},"${row.student_name}",${new Date(row.timestamp).toLocaleString()}`
                ).join('\n');
            } else {
                // This fixes your "No data" issue. We'll still download a file.
                rows = "No students attended this lecture.";
            }
            
            downloadCSV(headers + rows, `lecture_${lecture.name.replace(/\s+/g, '_')}_report.csv`);

        } catch (error) {
            console.error("Failed to download report:", error);
            alert("Error downloading report.");
        }
    };
    
    return (
        <main className="p-4 md:p-8">
            {activeLecture ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white/80 p-6 rounded-2xl shadow-lg text-center">
                        <h2 className="text-2xl font-bold mb-2 text-green-600">Lecture is Active!</h2>
                        <p className="text-slate-500 mb-2">QR code will expire in:</p>
                        <p className="text-4xl font-bold text-red-600 mb-4">{countdown}s</p>
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(activeLecture.qrUrl)}`} 
                            alt="Active QR Code" 
                            className="mx-auto rounded-lg shadow-md"
                        />
                        <div className="mt-4 text-left bg-slate-50 p-4 rounded-lg">
                            <h3 className="font-bold text-lg">{activeLecture.name}</h3>
                            <p className="text-sm text-slate-500">{activeLecture.time}</p>
                        </div>
                        <button onClick={() => setActiveLecture(null)} className="mt-4 w-full bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600">
                            Deactivate Manually
                        </button>
                    </div>
                     <div className="bg-white/80 p-6 rounded-2xl shadow-lg">
                        <h3 className="text-xl font-bold mb-4">Live Attendance ({liveAttendance.length})</h3>
                        <div className="space-y-3 h-96 overflow-y-auto">
                            {liveAttendance.length > 0 ? liveAttendance.map(record => (
                                <div key={record.id} className="flex justify-between items-center bg-green-50 p-3 rounded-lg">
                                    <p className="font-semibold">{record.student_name}</p>
                                    <span className="text-sm text-green-700">{new Date(record.timestamp).toLocaleTimeString()}</span>
                                </div>
                            )) : <p className="text-slate-500 text-center mt-16">Waiting for students...</p>}
                        </div>
                    </div>
                </div>
            ) : (
                 <div className="text-center bg-white/80 rounded-2xl p-8 md:p-12 mb-8">
                    <h2 className="text-2xl font-bold">No Active Lecture</h2>
                    <p className="text-slate-500 mt-2">Select a lecture from the list below.</p>
                </div>
            )}
            
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                 <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-[#021024]">My Lectures</h2>
                    <p className="text-slate-600">Activate a lecture or download a past report.</p>
                </div>
                <button onClick={() => setView('createLecture')} className="w-full md:w-auto bg-[#052659] text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2">
                    <PlusIcon className="w-5 h-5" /> Create New Lecture
                </button>
            </div>
            
            {lectures.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {lectures.map(lecture => (
                        <div key={lecture.id} className={`bg-white/80 p-6 rounded-2xl shadow-lg flex flex-col justify-between border-2 ${activeLecture?.id === lecture.id ? 'border-green-500' : 'border-transparent'}`}>
                            <div>
                                <h3 className="font-bold text-xl">{lecture.name}</h3>
                                <p className="text-slate-500">{lecture.subject}</p>
                                <p className="text-sm text-slate-400 mt-2">{lecture.time}</p>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <button onClick={() => setActiveLecture(lecture)} disabled={!!activeLecture} className="w-1/2 bg-green-500 text-white font-semibold py-2 rounded-lg hover:bg-green-600 disabled:bg-slate-400">
                                    Set Active
                                </button>
                                <button onClick={() => handleDownloadLectureReport(lecture)} disabled={!!activeLecture} className="w-1/2 bg-blue-500 text-white font-semibold py-2 px-2 rounded-lg hover:bg-blue-600 disabled:bg-slate-400 flex items-center justify-center gap-1">
                                    <DownloadIcon className="w-4 h-4" /> Report
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="text-center bg-white/80 rounded-2xl p-16 flex flex-col items-center gap-6">
                    <div className="bg-[#C1E8FF] p-4 rounded-full"><QrCodeIcon className="w-16 h-16 text-[#052659]" /></div>
                    <h3 className="text-2xl font-bold">No lectures yet</h3>
                    <p className="text-slate-500 max-w-sm">Create your first lecture to get started.</p>
                </div>
            )}
        </main>
    );
};

// --- THIS COMPONENT IS NOW FULLY CORRECTED ---
export const AttendanceReportsPage = ({ teacherId, token, lectures, allStudents, attendanceRecords }) => {
    const [defaulters, setDefaulters] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // This function now calculates defaulters from the props passed by App.jsx
        const calculateDefaulters = () => {
            setIsLoading(true);
            if (!allStudents || allStudents.length === 0 || !lectures || lectures.length === 0) {
                setIsLoading(false);
                setDefaulters([]);
                return;
            }
            
            const totalLectures = lectures.length;
            
            const defaulterList = allStudents.map(student => {
                // Find all attendance records for this student
                const studentRecords = attendanceRecords.filter(rec => rec.student_id === student.id);
                
                // Count how many of this teacher's lectures the student attended
                const attendedCount = lectures.filter(lecture => 
                    studentRecords.some(rec => rec.lecture_id === lecture.id && rec.status === 'present')
                ).length;
                
                const percentage = (attendedCount / totalLectures) * 100;
                
                return { 
                    ...student, 
                    attended_count: attendedCount,
                    total_lectures: totalLectures,
                    percentage: percentage 
                };
            }).filter(student => student.percentage < 75);

            setDefaulters(defaulterList);
            setIsLoading(false);
        };
        
        // We no longer fetch, we just calculate.
        calculateDefaulters();
    }, [lectures, allStudents, attendanceRecords]); // Depend on the data from App.jsx

    const handleDownloadCSV = () => {
        const headers = "Student ID,Name,Roll Number,Enrollment Number,Attendance Percentage\n";
        let rows = "";

        if (defaulters.length === 0) {
            rows = "No defaulters found for this period.";
        } else {
            rows = defaulters.map(d => 
                `${d.id},"${d.name}",${d.roll_number || 'N/A'},${d.enrollment_number || 'N/A'},${d.percentage.toFixed(0)}%`
            ).join('\n');
        }
        downloadCSV(headers + rows, "monthly_defaulter_report.csv");
    };

    return (
        <main className="p-4 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-[#021024] mb-6">Monthly Attendance Reports</h1>
            <div className="bg-white/80 p-6 rounded-2xl shadow-lg mb-8">
                <h3 className="text-xl font-bold mb-4">Generate Monthly Defaulter Report</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div><label className="text-sm font-medium text-slate-700 block mb-2">Month</label><select className="w-full p-2.5 border border-slate-300 rounded-lg"><option>All Months</option></select></div>
                    <div><label className="text-sm font-medium text-slate-700 block mb-2">Year</label><input type="number" defaultValue={new Date().getFullYear()} className="w-full p-2.5 border border-slate-300 rounded-lg" /></div>
                    <button onClick={handleDownloadCSV} className="bg-[#052659] text-white font-bold py-2.5 px-6 rounded-lg flex items-center justify-center gap-2"><DownloadIcon /> Download Defaulters</button>
                </div>
            </div>
            <div className="bg-white/80 p-6 rounded-2xl shadow-lg mb-8">
                <h3 className="text-xl font-bold mb-4">Defaulter Students (Attendance &lt; 75%)</h3>
                {isLoading ? <p className="text-center p-4">Loading report...</p> : (defaulters.length > 0 ? (
                    <div className="overflow-x-auto"><table className="w-full text-left min-w-[600px]"><thead className="border-b-2"><tr><th className="p-3">ID</th><th className="p-3">Name</th><th className="p-3">Roll No.</th><th className="p-3">Enroll. No.</th><th className="p-3">Attendance %</th><th className="p-3">Action</th></tr></thead><tbody>{defaulters.map(student => (<tr key={student.id} className="border-b hover:bg-slate-50"><td className="p-3">{student.id}</td><td className="p-3">{student.name}</td><td className="p-3">{student.roll_number || 'N/A'}</td><td className="p-3">{student.enrollment_number || 'N/A'}</td><td className="p-3 font-bold text-red-600">{student.percentage.toFixed(0)}%</td><td className="p-3"><button onClick={() => alert(`Simulating: Email sent to mentor of ${student.name}`)} className="text-sm bg-red-100 text-red-700 font-semibold py-1 px-3 rounded-full hover:bg-red-200">Notify Mentor</button></td></tr>))}</tbody></table></div>
                ) : (<p className="text-slate-500 text-center py-4">No defaulters found.</p>))}
            </div>
        </main>
    );
};

// --- THIS COMPONENT IS NOW FULLY CORRECTED ---
export const CreateLecturePage = ({ setView, addLecture, setActiveLecture }) => {
    // UPDATED: State now matches the new form
    const [lectureDetails, setLectureDetails] = useState({ 
        subject: '', 
        date: new Date().toISOString().split('T')[0], // Defaults to today's date
        time: '' 
    });
    const [qrImageUrl, setQrImageUrl] = useState('');
    const [createdLecture, setCreatedLecture] = useState(null);

    const handleInputChange = (e) => setLectureDetails(prev => ({ ...prev, [e.target.id]: e.target.value }));

    const handleGenerateQr = async (e) => {
        e.preventDefault();
        // UPDATED: Check for new fields
        if (lectureDetails.subject && lectureDetails.date && lectureDetails.time) {
            const newLectureData = await addLecture(lectureDetails); // This function is passed from App.jsx
            if (newLectureData && newLectureData.qrUrl) {
                setCreatedLecture(newLectureData);
                setQrImageUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(newLectureData.qrUrl)}`);
            }
        } else {
            alert('Please fill all fields');
        }
    };

    const handleActivateAndReturn = () => {
        setActiveLecture(createdLecture);
        setView('teacherHome'); // Go to teacherHome
    };

    return (
        <main className="p-4 md:p-8 flex flex-col items-center">
            {qrImageUrl ? (
                <div className="w-full max-w-md bg-white/80 p-8 rounded-2xl shadow-lg text-center">
                    <h2 className="text-2xl font-bold mb-2">QR Code Generated!</h2><p className="text-slate-500 mb-6">Students can scan this with their phone camera.</p>
                    <img src={qrImageUrl} alt="Generated QR Code" className="mx-auto rounded-lg shadow-md" />
                    {/* UPDATED: Show the new details */}
                    <div className="mt-6 text-left bg-slate-50 p-4 rounded-lg">
                        <h3 className="font-bold text-lg">{lectureDetails.subject}</h3>
                        <p className="text-sm text-slate-500">{lectureDetails.date} at {lectureDetails.time}</p>
                    </div>
                    <button onClick={handleActivateAndReturn} className="mt-6 w-full bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600">Activate and Return</button>
                </div>
            ) : (
                <div className="w-full max-w-2xl bg-white/80 p-8 rounded-2xl shadow-lg">
                    <h2 className="text-3xl font-bold text-center mb-6">Create New Lecture</h2>
                    {/* UPDATED: The form now matches your request */}
                    <form className="space-y-4" onSubmit={handleGenerateQr}>
                        <InputField id="subject" label="Subject" type="text" placeholder="e.g., Data Structures" value={lectureDetails.subject} onChange={handleInputChange} icon={<BookOpenIcon className="w-5 h-5"/>} />
                        <InputField id="date" label="Date" type="date" value={lectureDetails.date} onChange={handleInputChange} icon={<CalendarIcon className="w-5 h-5"/>} />
                        <InputField id="time" label="Time" type="time" placeholder="e.g., 10:30" value={lectureDetails.time} onChange={handleInputChange} icon={<CalendarIcon className="w-5 h-5"/>} />
                        <button type="submit" className="w-full bg-[#052659] text-white font-bold py-3 rounded-lg hover:bg-[#021024] mt-4">Generate QR Code</button>
                    </form>
                </div>
            )}
        </main>
    );
};