import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BedDouble } from 'lucide-react';
import { updateBedStatus } from '../api/index.js';

const STATUS_COLORS = {
  available:   { bg: 'rgba(0,212,170,0.12)',   border: 'rgba(0,212,170,0.3)',   text: '#00d4aa',  label: 'Available'   },
  occupied:    { bg: 'rgba(239,68,68,0.12)',    border: 'rgba(239,68,68,0.3)',   text: '#ef4444',  label: 'Occupied'    },
  maintenance: { bg: 'rgba(100,116,139,0.12)',  border: 'rgba(100,116,139,0.3)', text: '#64748b',  label: 'Maintenance' },
};

const STATUSES = ['available', 'occupied', 'maintenance'];

function BedModal({ bed, onClose, onUpdate }) {
  const [status, setStatus]     = useState(bed.status);
  const [patient, setPatient]   = useState(bed.patient_name || '');
  const [loading, setLoading]   = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await updateBedStatus(bed.id, status, status === 'occupied' ? patient : null);
    onUpdate({ ...bed, status, patient_name: status === 'occupied' ? patient : null });
    setLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-box"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.2 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 2 }}>Bed {bed.bed_number}</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Ward: {bed.ward}</span>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Status
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {STATUSES.map(s => {
              const c = STATUS_COLORS[s];
              return (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: `1px solid ${status === s ? c.border : 'rgba(255,255,255,0.08)'}`,
                    background: status === s ? c.bg : 'transparent',
                    color: status === s ? c.text : 'var(--text-muted)',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {status === 'occupied' && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Patient Name
            </label>
            <input
              className="input"
              value={patient}
              onChange={e => setPatient(e.target.value)}
              placeholder="Enter patient name…"
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function BedGrid({ beds: initialBeds, filterWard = 'All' }) {
  const [beds, setBeds]       = useState(initialBeds);
  const [selected, setSelected] = useState(null);

  // sync if parent updates
  const displayBeds = filterWard === 'All' ? beds : beds.filter(b => b.ward === filterWard);

  const handleUpdate = (updated) => {
    setBeds(prev => prev.map(b => b.id === updated.id ? updated : b));
  };

  return (
    <>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(STATUS_COLORS).map(([key, val]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: val.text, display: 'inline-block' }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{val.label}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 12,
      }}>
        {displayBeds.map(bed => {
          const c = STATUS_COLORS[bed.status] || STATUS_COLORS.maintenance;
          return (
            <motion.div
              key={bed.id}
              onClick={() => setSelected(bed)}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: 12,
                padding: '14px 12px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                transition: 'box-shadow 0.2s ease',
              }}
              className="bed-card"
            >
              <BedDouble size={22} color={c.text} strokeWidth={1.75} />
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: c.text }}>
                {bed.bed_number}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {bed.ward}
              </div>
              {bed.patient_name && (
                <div style={{
                  fontSize: '0.68rem',
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                  background: 'rgba(0,0,0,0.2)',
                  padding: '2px 6px',
                  borderRadius: 4,
                  marginTop: 2,
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {bed.patient_name}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selected && (
          <BedModal
            bed={selected}
            onClose={() => setSelected(null)}
            onUpdate={handleUpdate}
          />
        )}
      </AnimatePresence>
    </>
  );
}
