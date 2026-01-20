import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    ClipboardList,
    FolderKanban,
    Settings,
    Bell,
    Wifi,
    WifiOff
} from 'lucide-react';
import { useSocket } from './hooks/useSocket';
import Dashboard from './pages/Dashboard';
import Learn from './pages/Learn';
import Homework from './pages/Homework';
import Projects from './pages/Projects';
import clsx from 'clsx';

// Demo user - in production, this comes from auth
const DEMO_USER = {
    id: 'student1',
    name: 'Aarav Patel',
    email: 'student1.11a@amep.edu',
    classId: '11-A',
    avatar: 'AP',
};

const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/learn', icon: BookOpen, label: 'Learn' },
    { path: '/homework', icon: ClipboardList, label: 'Homework' },
    { path: '/projects', icon: FolderKanban, label: 'Projects' },
];

export default function App() {
    const location = useLocation();
    const { isConnected, activeQuestion, sessionId, joinSession } = useSocket();
    const [notifications, setNotifications] = useState<any[]>([]);

    // Auto-join demo session
    useEffect(() => {
        if (isConnected && !sessionId) {
            joinSession('demo-session', DEMO_USER.id);
        }
    }, [isConnected, sessionId, joinSession]);

    return (
        <div className="min-h-screen flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white/80 backdrop-blur-xl border-r border-gray-200 flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-gray-100">
                    <h1 className="text-2xl font-bold gradient-text">GYANSETU</h1>
                    <p className="text-sm text-gray-500 mt-1">Student Portal</p>
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
                                        : 'text-gray-600 hover:bg-gray-100'
                                )}
                            >
                                <Icon size={20} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Connection Status */}
                <div className="p-4 border-t border-gray-100">
                    <div className={clsx(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm',
                        isConnected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    )}>
                        {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
                        <span>{isConnected ? 'Connected' : 'Offline'}</span>
                    </div>
                </div>

                {/* User Profile */}
                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {DEMO_USER.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{DEMO_USER.name}</p>
                            <p className="text-sm text-gray-500">Class {DEMO_USER.classId}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {/* Top Bar */}
                <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-200 px-8 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            {navItems.find(n => n.path === location.pathname)?.label || 'Dashboard'}
                        </h2>
                        <p className="text-sm text-gray-500">Welcome back, {DEMO_USER.name.split(' ')[0]}!</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <Bell size={20} />
                            {notifications.length > 0 && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                            )}
                        </button>
                        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <Settings size={20} />
                        </button>
                    </div>
                </header>

                {/* Live Question Alert */}
                {activeQuestion && (
                    <div className="mx-8 mt-4 p-4 bg-gradient-to-r from-primary-500 to-purple-500 rounded-xl text-white animate-pulse">
                        <p className="font-semibold">🎯 Live Question Available!</p>
                        <p className="text-sm opacity-90">Your teacher has pushed a new question. Go to Learn to answer!</p>
                    </div>
                )}

                {/* Page Content */}
                <div className="p-8">
                    <Routes>
                        <Route path="/" element={<Dashboard userId={DEMO_USER.id} />} />
                        <Route path="/learn" element={<Learn userId={DEMO_USER.id} />} />
                        <Route path="/homework" element={<Homework userId={DEMO_USER.id} />} />
                        <Route path="/projects" element={<Projects userId={DEMO_USER.id} />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}
