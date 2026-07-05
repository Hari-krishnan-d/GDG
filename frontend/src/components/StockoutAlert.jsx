import { motion } from 'framer-motion';
import { AlertTriangle, Clock, ShoppingCart } from 'lucide-react';

export default function StockoutAlert({ medicine_name, days_remaining, alert_level, estimated_stockout_date, current_stock }) {
  const isCritical = alert_level === 'critical';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        background: isCritical ? 'rgba(239,68,68,0.07)' : 'rgba(245,158,11,0.07)',
        border: `1px solid ${isCritical ? 'rgba(239,68,68,0.35)' : 'rgba(245,158,11,0.35)'}`,
        borderRadius: 12,
        padding: '14px 16px',
        marginBottom: 10,
        animation: isCritical ? 'pulseBorder 2s infinite' : 'none',
      }}
    >
      <style>{`
        @keyframes pulseBorder {
          0%, 100% { border-color: rgba(239,68,68,0.35); }
          50%       { border-color: rgba(239,68,68,0.7); }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 }}>
          <AlertTriangle
            size={16}
            color={isCritical ? 'var(--accent-red)' : 'var(--accent-amber)'}
            style={{ flexShrink: 0, marginTop: 2 }}
          />
          <div>
            <div style={{
              fontWeight: isCritical ? 700 : 600,
              fontSize: '0.875rem',
              color: isCritical ? 'var(--accent-red)' : 'var(--accent-amber)',
              marginBottom: 4,
            }}>
              {medicine_name}
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} color="var(--text-muted)" />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <b style={{ color: isCritical ? 'var(--accent-red)' : 'var(--accent-amber)' }}>
                    {days_remaining} days
                  </b> remaining
                </span>
              </div>
              {estimated_stockout_date && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Stockout: {estimated_stockout_date}
                </span>
              )}
              {current_stock !== undefined && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Stock: {current_stock} units
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          className="btn"
          style={{
            padding: '5px 10px',
            fontSize: '0.72rem',
            fontWeight: 600,
            background: isCritical ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
            color: isCritical ? 'var(--accent-red)' : 'var(--accent-amber)',
            border: `1px solid ${isCritical ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
            borderRadius: 6,
            cursor: 'pointer',
            flexShrink: 0,
            marginLeft: 12,
          }}
        >
          <ShoppingCart size={11} style={{ marginRight: 4 }} />
          Order Now
        </button>
      </div>

      <div style={{ marginTop: 10 }}>
        <span className={`badge ${isCritical ? 'badge-critical' : 'badge-warning'}`}>
          {isCritical ? 'Critical' : 'Warning'}
        </span>
      </div>
    </motion.div>
  );
}
