import React from 'react';
// CORRECTED: Added .jsx extension
import { BookOpenIcon, LogOutIcon, BarChartIcon, CalendarDaysIcon, QrCodeIcon } from './Icons.jsx';

export const Navbar = ({ user, setView, onLogout }) => {
    if (!user) return null;

    // UPDATED: Added "Scan QR" to the student's links
    const navLinks = user.role === 'teacher' 
        ? [
            { name: 'My Lectures', view: 'teacherHome', icon: <BookOpenIcon className="w-5 h-5"/> }, 
            { name: 'Monthly Reports', view: 'reports', icon: <BarChartIcon className="w-5 h-5"/> }
          ]
        : [
            { name: 'My Attendance', view: 'studentHome', icon: <BookOpenIcon className="w-5 h-5"/> }, 
            { name: 'Schedule', view: 'viewSchedule', icon: <CalendarDaysIcon className="w-5 h-5"/> },
            // THIS IS THE NEW BUTTON FOR STUDENTS
            { name: 'Scan QR', view: 'scanQRCode', icon: <QrCodeIcon className="w-5 h-5"/>, isPrimary: true }
          ];

    return (
        <header className="bg-white/80 backdrop-blur-md p-4 flex justify-between items-center shadow-md sticky top-0 z-20">
            <div className="flex items-center gap-3">
                <BookOpenIcon className="w-8 h-8 text-[#052659]"/>
                <div>
                    <h1 className="text-xl font-bold text-[#021024]">AttendanceHub</h1>
                    <p className="text-sm text-slate-500">Welcome, {user.name}</p>
                </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
                {navLinks.map(link => {
                    // Special styling for the "Scan QR" button
                    if (link.isPrimary) {
                        return (
                            <button key={link.view} onClick={() => setView(link.view)} className="font-semibold bg-[#052659] text-white p-2 rounded-lg hover:bg-[#021024] transition-colors flex items-center gap-2">
                                {link.icon}
                                <span className="hidden md:inline">{link.name}</span>
                            </button>
                        )
                    }
                    // Standard buttons
                    return (
                        <button key={link.view} onClick={() => setView(link.view)} className="font-semibold text-[#021024] p-2 rounded-lg hover:bg-[#C1E8FF] transition-colors flex items-center gap-2">
                            {link.icon}
                            <span className="hidden md:inline">{link.name}</span>
                        </button>
                    )
                })}
                <button onClick={onLogout} className="font-semibold flex items-center gap-2 p-2 rounded-lg text-red-600 hover:bg-red-100 transition-colors">
                    <LogOutIcon className="w-5 h-5" />
                    <span className="hidden md:inline">Logout</span>
                </button>
            </div>
        </header>
    );
};