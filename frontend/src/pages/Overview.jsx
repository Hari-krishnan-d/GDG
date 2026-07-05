import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BedDouble, Package, Users, Activity, RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import KPICard from '../components/KPICard.jsx';
import {
  getDashboardSummary, getBedSummary, getFootfallForecast, getStockoutAlerts,
} from '../api/index.js';

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-teal)', fontVariantNumeric: 'tabular-nums' }}>
        {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        {time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
    </div>
  );
}

const PIE_COLORS = ['#00d4aa', '#ef4444', '#64748b'];

function BedPieChart({ summary }) {
  const data = [
    { name: 'Available',   value: summary.available   || 0 },
    { name: 'Occupied',    value: summary.occupied    || 0 },
    { name: 'Maintenance', value: summary.maintenance || 0 },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={42} outerRadius={64} paddingAngle={3} dataKey="value" stroke="none">
            {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#1a2035', border: '1px solid rgba(0,212,170,0.3)', borderRadius: 8, fontSize: 12 }}
            itemStyle={{ color: 'var(--text-primary)' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((item, i) => (
          <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, background: PIE_COLORS[i], borderRadius: 2, display: 'inline-block' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.name}</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginLeft: 'auto', paddingLeft: 12 }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniFootfallChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={100}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
        <defs>
          <linearGradient id="miniGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#00d4aa" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#00d4aa" stopOpacity={0}   />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
        <XAxis dataKey="day_name" hide />
        <YAxis hide />
        <Tooltip
          contentStyle={{ background: '#1a2035', border: '1px solid rgba(0,212,170,0.3)', borderRadius: 8, fontSize: 11 }}
          itemStyle={{ color: 'var(--accent-teal)' }}
          labelStyle={{ color: 'var(--text-muted)' }}
        />
        <Area type="monotone" dataKey="predicted" stroke="#00d4aa" strokeWidth={2} fill="url(#miniGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function Overview() {
  const [summary, setSummary]     = useState(null);
  const [bedSummary, setBedSummary] = useState(null);
  const [forecast, setForecast]   = useState([]);
  const [alerts, setAlerts]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    const [s, b, f, a] = await Promise.all([
      getDashboardSummary(), getBedSummary(), getFootfallForecast(), getStockoutAlerts(),
    ]);
    setSummary(s);
    setBedSummary(b);
    setForecast(f);
    setAlerts(a);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, [load]);

  return (
    <motion.div {...PAGE_VARIANTS} className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 className="page-title">Overview Dashboard</h1>
          <p className="page-subtitle">Real-time facility management · Auto-refreshes every 30s</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <LiveClock />
          <button
            className="btn btn-ghost"
            style={{ fontSize: '0.75rem' }}
            onClick={load}
            disabled={loading}
          >
            {loading ? <span className="spinner" style={{ width: 13, height: 13 }} /> : <RefreshCw size={13} />}
            {loading ? 'Refreshing…' : `Last: ${lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {loading && !summary ? (
        <div className="grid-4" style={{ marginBottom: 24 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card skeleton" style={{ height: 140 }} />
          ))}
        </div>
      ) : (
        <div className="grid-4" style={{ marginBottom: 24 }}>
          <KPICard
            title="Beds Available"
            value={summary?.available_beds ?? 0}
            subtitle={`of ${summary?.total_beds ?? 0} total`}
            icon={BedDouble}
            color="teal"
            trend={5}
          />
          <KPICard
            title="Low Stock Medicines"
            value={summary?.low_stock_count ?? 0}
            subtitle={`${summary?.critical_stock_count ?? 0} critical`}
            icon={Package}
            color={(summary?.critical_stock_count ?? 0) > 0 ? 'red' : 'amber'}
            trend={-2}
          />
          <KPICard
            title="Doctors Present"
            value={summary?.doctors_present ?? 0}
            subtitle={`Nurses: ${summary?.nurses_present ?? 0}`}
            icon={Users}
            color="blue"
          />
          <KPICard
            title="Today's Patients"
            value={summary?.today_patients ?? 0}
            subtitle="OPD footfall"
            icon={Activity}
            color="amber"
            trend={8}
          />
        </div>
      )}

      {/* Middle Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginBottom: 24 }}>
        {/* Recent Alerts */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <AlertTriangle size={16} color="var(--accent-amber)" />
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Recent Alerts</h2>
            {alerts.length > 0 && (
              <span className="badge badge-warning" style={{ marginLeft: 'auto' }}>{alerts.length} active</span>
            )}
          </div>
          <div>
            {alerts.slice(0, 5).map(alert => (
              <div key={alert.id} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '10px 0',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                <div style={{
                  width: 32, height: 32,
                  borderRadius: 8,
                  background: alert.alert_level === 'critical' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <AlertTriangle size={14} color={alert.alert_level === 'critical' ? 'var(--accent-red)' : 'var(--accent-amber)'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    {alert.medicine_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {alert.days_remaining} days until stockout · Est. {alert.estimated_stockout_date}
                  </div>
                </div>
                <span className={`badge ${alert.alert_level === 'critical' ? 'badge-critical' : 'badge-warning'}`}>
                  {alert.alert_level}
                </span>
              </div>
            ))}
            {alerts.length === 0 && (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>✓</div>
                No active alerts
              </div>
            )}
          </div>
        </div>

        {/* Bed Summary Pie */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <BedDouble size={16} color="var(--accent-teal)" />
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Bed Availability</h2>
          </div>
          {bedSummary ? (
            <BedPieChart summary={bedSummary} />
          ) : (
            <div className="skeleton" style={{ height: 140 }} />
          )}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Occupancy Rate</span>
              <span style={{ color: 'var(--accent-teal)', fontWeight: 600 }}>
                {bedSummary ? Math.round((bedSummary.occupied / bedSummary.total) * 100) : '—'}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Mini Forecast Chart */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Activity size={16} color="var(--accent-teal)" />
          <h2 style={{ fontSize: '0.95rem', fontWeight: 600 }}>7-Day Patient Footfall Trend</h2>
          <span className="chip" style={{ marginLeft: 'auto' }}>AI Forecast</span>
        </div>
        {forecast.length > 0 ? (
          <MiniFootfallChart data={forecast} />
        ) : (
          <div className="skeleton" style={{ height: 100 }} />
        )}
        <div style={{ display: 'flex', gap: 24, marginTop: 12, flexWrap: 'wrap' }}>
          {forecast.map(d => (
            <div key={d.date} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: 2 }}>
                {d.day_name?.slice(0, 3)}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {d.predicted}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
