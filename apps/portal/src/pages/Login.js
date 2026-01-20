import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { User, Shield, GraduationCap, Lock, Mail, ArrowRight } from 'lucide-react';
import clsx from 'clsx';
const DEMO_USERS = [
    {
        role: 'student',
        email: 'student@amep.edu',
        name: 'Student Demo',
        icon: GraduationCap,
        color: 'from-blue-500 to-cyan-500',
        redirect: 'http://localhost:5173'
    },
    {
        role: 'teacher',
        email: 'teacher@amep.edu',
        name: 'Teacher Demo',
        icon: User,
        color: 'from-violet-500 to-purple-500',
        redirect: 'http://localhost:5174'
    },
    {
        role: 'admin',
        email: 'admin@amep.edu',
        name: 'Admin Demo',
        icon: Shield,
        color: 'from-emerald-500 to-teal-500',
        redirect: 'http://localhost:5175'
    }
];
export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const handleLogin = (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate login check and redirect
        setTimeout(() => {
            const user = DEMO_USERS.find(u => u.email === email);
            if (user) {
                window.location.href = user.redirect;
            }
            else {
                // Default fallback or error
                alert('Invalid credentials. Try using demo emails below.');
                setLoading(false);
            }
        }, 1000);
    };
    const loginAs = (user) => {
        setEmail(user.email);
        setPassword('password'); // Dummy password
    };
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-slate-100 to-slate-200", children: _jsxs("div", { className: "max-w-md w-full", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("h1", { className: "text-4xl font-bold gradient-text mb-2", children: "AMEP Portal" }), _jsx("p", { className: "text-gray-500", children: "Unified Access Platform" })] }), _jsxs("div", { className: "glass rounded-2xl p-8 shadow-xl border border-white/50 backdrop-blur-xl mb-6 relative overflow-hidden", children: [_jsx("div", { className: "absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" }), _jsxs("form", { onSubmit: handleLogin, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Email Address" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400", size: 20 }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white/50", placeholder: "Enter your email", required: true })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Password" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400", size: 20 }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-white/50", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true })] })] }), _jsx("button", { type: "submit", disabled: loading, className: "w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2", children: loading ? (_jsx("span", { className: "w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" })) : (_jsxs(_Fragment, { children: ["Sign In ", _jsx(ArrowRight, { size: 20 })] })) })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "flex items-center gap-4 before:h-px before:flex-1 before:bg-gray-300 after:h-px after:flex-1 after:bg-gray-300", children: _jsx("span", { className: "text-sm text-gray-500 font-medium", children: "Demo Access" }) }), _jsx("div", { className: "grid grid-cols-1 gap-3", children: DEMO_USERS.map((user) => {
                                const Icon = user.icon;
                                return (_jsxs("button", { onClick: () => loginAs(user), className: "group relative p-4 rounded-xl bg-white/60 hover:bg-white border border-white/50 shadow-sm hover:shadow-md transition-all duration-200 text-left flex items-center gap-4", children: [_jsx("div", { className: clsx("w-10 h-10 rounded-lg flex items-center justify-center text-white bg-gradient-to-br shadow-lg", user.color), children: _jsx(Icon, { size: 20 }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("p", { className: "font-semibold text-gray-900 capitalize", children: [user.role, " Portal"] }), _jsx("p", { className: "text-sm text-gray-500 font-mono", children: user.email })] }), _jsx("div", { className: "opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500", children: _jsx(ArrowRight, { size: 20 }) })] }, user.role));
                            }) })] })] }) }));
}
//# sourceMappingURL=Login.js.map