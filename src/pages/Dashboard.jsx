import { useApp, calcStats, useRate } from '../store/AppContext'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { fmtKgs, usdToKgs } from '../lib/currency'
import { useEffect, useRef, useState } from 'react'

/* ---------- animated number counter ---------- */
function useCountUp(target, duration = 900) {
  const [count, setCount] = useState(0)
  const prevTarget = useRef(0)
  useEffect(() => {
    const from = prevTarget.current
    prevTarget.current = target
    if (from === target) return
    const startTime = performance.now()
    const diff = target - from
    let raf
    function step(now) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(from + diff * ease))
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return count
}

function AnimNum({ value, prefix = '', suffix = '', decimals = 0 }) {
  const animated = useCountUp(decimals > 0 ? Math.round(value * 100) : value)
  const display = decimals > 0 ? (animated / 100).toFixed(decimals) : animated.toLocaleString()
  return <>{prefix}{display}{suffix}</>
}

/* ---------- progress bar ---------- */
function ProgressBar({ label, value, max, color }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0)
  return (
    <div className="progress-wrap" style={{ marginBottom: 14 }}>
      <div className="progress-row">
        <span>{label}</span>
        <span>{value.toLocaleString()} / {max.toLocaleString()}</span>
      </div>
      <div className="progress-track">
        <div className={`progress-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/* ---------- money display ---------- */
function Money({ usd, rate, big }) {
  const kgs = usdToKgs(usd, rate)
  if (big) return (
    <div>
      <div className="stat-big green">
        <AnimNum value={usd} prefix="$" decimals={2} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--warning)', marginTop: 4 }}>
        ≈ {fmtKgs(kgs)}
      </div>
    </div>
  )
  return (
    <span>
      ${usd.toFixed(2)}
      <span style={{ fontSize: '0.82em', color: 'var(--warning)', marginLeft: 6, fontWeight: 600 }}>
        ≈ {fmtKgs(kgs)}
      </span>
    </span>
  )
}

/* ---------- mini stat chip ---------- */
function MiniStat({ label, value, color, bg, border }) {
  return (
    <div style={{
      flex: 1,
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 10,
      padding: '9px 11px',
    }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-dim)', marginBottom: 3, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    </div>
  )
}

/* ---------- main dashboard ---------- */
export default function Dashboard() {
  const { state } = useApp()
  const rate = useRate()
  const navigate = useNavigate()
  const { entries, goal, tasks } = state
  const s = calcStats(entries, goal)
  const today = format(new Date(), 'yyyy-MM-dd')
  const todayEntry = entries.find(e => e.date === today)
  const todayTotal = todayEntry ? (todayEntry.pg || 0) + (todayEntry.er || 0) : 0
  const pendingTasks = tasks.filter(t => !t.done).length
  const recentEntries = entries.slice(0, 5)

  return (
    <div className="page">
      {/* ── top 4 stat cards ── */}
      <div className="g4 anim-stagger" style={{ marginBottom: 24 }}>

        {/* Выполнено */}
        <div className="card card-glow-purple">
          <div className="card-label">Выполнено</div>
          <div className="stat-big purple" style={{ marginTop: 8 }}>
            <AnimNum value={s.total} />
          </div>
          <div className="stat-sub">из {goal.totalTasks.toLocaleString()} · {((s.total / goal.totalTasks) * 100).toFixed(1)}%</div>
          <div className={`stat-pill ${s.onTrack ? 'up' : 'warn'}`} style={{ marginTop: 10 }}>
            {s.onTrack ? '✓ Успеваешь' : '⚠ Нужно больше'}
          </div>
        </div>

        {/* Заработано */}
        <div className="card card-glow-green">
          <div className="card-label">Заработано</div>
          <div style={{ marginTop: 8 }}>
            <Money usd={s.earned} rate={rate} big />
          </div>
          {s.targetEarnings > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>
                <span>Цель: ${s.targetEarnings.toLocaleString()}</span>
                <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>{s.earningsPct.toFixed(0)}%</span>
              </div>
              <div className="progress-track" style={{ height: 5 }}>
                <div className="progress-fill green" style={{ width: `${s.earningsPct}%` }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                Осталось: <span style={{ color: 'var(--warning)', fontWeight: 600 }}>${s.earningsLeft.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Нужно / день — с разбивкой PG и ER */}
        <div className="card card-glow-amber">
          <div className="card-label">Нужно / день</div>
          <div className="stat-big" style={{ marginTop: 8, color: s.onTrack ? 'var(--secondary)' : 'var(--warning)' }}>
            <AnimNum value={s.neededPerDay} />
          </div>
          <div className="stat-sub">Среднее: {s.avgPerDay.toLocaleString()}/день</div>
          <div style={{ display: 'flex', gap: 7, marginTop: 12 }}>
            <MiniStat
              label="PG / день"
              value={s.pgNeededPerDay.toLocaleString()}
              color="var(--primary-light)"
              bg="rgba(124,58,237,0.1)"
              border="rgba(124,58,237,0.22)"
            />
            <MiniStat
              label="ER / день"
              value={s.erNeededPerDay.toLocaleString()}
              color="var(--secondary)"
              bg="rgba(16,185,129,0.08)"
              border="rgba(16,185,129,0.2)"
            />
          </div>
        </div>

        {/* Прогноз */}
        <div className="card card-glow-blue">
          <div className="card-label">Прогноз заработка</div>
          <div style={{ marginTop: 8 }}>
            <div className="stat-big">
              <AnimNum value={s.projectedEarnings} prefix="$" decimals={2} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--warning)', marginTop: 4 }}>
              ≈ {fmtKgs(usdToKgs(s.projectedEarnings, rate))}
            </div>
          </div>
          <div className="stat-sub" style={{ marginTop: 8 }}>при текущем темпе</div>
          {s.targetEarnings > 0 && (
            <div className={`stat-pill ${s.projectedEarnings >= s.targetEarnings ? 'up' : 'warn'}`} style={{ marginTop: 10 }}>
              {s.projectedEarnings >= s.targetEarnings ? '✓ Цель достижима' : '⚠ Ниже цели'}
            </div>
          )}
        </div>
      </div>

      {/* exchange rate + today chip */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div className="chip">
          <span>💱</span>
          <span>1 USD = <strong style={{ color: 'var(--warning)' }}>{rate.toFixed(1)} сом</strong></span>
        </div>
        <div className="chip">
          <span>📅</span>
          <span>Сегодня: <strong style={{ color: 'var(--primary-light)' }}>{todayTotal.toLocaleString()}</strong> задач</span>
        </div>
        <div className="chip">
          <span>⏳</span>
          <span>До дедлайна: <strong style={{ color: s.daysLeft < 7 ? 'var(--danger)' : 'var(--text)' }}>{s.daysLeft} дней</strong></span>
        </div>
      </div>

      <div className="g2" style={{ marginBottom: 24 }}>
        {/* Progress */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">📊 Прогресс</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/labeling')}>Детали →</button>
          </div>
          <ProgressBar label="Общий" value={s.total} max={goal.totalTasks} color="purple" />
          <ProgressBar label={`Prompt Grading ($${goal.pgRate})`} value={s.totalPG} max={goal.pgTarget} color="green" />
          <ProgressBar label={`Edit Reward ($${goal.erRate})`} value={s.totalER} max={goal.erTarget} color="amber" />

          {s.targetEarnings > 0 && (
            <>
              <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />
              <div className="progress-wrap">
                <div className="progress-row">
                  <span>💰 Цель заработка</span>
                  <span>${s.earned.toFixed(2)} / ${s.targetEarnings}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill green" style={{ width: `${s.earningsPct}%` }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>
                  {fmtKgs(usdToKgs(s.earned, rate))} из {fmtKgs(usdToKgs(s.targetEarnings, rate))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ClickUp tasks */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">✅ Задачи ClickUp</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tasks')}>Все →</button>
          </div>
          {tasks.length === 0 ? (
            <div className="empty">
              <div className="empty-ico">✅</div>
              <div className="empty-title">Нет задач</div>
              <div className="empty-sub">Добавь ClickUp токен в настройках</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--warning)' }}>{pendingTasks}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>В работе</div>
                </div>
                <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--secondary)' }}>{tasks.length - pendingTasks}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>Выполнено</div>
                </div>
                <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{tasks.length}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>Всего</div>
                </div>
              </div>
              {tasks.slice(0, 4).map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 14 }}>{t.done ? '✅' : '⬜'}</span>
                  <span style={{ fontSize: 13, color: t.done ? 'var(--text-dim)' : 'var(--text)', textDecoration: t.done ? 'line-through' : 'none', flex: 1 }}>{t.name}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* recent entries */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">📋 Последние записи</div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/labeling')}>Все →</button>
        </div>
        {recentEntries.length === 0 ? (
          <div className="empty">
            <div className="empty-ico">📋</div>
            <div className="empty-title">Нет записей</div>
            <div className="empty-sub">Добавь первый день в разделе AI Labeling</div>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Prompt Grading</th>
                <th>Edit Reward</th>
                <th>Итого</th>
                <th>USD</th>
                <th>Сомы 🇰🇬</th>
              </tr>
            </thead>
            <tbody>
              {recentEntries.map(e => {
                const total = (e.pg || 0) + (e.er || 0)
                const earned = (e.pg || 0) * goal.pgRate + (e.er || 0) * goal.erRate
                return (
                  <tr key={e.date}>
                    <td className="bold">{new Date(e.date + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</td>
                    <td className="purple">{(e.pg || 0).toLocaleString()}</td>
                    <td className="green">{(e.er || 0).toLocaleString()}</td>
                    <td className="bold">{total.toLocaleString()}</td>
                    <td className="green">${earned.toFixed(2)}</td>
                    <td style={{ color: 'var(--warning)', fontWeight: 600 }}>{fmtKgs(usdToKgs(earned, rate))}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
