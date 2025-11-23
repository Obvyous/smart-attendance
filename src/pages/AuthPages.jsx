import React, { useState } from 'react';
// Imports are correctly using '../components/' to go up one directory
import { InputField } from '../components/InputField.jsx'; 
import { 
    ArrowLeftIcon, 
    UserIcon, 
    MailIcon, 
    LockIcon, 
    GraduationCapIcon 
} from '../components/Icons.jsx';

// Reusable component for the form container
const AuthFormContainer = ({ children, title, subtitle, icon }) => (
    // Responsive padding for aesthetics
    <div className="w-full max-w-md bg-white/95 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">
      <div className="text-center space-y-4">
        <div className="inline-block bg-slate-100 p-3 rounded-full text-[#052659]">{icon}</div>
        <h1 className="text-2xl font-bold text-[#021024]">{title}</h1>
        {subtitle && <p className="text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
);

// Reusable component for the page layout with a back button
const AuthPageWrapper = ({ setView, children }) => (
    <div className="w-full flex flex-col items-center justify-center min-h-screen p-4">
        <header className="absolute top-0 left-0 p-6 text-[#021024]">
            <button onClick={() => setView('landing')} className="flex items-center gap-2 text-lg hover:underline font-semibold">
                <ArrowLeftIcon /> Back to Home
            </button>
        </header>
        <main className="w-full flex justify-center py-12">{children}</main>
    </div>
);

// --- TEACHER AUTHENTICATION ---

export const TeacherLoginPage = ({ setView, onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        onLogin(email, password, 'teacher'); // Passes the role to App.jsx
    };

    return (
        <AuthPageWrapper setView={setView}>
            <AuthFormContainer icon={<UserIcon className="w-8 h-8" />} title="Teacher Login" subtitle="Sign in to your teacher account">
                <form className="space-y-6" onSubmit={handleLogin}>
                    <InputField label="Email" type="email" id="email" placeholder="Enter your email" icon={<MailIcon className="w-5 h-5"/>} value={email} onChange={(e) => setEmail(e.target.value)} />
                    <InputField label="Password" type="password" id="password" placeholder="Enter your password" icon={<LockIcon className="w-5 h-5"/>} value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="submit" className="w-full bg-[#052659] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#021024] transition-colors">Sign In</button>
                </form>
                <p className="text-center text-slate-600 mt-6">Don't have an account? <a href="#" onClick={(e) => {e.preventDefault(); setView('teacherRegister')}} className="font-semibold text-[#052659] hover:underline">Sign up</a></p>
            </AuthFormContainer>
        </AuthPageWrapper>
    );
};

export const TeacherRegisterPage = ({ setView, onRegister }) => {
    const [formData, setFormData] = useState({ id: '', name: '', email: '', password: '', role: 'teacher' });
    const handleChange = (e) => setFormData({...formData, [e.target.id]: e.target.value});
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onRegister(formData);
    };

    return (
        <AuthPageWrapper setView={setView}>
            <AuthFormContainer icon={<UserIcon className="w-8 h-8" />} title="Teacher Registration" subtitle="Create your account to get started">
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <InputField id="name" label="Full Name" type="text" placeholder="Enter your full name" icon={<UserIcon className="w-5 h-5"/>} value={formData.name} onChange={handleChange} />
                    <InputField id="email" label="Email" type="email" placeholder="Enter your email" icon={<MailIcon className="w-5 h-5"/>} value={formData.email} onChange={handleChange} />
                    <InputField id="password" label="Password" type="password" placeholder="Create a password" icon={<LockIcon className="w-5 h-5"/>} value={formData.password} onChange={handleChange} />
                    <InputField id="id" label="Employee ID" type="text" placeholder="e.g., mit1234" icon={<UserIcon className="w-5 h-5"/>} value={formData.id} onChange={handleChange} />
                    <button type="submit" className="w-full bg-[#052659] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#021024] transition-colors">Create Account</button>
                </form>
                <p className="text-center text-slate-600 mt-6">Already have an account? <a href="#" onClick={(e) => {e.preventDefault(); setView('teacherLogin')}} className="font-semibold text-[#052659] hover:underline">Sign in here</a></p>
            </AuthFormContainer>
        </AuthPageWrapper>
    );
};

// --- STUDENT AUTHENTICATION ---

export const StudentLoginPage = ({ setView, onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        onLogin(email, password, 'student'); // Passes the role to App.jsx
    };

    return (
        <AuthPageWrapper setView={setView}>
            <AuthFormContainer icon={<GraduationCapIcon className="w-8 h-8" />} title="Student Login" subtitle="Sign in to your student account">
                    <form className="space-y-6" onSubmit={handleLogin}>
                        <InputField label="Email" type="email" id="email" placeholder="Enter your email" icon={<MailIcon className="w-5 h-5"/>} value={email} onChange={(e) => setEmail(e.target.value)} />
                        <InputField label="Password" type="password" id="password" placeholder="Enter your password" icon={<LockIcon className="w-5 h-5"/>} value={password} onChange={(e) => setPassword(e.target.value)} />
                        <button type="submit" className="w-full bg-[#052659] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#021024] transition-colors">Sign In</button>
                    </form>
                    <p className="text-center text-slate-600 mt-6">Don't have an account? <a href="#" onClick={(e) => {e.preventDefault(); setView('studentRegister')}} className="font-semibold text-[#052659] hover:underline">Sign up</a></p>
            </AuthFormContainer>
        </AuthPageWrapper>
    );
};

export const StudentRegisterPage = ({ setView, onRegister }) => {
    const [formData, setFormData] = useState({ id: '', name: '', email: '', password: '', role: 'student', roll_number: '', enrollment_number: '' });
    const handleChange = (e) => setFormData({...formData, [e.target.id]: e.target.value});
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onRegister(formData);
    };

    return (
        <AuthPageWrapper setView={setView}>
            <AuthFormContainer icon={<GraduationCapIcon className="w-8 h-8" />} title="Student Registration" subtitle="Create your account to get started">
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <InputField id="name" label="Full Name" type="text" placeholder="Enter your full name" icon={<UserIcon className="w-5 h-5"/>} value={formData.name} onChange={handleChange} />
                        <InputField id="roll_number" label="Roll Number" type="text" placeholder="Enter your roll number" icon={<UserIcon className="w-5 h-5"/>} value={formData.roll_number} onChange={handleChange} />
                        <InputField id="enrollment_number" label="Enrollment Number" type="text" placeholder="Enter your enrollment number" icon={<UserIcon className="w-5 h-5"/>} value={formData.enrollment_number} onChange={handleChange} />
                        <InputField id="id" label="Student ID" type="text" placeholder="e.g., mit263" icon={<UserIcon className="w-5 h-5"/>} value={formData.id} onChange={handleChange} />
                        <InputField id="email" label="Email" type="email" placeholder="Enter your email" icon={<MailIcon className="w-5 h-5"/>} value={formData.email} onChange={handleChange} />
                        <InputField id="password" label="Password" type="password" placeholder="Create a password" icon={<LockIcon className="w-5 h-5"/>} value={formData.password} onChange={handleChange} />
                        <button type="submit" className="w-full bg-[#052659] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#021024] transition-colors">Create Account</button>
                    </form>
                    <p className="text-center text-slate-600 mt-6">Already have an account? <a href="#" onClick={(e) => {e.preventDefault(); setView('studentLogin')}} className="font-semibold text-[#052659] hover:underline">Sign in here</a></p>
            </AuthFormContainer>
        </AuthPageWrapper>
    );
};
