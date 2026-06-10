import { useApp, calcStats, useRate } from '../store/AppContext'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { fmtKgs, usdToKgs } from '../lib/currency'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.value?.toLocaleString()}</strong>
        </div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const { state } = useApp()
  const rate = useRate()
  const { entries, goal } = state
  const s = calcStats(entries, goal)

  const chartData = [...entries].sort((a, b) => a.date.localeCompare(b.date)).map(e => ({
    date: format(new Date(e.date + 'T00:00:00'), 'd MMM', { locale: ru }),
    'Итого': (e.pg || 0) + (e.er || 0),
    'PG': e.pg || 0,
    'ER': e.er || 0,
    usd: (e.pg || 0) * goal.pgRate + (e.er || 0) * goal.erRate,
    kgs: usdToKgs((e.pg || 0) * goal.pgRate + (e.er || 0) * goal.erRate, rate),
  }))

  const cumData = chartData.reduce((acc, d, i) => {
    const prev = acc[i - 1] || { cumTotal: 0, cumUsd: 0, cumKgs: 0 }
    acc.push({ ...d, cumTotal: prev.cumTotal + d['Итого'], cumUsd: prev.cumUsd + d.usd, cumKgs: prev.cumKgs + d.kgs })
    return acc
  }, [])

  if (entries.length === 0) return (
    <div className="page">
      <div className="empty" style={{ paddingTop: 120 }}>
        <div className="empty-ico">📊</div>
        <div className="empty-title">Нет данных для аналитики</div>
        <div className="empty-sub">Добавь записи в разделе AI Labeling</div>
      </div>
    </div>
  )

  return (
    <div className="page">
      <div className="g4" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-label">Всего задач</div>
          <div className="stat-big purple" style={{ marginTop: 8 }}>{s.total.toLocaleString()}</div>
          <div className="stat-sub">{((s.total / goal.totalTasks) * 100).toFixed(1)}% от цели</div>
        </div>
        <div className="card">
          <div className="card-label">Заработано</div>
          <div className="stat-big green" style={{ marginTop: 8 }}>${s.earned.toFixed(2)}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--warning)', marginTop: 4 }}>≈ {fmtKgs(usdToKgs(s.earned, rate))}</div>
        </div>
        <div className="card">
          <div className="card-label">Прогноз заработка</div>
          <div className="stat-big" style={{ marginTop: 8 }}>${s.projectedEarnings.toFixed(2)}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--warning)', marginTop: 4 }}>≈ {fmtKgs(usdToKgs(s.projectedEarnings, rate))}</div>
        </div>
        <div className="card">
          <div className="card-label">Среднее / день</div>
          <div className="stat-big" style={{ marginTop: 8 }}>{s.avgPerDay.toLocaleString()}</div>
          <div className="stat-sub">за {entries.length} дней</div>
        </div>
      </div>

      <div className="chip" style={{ marginBottom: 20, display: 'inline-flex' }}>
        <span>💱</span>
        <span>1 USD = <strong style={{ color: 'var(--warning)' }}>{rate.toFixed(1)} сом</strong></span>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><div className="card-title">📈 Задачи по дням</div></div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fill: 'var(--text-dim)', fontSize: 11 }} />
            <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="PG" fill="#8B5CF6" radius={[3,3,0,0]} />
            <Bar dataKey="ER" fill="#10B981" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 20, marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
          <span style={{ color: '#8B5CF6' }}>■ Prompt Grading</span>
          <span style={{ color: '#10B981' }}>■ Edit Reward</span>
        </div>
      </div>

      <div className="g2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">💰 Заработок в USD</div></div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-dim)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="usd" stroke="#10B981" fill="url(#gradGreen)" name="USD $" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">🇰🇬 Заработок в сомах</div></div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="gradAmber" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-dim)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="kgs" stroke="#F59E0B" fill="url(#gradAmber)" name="Сом с" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">📋 История (последние 10 записей)</div></div>
        <table className="tbl">
          <thead>
            <tr><th>Дата</th><th>PG</th><th>ER</th><th>Итого</th><th>USD</th><th>Сомы 🇰🇬</th><th>% цели дня</th></tr>
          </thead>
          <tbody>
            {entries.slice(0, 10).map(e => {
              const total = (e.pg || 0) + (e.er || 0)
              const earned = (e.pg || 0) * goal.pgRate + (e.er || 0) * goal.erRate
              const pct = s.neededPerDay > 0 ? ((total / s.neededPerDay) * 100).toFixed(0) : '—'
              return (
                <tr key={e.date}>
                  <td className="bold">{new Date(e.date + 'T00:00:00').toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                  <td className="purple">{(e.pg || 0).toLocaleString()}</td>
                  <td className="green">{(e.er || 0).toLocaleString()}</td>
                  <td className="bold">{total.toLocaleString()}</td>
                  <td className="green">${earned.toFixed(2)}</td>
                  <td style={{ color: 'var(--warning)', fontWeight: 600 }}>{fmtKgs(usdToKgs(earned, rate))}</td>
                  <td><span className={`badge badge-${parseInt(pct) >= 100 ? 'green' : parseInt(pct) >= 75 ? 'amber' : 'red'}`}>{pct}%</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
