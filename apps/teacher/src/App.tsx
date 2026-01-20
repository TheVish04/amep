import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Radio,
    Users,
    BookOpen,
    Settings,
    Bell,
    Wifi,
    WifiOff
} from 'lucide-react';
import { useSocket } from './hooks/useSocket';
import Dashboard from './pages/Dashboard';
import Session from './pages/Session';
import Students from './pages/Students';
import Content from './pages/Content';
import clsx from 'clsx';

// Demo user
const DEMO_USER = {
    id: 'teacher1',
    name: 'Mr. Rajesh Kumar',
    email: 'rajesh.kumar@amep.edu',
    subjects: ['Physics'],
    classIds: ['11-A', '11-B'],
    avatar: 'RK',
};

const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/session', icon: Radio, label: 'Live Session' },
    { path: '/students', icon: Users, label: 'Students' },
    { path: '/content', icon: BookOpen, label: 'Content' },
];

export default function App() {
    const location = useLocation();
    const { isConnected, sessionId, startSession, engagementState } = useSocket();

    // Auto-start demo session
    useEffect(() => {
        if (isConnected && !sessionId) {
            startSession('demo-session', DEMO_USER.id);
        }
    }, [isConnected, sessionId, startSession]);

    return (
        <div className="min-h-screen flex bg-slate-900">
            {/* Sidebar */}
            <aside className="w-64 glass border-r border-white/10 flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-white/10">
                    <h1 className="text-2xl font-bold gradient-text">GYANSETU</h1>
                    <p className="text-sm text-gray-400 mt-1">Teacher Portal</p>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                                    isActive
                                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                )}
                            >
                                <Icon size={20} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Connection Status */}
                <div className="p-4 border-t border-white/10">
                    <div className={clsx(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm',
                        isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    )}>
                        {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
                        <span>{isConnected ? `Session Active` : 'Offline'}</span>
                    </div>
                </div>

                {/* User Profile */}
                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {DEMO_USER.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{DEMO_USER.name}</p>
                            <p className="text-sm text-gray-400">Physics</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {/* Top Bar */}
                <header className="sticky top-0 z-10 glass border-b border-white/10 px-8 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-white">
                            {navItems.find(n => n.path === location.pathname)?.label || 'Dashboard'}
                        </h2>
                        <p className="text-sm text-gray-400">Class 11-A • Physics</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Engagement Light Mini */}
                        {engagementState && (
                            <div className={clsx(
                                'px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2',
                                engagementState.currentLevel === 'green' && 'bg-green-500/20 text-green-400',
                                engagementState.currentLevel === 'yellow' && 'bg-yellow-500/20 text-yellow-400',
                                engagementState.currentLevel === 'red' && 'bg-red-500/20 text-red-400'
                            )}>
                                <div className={clsx(
                                    'w-3 h-3 rounded-full animate-pulse',
                                    engagementState.currentLevel === 'green' && 'bg-green-400',
                                    engagementState.currentLevel === 'yellow' && 'bg-yellow-400',
                                    engagementState.currentLevel === 'red' && 'bg-red-400'
                                )} />
                                {Math.round(engagementState.participationRate)}% Engaged
                            </div>
                        )}
                        <button className="relative p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                            <Bell size={20} />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                            <Settings size={20} />
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-8">
                    <Routes>
                        <Route path="/" element={<Dashboard userId={DEMO_USER.id} classId="11-A" />} />
                        <Route path="/session" element={<Session userId={DEMO_USER.id} classId="11-A" />} />
                        <Route path="/students" element={<Students userId={DEMO_USER.id} classId="11-A" />} />
                        <Route path="/content" element={<Content userId={DEMO_USER.id} />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}
