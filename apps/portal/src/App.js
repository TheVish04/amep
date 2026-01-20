import { jsx as _jsx } from "react/jsx-runtime";
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
function App() {
    return (_jsx(Routes, { children: _jsx(Route, { path: "/", element: _jsx(Login, {}) }) }));
}
export default App;
//# sourceMappingURL=App.js.map