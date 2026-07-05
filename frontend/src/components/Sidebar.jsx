import { useNavigate, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, BedDouble, Users, TrendingUp,
  Cross, Activity, LogOut,
} from 'lucide-react';
import { logout, getUser } from '../auth.js';

const NAV_ITEMS = [
  { to: '/',          icon: LayoutDashboard, label: 'Overview',          end: true },
  { to: '/inventory', icon: Package,          label: 'Inventory'          },
  { to: '/beds',      icon: BedDouble,        label: 'Beds'               },
  { to: '/staff',     icon: Users,            label: 'Staff & Attendance' },
  { to: '/forecast',  icon: TrendingUp,       label: 'AI Forecast'        },
];

export default function Sidebar({ apiOnline }) {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      minHeight: '100vh',
      position: 'fixed',
      left: 0, top: 0, bottom: 0,
      background: 'rgba(8, 12, 24, 0.92)',
      borderRight: '1px solid var(--border)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
    }}>

      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 40, height: 40,
            background: 'linear-gradient(135deg, var(--accent-teal), #00a8ff)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,212,170,0.3)',
            flexShrink: 0,
          }}>
            <Cross size={20} color="#020d0a" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              SmartHealth
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 1 }}>
              PHC/CHC Dashboard
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 10,
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--accent-teal)' : 'var(--text-secondary)',
              background: isActive
                ? 'linear-gradient(135deg, rgba(0,212,170,0.12), rgba(0,212,170,0.06))'
                : 'transparent',
              border: isActive
                ? '1px solid rgba(0,212,170,0.2)'
                : '1px solid transparent',
              boxShadow: isActive ? '0 0 12px rgba(0,212,170,0.08)' : 'none',
              transition: 'all 0.2s ease',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  color={isActive ? 'var(--accent-teal)' : 'var(--text-muted)'}
                  strokeWidth={isActive ? 2 : 1.75}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div style={{ padding: '12px 16px 16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* AI Engine Status */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10,
          padding: '10px 12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <Activity size={13} color="var(--text-muted)" />
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
              AI Engine
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className={`status-dot ${apiOnline === null ? 'warning' : apiOnline ? 'online' : 'offline'}`} />
            <span style={{
              fontSize: '0.8rem', fontWeight: 500,
              color: apiOnline === null ? 'var(--accent-amber)' : apiOnline ? 'var(--accent-teal)' : 'var(--accent-red)',
            }}>
              {apiOnline === null ? 'Checking…' : apiOnline ? 'Online' : 'Offline (Mock)'}
            </span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
            XGBoost · v2.1.3
          </div>
        </div>

        {/* User + Logout */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px',
          borderRadius: 10,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {/* Avatar */}
          <div style={{
            width: 32, height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent-teal), #00a8ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.78rem', fontWeight: 700, color: '#020d0a',
            flexShrink: 0,
          }}>
            {(user?.name || user?.username || 'A').charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || user?.username || 'Admin'}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
              {user?.role || 'Administrator'}
            </div>
          </div>
          <button
            id="sh-logout-btn"
            onClick={handleLogout}
            title="Sign out"
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
              borderRadius: 6, transition: 'all 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent-red)'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
