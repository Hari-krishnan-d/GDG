import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Plus, Minus, X, RefreshCw } from 'lucide-react';
import { consumeMedicine, restockMedicine } from '../api/index.js';

function ProgressBar({ current, max }) {
  const pct = Math.min(100, Math.round((current / max) * 100));
  const colorClass = pct > 50 ? 'green' : pct > 20 ? 'amber' : 'red';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div className="progress-bar-track" style={{ flex: 1 }}>
        <div
          className={`progress-bar-fill ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', minWidth: 32, textAlign: 'right' }}>
        {pct}%
      </span>
    </div>
  );
}

function StockBadge({ current, max }) {
  const pct = (current / max) * 100;
  if (pct <= 20) return <span className="badge badge-critical">Critical</span>;
  if (pct <= 50) return <span className="badge badge-warning">Low Stock</span>;
  return <span className="badge badge-ok">In Stock</span>;
}

function ActionModal({ medicine, action, onClose, onDone }) {
  const [qty, setQty] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async () => {
    const amount = parseInt(qty);
    if (!amount || amount <= 0) { setError('Enter a valid quantity'); return; }
    setLoading(true);
    if (action === 'consume') {
      await consumeMedicine(medicine.id, amount);
    } else {
      await restockMedicine(medicine.id, amount);
    }
    setLoading(false);
    onDone(medicine.id, action, amount);
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
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
              {action === 'consume' ? 'Consume Stock' : 'Restock Medicine'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{medicine.name}</p>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ marginBottom: 6 }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 8, fontWeight: 500 }}>
            Quantity ({medicine.unit})
          </label>
          <input
            className="input"
            type="number"
            min={1}
            value={qty}
            onChange={e => { setQty(e.target.value); setError(''); }}
            placeholder={`Enter amount to ${action === 'consume' ? 'consume' : 'add'}…`}
            autoFocus
          />
          {error && <p style={{ color: 'var(--accent-red)', fontSize: '0.75rem', marginTop: 6 }}>{error}</p>}
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8 }}>
            Current stock: <b style={{ color: 'var(--text-primary)' }}>{medicine.current_stock}</b> {medicine.unit}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className={`btn ${action === 'consume' ? 'btn-danger' : 'btn-primary'}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <span className="spinner" style={{ width: 14, height: 14 }} />
              : action === 'consume' ? 'Consume' : 'Add Stock'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function MedicineTable({ medicines: initialMeds }) {
  const [medicines, setMedicines] = useState(initialMeds);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('All');
  const [modal, setModal]         = useState(null); // { medicine, action }

  const filtered = medicines.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const pct = (m.current_stock / m.max_capacity) * 100;
    const matchFilter =
      filter === 'All'      ? true :
      filter === 'Low Stock' ? (pct <= 50 && pct > 20) :
      filter === 'Critical'  ? pct <= 20 : true;
    return matchSearch && matchFilter;
  });

  const handleDone = (id, action, amount) => {
    setMedicines(prev => prev.map(m => {
      if (m.id !== id) return m;
      const next = action === 'consume'
        ? Math.max(0, m.current_stock - amount)
        : Math.min(m.max_capacity, m.current_stock + amount);
      return { ...m, current_stock: next };
    }));
  };

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            className="input"
            style={{ paddingLeft: 32 }}
            placeholder="Search medicines…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Filter size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, pointerEvents: 'none' }} />
          <select
            className="select"
            style={{ paddingLeft: 30, width: 'auto', minWidth: 130 }}
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option>All</option>
            <option>Low Stock</option>
            <option>Critical</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Category</th>
              <th style={{ minWidth: 160 }}>Stock Level</th>
              <th>Qty / Unit</th>
              <th>Status</th>
              <th>Expiry</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(med => (
              <motion.tr
                key={med.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                layout
              >
                <td>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                    {med.name}
                  </span>
                </td>
                <td>
                  <span className="chip">{med.category}</span>
                </td>
                <td>
                  <ProgressBar current={med.current_stock} max={med.max_capacity} />
                </td>
                <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                  {med.current_stock}
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> {med.unit}</span>
                </td>
                <td><StockBadge current={med.current_stock} max={med.max_capacity} /></td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{med.expiry}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn-icon"
                      title="Consume"
                      style={{ color: 'var(--accent-red)' }}
                      onClick={() => setModal({ medicine: med, action: 'consume' })}
                    >
                      <Minus size={14} />
                    </button>
                    <button
                      className="btn-icon"
                      title="Restock"
                      style={{ color: 'var(--accent-teal)' }}
                      onClick={() => setModal({ medicine: med, action: 'restock' })}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No medicines match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {modal && (
          <ActionModal
            medicine={modal.medicine}
            action={modal.action}
            onClose={() => setModal(null)}
            onDone={handleDone}
          />
        )}
      </AnimatePresence>
    </>
  );
}
