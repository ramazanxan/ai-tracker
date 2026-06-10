import { useApp, calcStats, useRate } from '../store/AppContext'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { fmtKgs, usdToKgs } from '../lib/currency'

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

function Money({ usd, rate, big }) {
  const kgs = usdToKgs(usd, rate)
  if (big) return (
    <div>
      <div className="stat-big green">${usd.toFixed(2)}</div>
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
      <div className="g4" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-label">Выполнено</div>
          <div className="stat-big purple" style={{ marginTop: 8 }}>{s.total.toLocaleString()}</div>
          <div className="stat-sub">из {goal.totalTasks.toLocaleString()} · {((s.total / goal.totalTasks) * 100).toFixed(1)}%</div>
          <div className={`stat-pill ${s.onTrack ? 'up' : 'warn'}`}>
            {s.onTrack ? '✓ Успеваешь' : '⚠ Нужно больше'}
          </div>
        </div>

        <div className="card">
          <div className="card-label">Заработано</div>
          <div style={{ marginTop: 8 }}>
            <Money usd={s.earned} rate={rate} big />
          </div>
          <div className="stat-sub" style={{ marginTop: 8 }}>из ${s.maxEarned.toFixed(2)} / {fmtKgs(usdToKgs(s.maxEarned, rate))}</div>
        </div>

        <div className="card">
          <div className="card-label">Нужно / день</div>
          <div className="stat-big" style={{ marginTop: 8 }}>{s.neededPerDay.toLocaleString()}</div>
          <div className="stat-sub">Среднее: {s.avgPerDay.toLocaleString()}/день</div>
          <div className={`stat-pill ${s.onTrack ? 'up' : 'warn'}`}>
            {s.onTrack ? '✓ Успеваешь' : '⚠ Нужно больше'}
          </div>
        </div>

        <div className="card">
          <div className="card-label">Прогноз заработка</div>
          <div style={{ marginTop: 8 }}>
            <div className="stat-big">${s.projectedEarnings.toFixed(2)}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--warning)', marginTop: 4 }}>
              ≈ {fmtKgs(usdToKgs(s.projectedEarnings, rate))}
            </div>
          </div>
          <div className="stat-sub" style={{ marginTop: 8 }}>при текущем темпе</div>
        </div>
      </div>

      {/* Exchange rate chip */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="chip" style={{ fontSize: 12 }}>
          <span>💱</span>
          <span>1 USD = <strong style={{ color: 'var(--warning)' }}>{rate.toFixed(1)} сом</strong></span>
        </div>
        <div className="chip" style={{ fontSize: 11, color: 'var(--text-dim)' }}>Курс обновляется автоматически</div>
      </div>

      <div className="g2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Прогресс</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/labeling')}>Детали →</button>
          </div>
          <ProgressBar label="Общий" value={s.total} max={goal.totalTasks} color="purple" />
          <ProgressBar label={`Prompt Grading ($${goal.pgRate})`} value={s.totalPG} max={goal.pgTarget} color="green" />
          <ProgressBar label={`Edit Reward ($${goal.erRate})`} value={s.totalER} max={goal.erTarget} color="amber" />
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Задачи ClickUp</div>
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
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '12px 16px' }}>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{pendingTasks}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>В работе</div>
                </div>
                <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '12px 16px' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--secondary)' }}>{tasks.length - pendingTasks}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Выполнено</div>
                </div>
              </div>
              {tasks.slice(0, 4).map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 14 }}>{t.done ? '✅' : '⬜'}</span>
                  <span style={{ fontSize: 13, color: t.done ? 'var(--text-dim)' : 'var(--text)', textDecoration: t.done ? 'line-through' : 'none', flex: 1 }}>{t.name}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Последние записи</div>
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
                <th>Сомы</th>
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
