import { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar   from './components/Sidebar.jsx';
import Overview  from './pages/Overview.jsx';
import Inventory from './pages/Inventory.jsx';
import Beds      from './pages/Beds.jsx';
import Staff     from './pages/Staff.jsx';
import Forecast  from './pages/Forecast.jsx';
import Login     from './pages/Login.jsx';
import { checkApiHealth } from './api/index.js';
import { isAuthenticated, logout } from './auth.js';

/** Redirects to /login when there is no valid token */
function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

/** The main authenticated shell (sidebar + content) */
function AuthenticatedShell({ apiOnline }) {
  const location = useLocation();
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <Sidebar apiOnline={apiOnline} />
      <main style={{
        flex: 1,
        marginLeft: 'var(--sidebar-width)',
        minHeight: '100vh',
        position: 'relative',
        zIndex: 1,
        overflowY: 'auto',
      }}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/"          element={<Overview  />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/beds"      element={<Beds      />} />
            <Route path="/staff"     element={<Staff     />} />
            <Route path="/forecast"  element={<Forecast  />} />
            {/* Catch-all inside shell → back to overview */}
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  const [apiOnline, setApiOnline] = useState(null);

  useEffect(() => {
    (async () => setApiOnline(await checkApiHealth()))();
    const iv = setInterval(async () => setApiOnline(await checkApiHealth()), 30000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', position: 'relative' }}>
      {/* Ambient background blobs — visible on all pages */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '-10%',
          width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(0,212,170,0.06) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-5%',
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* Protected shell — all real pages live inside */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AuthenticatedShell apiOnline={apiOnline} />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
}
