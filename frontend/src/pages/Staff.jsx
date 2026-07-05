import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';
import AttendanceWidget from '../components/AttendanceWidget.jsx';
import KPICard from '../components/KPICard.jsx';
import { getStaff, getAttendanceToday } from '../api/index.js';

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

function formatTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function Staff() {
  const [staff, setStaff]         = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [s, a] = await Promise.all([getStaff(), getAttendanceToday()]);
      setStaff(s);
      setAttendance(a);
      setLoading(false);
    })();
  }, []);

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const absentCount  = attendance.filter(a => a.status === 'absent').length;
  const total        = attendance.length || staff.length;

  return (
    <motion.div {...PAGE_VARIANTS} className="page-container">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">Staff & Attendance</h1>
        <p className="page-subtitle">Today's attendance status and geofence check-in</p>
      </div>

      {/* Stats + Widget */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginBottom: 24, alignItems: 'start' }}>
        <div>
          {/* Summary strip */}
          <div style={{
            background: 'rgba(0,212,170,0.06)',
            border: '1px solid rgba(0,212,170,0.15)',
            borderRadius: 12,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 20,
          }}>
            <Users size={16} color="var(--accent-teal)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {presentCount} of {total} staff present today
            </span>
            <span className="badge badge-ok" style={{ marginLeft: 'auto' }}>
              {total > 0 ? Math.round((presentCount / total) * 100) : 0}% attendance
            </span>
          </div>

          {/* KPI row */}
          <div className="grid-3" style={{ marginBottom: 0 }}>
            <KPICard title="Present Today" value={presentCount} icon={UserCheck} color="teal" />
            <KPICard title="Absent Today"  value={absentCount}  icon={UserX}     color="red"  />
            <KPICard title="Total Staff"   value={total}        icon={Users}     color="blue" />
          </div>
        </div>

        {/* Attendance Widget */}
        <AttendanceWidget staff={staff} />
      </div>

      {/* Attendance table */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 20 }}>Today's Attendance Log</h2>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 52 }} />)}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Check-In Time</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((rec, idx) => {
                const staffMember = staff.find(s => s.id === rec.staff_id) || {};
                const isPresent = rec.status === 'present';
                return (
                  <motion.tr
                    key={rec.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{
                      background: isPresent ? 'rgba(0,212,170,0.03)' : 'rgba(239,68,68,0.03)',
                    }}
                  >
                    <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {rec.staff_name || staffMember.name || `Staff #${rec.staff_id}`}
                    </td>
                    <td>
                      <span className="chip">{rec.role || staffMember.role}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {staffMember.department || '—'}
                    </td>
                    <td>
                      {isPresent
                        ? <span className="badge badge-ok"><UserCheck size={10} /> Present</span>
                        : <span className="badge badge-critical"><UserX    size={10} /> Absent</span>
                      }
                    </td>
                    <td>
                      {rec.check_in_time ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Clock size={12} color="var(--text-muted)" />
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            {formatTime(rec.check_in_time)}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}
