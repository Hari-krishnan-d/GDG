import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BedDouble, Clock } from 'lucide-react';
import BedGrid from '../components/BedGrid.jsx';
import KPICard  from '../components/KPICard.jsx';
import { getBeds } from '../api/index.js';

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

const WARDS = ['All', 'General', 'Maternity', 'Pediatric', 'ICU'];

export default function Beds() {
  const [beds, setBeds]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeWard, setActiveWard] = useState('All');
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getBeds();
      setBeds(data);
      setLastUpdated(new Date());
      setLoading(false);
    })();
  }, []);

  const available   = beds.filter(b => b.status === 'available').length;
  const occupied    = beds.filter(b => b.status === 'occupied').length;
  const maintenance = beds.filter(b => b.status === 'maintenance').length;

  return (
    <motion.div {...PAGE_VARIANTS} className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 className="page-title">Bed Availability</h1>
          <p className="page-subtitle">Real-time bed status across all wards · Click any bed to update</p>
        </div>
        {lastUpdated && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <Clock size={13} />
            Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <KPICard title="Available" value={available}   icon={BedDouble} color="teal"  />
        <KPICard title="Occupied"  value={occupied}    icon={BedDouble} color="red"   />
        <KPICard title="Maintenance" value={maintenance} icon={BedDouble} color="amber" />
      </div>

      {/* Ward filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {WARDS.map(ward => (
          <button
            key={ward}
            onClick={() => setActiveWard(ward)}
            style={{
              padding: '6px 18px',
              borderRadius: 999,
              border: `1px solid ${activeWard === ward ? 'rgba(0,212,170,0.4)' : 'rgba(255,255,255,0.08)'}`,
              background: activeWard === ward ? 'rgba(0,212,170,0.12)' : 'transparent',
              color: activeWard === ward ? 'var(--accent-teal)' : 'var(--text-muted)',
              fontWeight: activeWard === ward ? 600 : 400,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {ward}
            {ward !== 'All' && (
              <span style={{
                marginLeft: 6,
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '99px',
                padding: '0 6px',
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
              }}>
                {beds.filter(b => b.ward === ward).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bed grid */}
      <div className="glass-card" style={{ padding: 24 }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
            {[...Array(12)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 110, borderRadius: 12 }} />
            ))}
          </div>
        ) : (
          <BedGrid beds={beds} filterWard={activeWard} />
        )}
      </div>
    </motion.div>
  );
}
