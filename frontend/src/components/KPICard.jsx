import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const COLOR_MAP = {
  teal:  { bg: 'rgba(0,212,170,0.12)',  icon: '#00d4aa', glow: 'rgba(0,212,170,0.2)'  },
  amber: { bg: 'rgba(245,158,11,0.12)', icon: '#f59e0b', glow: 'rgba(245,158,11,0.2)' },
  red:   { bg: 'rgba(239,68,68,0.12)',  icon: '#ef4444', glow: 'rgba(239,68,68,0.2)'  },
  blue:  { bg: 'rgba(59,130,246,0.12)', icon: '#3b82f6', glow: 'rgba(59,130,246,0.2)' },
};

function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    if (typeof target !== 'number') { setCount(target); return; }
    const start = 0;
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(start + (target - start) * eased));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return count;
}

export default function KPICard({ title, value, subtitle, icon: Icon, color = 'teal', trend }) {
  const theme = COLOR_MAP[color] || COLOR_MAP.teal;
  const animatedValue = useCountUp(typeof value === 'number' ? value : 0);
  const displayValue = typeof value === 'number' ? animatedValue : value;

  const trendPositive = trend > 0;
  const trendNeutral  = trend === 0 || trend === undefined;

  return (
    <motion.div
      className="glass-card"
      style={{ padding: '22px 24px', cursor: 'default', position: 'relative', overflow: 'hidden' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -3, boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 24px ${theme.glow}` }}
    >
      {/* Background glow accent */}
      <div style={{
        position: 'absolute', top: -30, right: -30,
        width: 100, height: 100,
        background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`,
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      {/* Icon */}
      <div style={{
        width: 42, height: 42,
        background: theme.bg,
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
        border: `1px solid ${theme.icon}30`,
      }}>
        {Icon && <Icon size={20} color={theme.icon} strokeWidth={2} />}
      </div>

      {/* Value */}
      <div style={{
        fontSize: '2rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        letterSpacing: '-0.03em',
        lineHeight: 1,
        marginBottom: 4,
      }}>
        {displayValue}
      </div>

      {/* Title */}
      <div style={{
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        fontWeight: 500,
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
        marginBottom: subtitle ? 8 : 0,
      }}>
        {title}
      </div>

      {/* Subtitle + Trend */}
      {(subtitle || !trendNeutral) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          {subtitle && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {subtitle}
            </span>
          )}
          {!trendNeutral && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 3,
              fontSize: '0.75rem',
              fontWeight: 600,
              color: trendPositive ? 'var(--accent-teal)' : 'var(--accent-red)',
            }}>
              {trendPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
