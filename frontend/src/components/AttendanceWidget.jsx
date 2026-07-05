import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader, CheckCircle, XCircle, UserCheck } from 'lucide-react';
import { checkIn } from '../api/index.js';

export default function AttendanceWidget({ staff = [] }) {
  const [selectedStaff, setSelectedStaff] = useState('');
  const [status, setStatus]   = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  const handleCheckIn = () => {
    if (!selectedStaff) return;

    if (!navigator.geolocation) {
      setStatus('error');
      setMessage('Geolocation is not supported by your browser.');
      return;
    }

    setStatus('loading');
    setMessage('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await checkIn(parseInt(selectedStaff), latitude, longitude);
          if (res.within_geofence || res.success) {
            setStatus('success');
            setMessage(res.message || 'Marked Present — You are within the geofence');
          } else {
            setStatus('error');
            setMessage(res.message || 'Outside geofence radius');
          }
        } catch {
          setStatus('error');
          setMessage('Failed to record attendance. Please try again.');
        }
      },
      (err) => {
        setStatus('error');
        setMessage('Location access denied. Please enable location permissions.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const selectedName = staff.find(s => String(s.id) === selectedStaff)?.name || '';

  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <UserCheck size={18} color="var(--accent-teal)" />
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Geofence Check-In</h3>
      </div>

      {/* Staff selector */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 8, fontWeight: 500 }}>
          Select Staff Member
        </label>
        <select
          className="select"
          value={selectedStaff}
          onChange={e => { setSelectedStaff(e.target.value); setStatus('idle'); setMessage(''); }}
        >
          <option value="">— Choose a staff member —</option>
          {staff.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.role})
            </option>
          ))}
        </select>
      </div>

      {/* Check-In button */}
      <motion.button
        className="btn btn-primary"
        style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.9rem' }}
        onClick={handleCheckIn}
        disabled={!selectedStaff || status === 'loading'}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {status === 'loading' ? (
          <>
            <span className="spinner" style={{ width: 16, height: 16 }} />
            Getting Location…
          </>
        ) : (
          <>
            <MapPin size={16} />
            Check In Now
          </>
        )}
      </motion.button>

      {/* Status message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              marginTop: 16,
              padding: '12px 16px',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              background: status === 'success' ? 'rgba(0,212,170,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${status === 'success' ? 'rgba(0,212,170,0.25)' : 'rgba(239,68,68,0.25)'}`,
            }}
          >
            {status === 'success'
              ? <CheckCircle size={18} color="var(--accent-teal)" style={{ flexShrink: 0, marginTop: 1 }} />
              : <XCircle    size={18} color="var(--accent-red)"  style={{ flexShrink: 0, marginTop: 1 }} />
            }
            <div>
              {selectedName && (
                <div style={{ fontWeight: 600, fontSize: '0.82rem', color: status === 'success' ? 'var(--accent-teal)' : 'var(--accent-red)', marginBottom: 2 }}>
                  {selectedName}
                </div>
              )}
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{message}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info note */}
      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 16, lineHeight: 1.5 }}>
        Attendance is recorded only when you are within the designated geofence radius of the facility.
      </p>
    </div>
  );
}
