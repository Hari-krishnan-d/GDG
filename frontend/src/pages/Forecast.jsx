import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, RefreshCw, Brain, Calendar, AlertTriangle, Clock } from 'lucide-react';
import ForecastChart  from '../components/ForecastChart.jsx';
import StockoutAlert  from '../components/StockoutAlert.jsx';
import { getFootfallForecast, getStockoutAlerts, refreshForecast } from '../api/index.js';

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export default function Forecast() {
  const [forecast, setForecast]     = useState([]);
  const [alerts, setAlerts]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [apiOnline, setApiOnline]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [f, a] = await Promise.all([getFootfallForecast(), getStockoutAlerts()]);
    setForecast(f);
    setAlerts(a);
    setLastUpdated(new Date());
    // infer online status by checking if data has a 'mock' property
    setApiOnline(!(f[0]?.mock));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshForecast();
    await load();
    setRefreshing(false);
  };

  const totalExpected = forecast.reduce((sum, d) => sum + (d.predicted || 0), 0);
  const peakDay       = forecast.reduce((max, d) => d.predicted > (max.predicted || 0) ? d : max, {});
  const quietDay      = forecast.reduce((min, d) => d.predicted < (min.predicted || Infinity) ? d : min, {});

  return (
    <motion.div {...PAGE_VARIANTS} className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 className="page-title">AI Forecast Engine</h1>
          <p className="page-subtitle">XGBoost-powered patient footfall and stockout predictions</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
          {/* Status badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(0,0,0,0.3)',
            border: `1px solid ${apiOnline ? 'rgba(0,212,170,0.25)' : 'rgba(239,68,68,0.25)'}`,
            borderRadius: 999,
            padding: '6px 14px',
          }}>
            <span className={`status-dot ${apiOnline === null ? 'warning' : apiOnline ? 'online' : 'offline'}`} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: apiOnline ? 'var(--accent-teal)' : 'var(--accent-red)' }}>
              {apiOnline === null ? 'Checking…' : apiOnline ? 'AI Engine Online' : 'Offline — Mock Data'}
            </span>
          </div>
          <button
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? 'spinner' : ''} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing…' : 'Refresh Forecast'}
          </button>
        </div>
      </div>

      {/* Model Info Card */}
      <div style={{
        background: 'rgba(0,212,170,0.05)',
        border: '1px solid rgba(0,212,170,0.15)',
        borderRadius: 12,
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
        flexWrap: 'wrap',
      }}>
        <Brain size={18} color="var(--accent-teal)" />
        <div>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
            XGBoost Regressor
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginLeft: 10 }}>
            Features: day_of_week · month · lag_7 · rolling_avg_14
          </span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <span className="chip">v2.1.3</span>
          <span className="chip">RMSE: 8.4</span>
          <span className="chip">R²: 0.91</span>
        </div>
      </div>

      {/* Section 1: Footfall Forecast */}
      <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <TrendingUp size={16} color="var(--accent-teal)" />
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600 }}>7-Day Patient Footfall Forecast</h2>
          {lastUpdated && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <Clock size={12} />
              Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>

        {loading ? (
          <div className="skeleton" style={{ height: 280 }} />
        ) : (
          <ForecastChart forecastData={forecast} />
        )}

        {/* Summary stats */}
        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-teal)' }}>{totalExpected}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Total Expected (7d)</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-amber)' }}>{peakDay.predicted || '—'}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Peak ({peakDay.day_name?.slice(0,3) || '—'})</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{quietDay.predicted || '—'}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Quiet ({quietDay.day_name?.slice(0,3) || '—'})</div>
            </div>
          </div>
        )}

        {/* Table */}
        {!loading && forecast.length > 0 && (
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Predicted Patients</th>
                  <th>95% CI Lower</th>
                  <th>95% CI Upper</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {forecast.map(d => {
                  const isWeekend = ['Saturday','Sunday'].includes(d.day_name);
                  return (
                    <tr key={d.date} style={{ background: isWeekend ? 'rgba(245,158,11,0.03)' : 'transparent' }}>
                      <td style={{ fontWeight: 500 }}>{d.date}</td>
                      <td>
                        <span style={{ color: isWeekend ? 'var(--accent-amber)' : 'var(--text-secondary)' }}>
                          {d.day_name}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
                        {Math.round(d.predicted)}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{d.lower || '—'}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{d.upper || '—'}</td>
                      <td>
                        {isWeekend
                          ? <span className="badge badge-warning">Weekend</span>
                          : <span className="badge badge-blue">Weekday</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Stockout Predictions */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <AlertTriangle size={16} color="var(--accent-amber)" />
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Medicine Stockout Predictions</h2>
          {alerts.length > 0 && (
            <span className="badge badge-warning" style={{ marginLeft: 'auto' }}>{alerts.length} risks</span>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80 }} />)}
          </div>
        ) : alerts.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 0 }}>
            {alerts.map(a => (
              <StockoutAlert key={a.id} {...a} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>✓</div>
            <p style={{ color: 'var(--text-muted)' }}>No stockout risks detected in the next 30 days</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
