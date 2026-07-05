import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, AlertTriangle, Plus, X } from 'lucide-react';
import MedicineTable from '../components/MedicineTable.jsx';
import StockoutAlert from '../components/StockoutAlert.jsx';
import KPICard from '../components/KPICard.jsx';
import { getMedicines, getStockoutAlerts } from '../api/index.js';

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

function AddMedicineModal({ onClose }) {
  const [form, setForm] = useState({ name: '', category: '', unit: '', stock: '', capacity: '', expiry: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-box"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        style={{ maxWidth: 480 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Add New Medicine</h3>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontWeight: 500 }}>Medicine Name *</label>
            <input className="input" placeholder="e.g. Paracetamol 500mg" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontWeight: 500 }}>Category</label>
            <input className="input" placeholder="e.g. Analgesic" value={form.category} onChange={e => set('category', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontWeight: 500 }}>Unit</label>
            <input className="input" placeholder="tablets / vials…" value={form.unit} onChange={e => set('unit', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontWeight: 500 }}>Current Stock</label>
            <input className="input" type="number" placeholder="0" value={form.stock} onChange={e => set('stock', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontWeight: 500 }}>Max Capacity</label>
            <input className="input" type="number" placeholder="0" value={form.capacity} onChange={e => set('capacity', e.target.value)} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontWeight: 500 }}>Expiry Date</label>
            <input className="input" type="date" value={form.expiry} onChange={e => set('expiry', e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onClose}>Add Medicine</button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Inventory() {
  const [medicines, setMedicines] = useState([]);
  const [alerts, setAlerts]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [m, a] = await Promise.all([getMedicines(), getStockoutAlerts()]);
      setMedicines(m);
      setAlerts(a);
      setLoading(false);
    })();
  }, []);

  const total    = medicines.length;
  const lowStock = medicines.filter(m => (m.current_stock / m.max_capacity) <= 0.5 && (m.current_stock / m.max_capacity) > 0.2).length;
  const critical = medicines.filter(m => (m.current_stock / m.max_capacity) <= 0.2).length;

  return (
    <motion.div {...PAGE_VARIANTS} className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 className="page-title">Medicine Inventory</h1>
          <p className="page-subtitle">Track, consume and restock facility medicines</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={15} /> Add Medicine
        </button>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <KPICard title="Total Medicines" value={total}    icon={Package}        color="teal" />
        <KPICard title="Low Stock"       value={lowStock} icon={AlertTriangle}   color="amber" />
        <KPICard title="Critical"        value={critical} icon={AlertTriangle}   color="red" />
      </div>

      {/* Main content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
        {/* Table */}
        <div className="glass-card" style={{ padding: 24 }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 44 }} />)}
            </div>
          ) : (
            <MedicineTable medicines={medicines} />
          )}
        </div>

        {/* Alerts sidebar */}
        <div>
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <AlertTriangle size={15} color="var(--accent-amber)" />
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Stockout Alerts</h3>
              {alerts.length > 0 && (
                <span className="badge badge-warning" style={{ marginLeft: 'auto' }}>{alerts.length}</span>
              )}
            </div>
            {alerts.map(a => (
              <StockoutAlert key={a.id} {...a} />
            ))}
            {alerts.length === 0 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                No stockout risks detected
              </p>
            )}
          </div>
        </div>
      </div>

      {showAdd && <AddMedicineModal onClose={() => setShowAdd(false)} />}
    </motion.div>
  );
}
