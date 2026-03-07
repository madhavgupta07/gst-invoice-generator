import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import CreateInvoice from './pages/CreateInvoice';
import InvoiceList from './pages/InvoiceList';
import EditInvoice from './pages/EditInvoice';
import Login from './pages/Login';
import Register from './pages/Register';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/login" />;
    return children;
}

function NavLink({ to, children }) {
    const location = useLocation();
    const active = location.pathname === to;
    return (
        <Link
            to={to}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${active
                ? 'bg-primary-600/20 text-primary-300 border border-primary-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
        >
            {children}
        </Link>
    );
}

function AppContent() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const isAuthPage = ['/login', '/register'].includes(location.pathname);

    return (
        <div className="min-h-screen">
            {/* Nav */}
            {!isAuthPage && user && (
                <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/5">
                    <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-600/30 group-hover:scale-105 transition-transform">
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <span className="text-lg font-bold gradient-text hidden sm:block">GST Invoice Manager</span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 mr-2">
                                <NavLink to="/">Dashboard</NavLink>
                                <NavLink to="/create">New Invoice</NavLink>
                            </div>
                            <div className="h-6 w-px bg-white/10 hidden sm:block"></div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-400 hidden lg:block">Hi, <span className="text-gray-200 font-medium">{user.username}</span></span>
                                <button
                                    onClick={logout}
                                    className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                                    title="Logout"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>
            )}

            {/* Main content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                <Routes>
                    <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
                    <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />

                    <Route path="/" element={<ProtectedRoute><InvoiceList /></ProtectedRoute>} />
                    <Route path="/create" element={<ProtectedRoute><CreateInvoice /></ProtectedRoute>} />
                    <Route path="/edit/:id" element={<ProtectedRoute><EditInvoice /></ProtectedRoute>} />

                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: '#1e1b4b',
                            color: '#e2e8f0',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                        },
                    }}
                />
                <AppContent />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
