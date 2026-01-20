import React, { useState } from 'react';
import { User, Shield, GraduationCap, Lock, Mail, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

type Role = 'student' | 'teacher' | 'admin';

const isLocal = window.location.hostname.includes('localhost');

const URLS = {
    student: isLocal ? 'http://localhost:5173' : 'https://amep-student.vercel.app',
    teacher: isLocal ? 'http://localhost:5174' : 'https://amep-teacher.vercel.app',
    admin: isLocal ? 'http://localhost:5175' : 'https://amep-admin.vercel.app'
};

const DEMO_USERS = [
    {
        role: 'student' as Role,
        email: 'student@amep.edu',
        name: 'Student Demo',
        icon: GraduationCap,
        color: 'from-blue-500 to-cyan-500',
        redirect: URLS.student
    },
    {
        role: 'teacher' as Role,
        email: 'teacher@amep.edu',
        name: 'Teacher Demo',
        icon: User,
        color: 'from-violet-500 to-purple-500',
        redirect: URLS.teacher
    },
    {
        role: 'admin' as Role,
        email: 'admin@amep.edu',
        name: 'Admin Demo',
        icon: Shield,
        color: 'from-emerald-500 to-teal-500',
        redirect: URLS.admin
    }
];

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate login check and redirect
        setTimeout(() => {
            const user = DEMO_USERS.find(u => u.email === email);
            if (user) {
                window.location.href = user.redirect;
            } else {
                // Default fallback or error
                alert('Invalid credentials. Try using demo emails below.');
                setLoading(false);
            }
        }, 1000);
    };

    const loginAs = (user: typeof DEMO_USERS[0]) => {
        setEmail(user.email);
        setPassword('password'); // Dummy password
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-slate-100 to-slate-200">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold gradient-text mb-2">AMEP Portal</h1>
                    <p className="text-gray-500">Unified Access Platform</p>
                </div>

                {/* Login Card */}
                <div className="glass rounded-2xl p-8 shadow-xl border border-white/50 backdrop-blur-xl mb-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white/50"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white/50"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Sign In <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Demo Credentials */}
                <div className="space-y-4">
                    <div className="flex items-center gap-4 before:h-px before:flex-1 before:bg-gray-300 after:h-px after:flex-1 after:bg-gray-300">
                        <span className="text-sm text-gray-500 font-medium">Demo Access</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {DEMO_USERS.map((user) => {
                            const Icon = user.icon;
                            return (
                                <button
                                    key={user.role}
                                    onClick={() => loginAs(user)}
                                    className="group relative p-4 rounded-xl bg-white/60 hover:bg-white border border-white/50 shadow-sm hover:shadow-md transition-all duration-200 text-left flex items-center gap-4"
                                >
                                    <div className={clsx(
                                        "w-10 h-10 rounded-lg flex items-center justify-center text-white bg-gradient-to-br shadow-lg",
                                        user.color
                                    )}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900 capitalize">{user.role} Portal</p>
                                        <p className="text-sm text-gray-500 font-mono">{user.email}</p>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500">
                                        <ArrowRight size={20} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
