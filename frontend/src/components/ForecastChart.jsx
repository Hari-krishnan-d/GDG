import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Area, AreaChart,
} from 'recharts';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="tooltip-custom" style={{
      background: '#1a2035',
      border: '1px solid rgba(0,212,170,0.3)',
      borderRadius: 10,
      padding: '12px 16px',
      fontSize: '0.82rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      <div style={{ fontWeight: 700, color: 'var(--accent-teal)', marginBottom: 6 }}>
        {d?.day_name || label}
      </div>
      <div style={{ color: 'var(--text-secondary)' }}>
        <span style={{ color: 'var(--text-muted)' }}>Date: </span>{d?.date}
      </div>
      <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: 4 }}>
        <span style={{ color: 'var(--text-muted)' }}>Predicted: </span>
        {Math.round(payload[0]?.value)} patients
      </div>
      {d?.lower && d?.upper && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 2 }}>
          Range: {d.lower}–{d.upper}
        </div>
      )}
    </div>
  );
}

export default function ForecastChart({ forecastData = [] }) {
  const isWeekend = (dayName) => ['Saturday', 'Sunday'].includes(dayName);

  const data = forecastData.map(d => ({
    ...d,
    label: d.day_name?.slice(0, 3) || d.date,
  }));

  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#00d4aa" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#00d4aa" stopOpacity={0}    />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            tick={{ fill: '#475569', fontSize: 12, fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tick={{ fill: '#475569', fontSize: 12, fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
            width={40}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Highlight weekends */}
          {data.map((entry, i) =>
            isWeekend(entry.day_name) ? (
              <ReferenceLine key={i} x={entry.label} stroke="rgba(245,158,11,0.08)" strokeWidth={24} />
            ) : null
          )}

          <Area
            type="monotone"
            dataKey="predicted"
            stroke="#00d4aa"
            strokeWidth={2.5}
            fill="url(#tealGrad)"
            dot={{ fill: '#00d4aa', r: 4, strokeWidth: 2, stroke: '#080c18' }}
            activeDot={{ r: 6, fill: '#00d4aa', stroke: '#080c18', strokeWidth: 2 }}
            isAnimationActive={true}
            animationDuration={1000}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
