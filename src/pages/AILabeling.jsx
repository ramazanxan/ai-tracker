import { useState } from 'react'
import { useApp, calcStats } from '../store/AppContext'
import { format } from 'date-fns'

function ProgressBar({ label, value, max, color }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0)
  return (
    <div className="progress-wrap" style={{ marginBottom: 14 }}>
      <div className="progress-row">
        <span>{label}</span>
        <span>{value.toLocaleString()} / {max.toLocaleString()} ({pct.toFixed(1)}%)</span>
      </div>
      <div className="progress-track">
        <div className={`progress-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function AILabeling() {
  const { state, dispatch } = useApp()
  const { entries, goal } = state
  const s = calcStats(entries, goal)

  const today = format(new Date(), 'yyyy-MM-dd')
  const [date, setDate] = useState(today)
  const [pg, setPg] = useState('')
  const [er, setEr] = useState('')
  const [editEntry, setEditEntry] = useState(null)
  const [showAll, setShowAll] = useState(false)

  function handleAdd(e) {
    e.preventDefault()
    if (!date) return
    dispatch({
      type: 'ADD_ENTRY',
      payload: { date, pg: parseInt(pg) || 0, er: parseInt(er) || 0 },
    })
    setPg('')
    setEr('')
    setDate(today)
  }

  function handleSaveEdit(e) {
    e.preventDefault()
    dispatch({ type: 'UPDATE_ENTRY', payload: editEntry })
    setEditEntry(null)
  }

  const displayed = showAll ? entries : entries.slice(0, 20)

  return (
    <div className="page">
      {/* Add form */}
      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(139,92,246,0.06))' }}>
        <div className="card-header">
          <div className="card-title">➕ Добавить день</div>
          <div className="chip"><span className="chip-dot"/><span>Сохраняется автоматически</span></div>
        </div>
        <form onSubmit={handleAdd}>
          <div className="form-row">
            <div className="field">
              <label className="field-label">Дата</label>
              <input type="date" className="field-input" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">Prompt Grading ($0.04)</label>
              <input type="number" min="0" className="field-input" placeholder="0" value={pg} onChange={e => setPg(e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">Edit Reward ($0.08)</label>
              <input type="number" min="0" className="field-input" placeholder="0" value={er} onChange={e => setEr(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginBottom: 0 }}>Добавить</button>
          </div>
        </form>
      </div>

      {/* Stats row */}
      <div className="g4" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-label">Выполнено</div>
          <div className="stat-big purple" style={{ marginTop: 8 }}>{s.total.toLocaleString()}</div>
          <div className="stat-sub">из {goal.totalTasks.toLocaleString()} · {((s.total / goal.totalTasks) * 100).toFixed(1)}%</div>
        </div>
        <div className="card">
          <div className="card-label">Заработано</div>
          <div className="stat-big green" style={{ marginTop: 8 }}>${s.earned.toFixed(2)}</div>
          <div className="stat-sub">из ${(goal.pgTarget * goal.pgRate + goal.erTarget * goal.erRate).toFixed(2)}</div>
        </div>
        <div className="card">
          <div className="card-label">Нужно / день</div>
          <div className={`stat-big ${s.onTrack ? 'green' : ''}`} style={{ marginTop: 8 }}>{s.neededPerDay.toLocaleString()}</div>
          <div className="stat-sub">Среднее: {s.avgPerDay.toLocaleString()}/день</div>
        </div>
        <div className="card">
          <div className="card-label">Прогноз заработка</div>
          <div className="stat-big" style={{ marginTop: 8 }}>${s.projectedEarnings.toFixed(2)}</div>
          <div className="stat-sub">при текущем темпе</div>
        </div>
      </div>

      {/* Progress */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><div className="card-title">Прогресс</div></div>
        <ProgressBar label="Общий прогресс" value={s.total} max={goal.totalTasks} color="purple" />
        <ProgressBar label={`Prompt Grading ($${goal.pgRate})`} value={s.totalPG} max={goal.pgTarget} color="green" />
        <ProgressBar label={`Edit Reward ($${goal.erRate})`} value={s.totalER} max={goal.erTarget} color="amber" />
      </div>

      {/* History */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">История ({entries.length} дней)</div>
          {entries.length > 20 && (
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAll(!showAll)}>
              {showAll ? 'Свернуть' : `Показать все (${entries.length})`}
            </button>
          )}
        </div>

        {editEntry && (
          <form onSubmit={handleSaveEdit} style={{ marginBottom: 16, padding: 16, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
            <div className="form-row">
              <div className="field">
                <label className="field-label">Дата</label>
                <input type="date" className="field-input" value={editEntry.date} readOnly />
              </div>
              <div className="field">
                <label className="field-label">Prompt Grading</label>
                <input type="number" min="0" className="field-input" value={editEntry.pg} onChange={e => setEditEntry({ ...editEntry, pg: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="field">
                <label className="field-label">Edit Reward</label>
                <input type="number" min="0" className="field-input" value={editEntry.er} onChange={e => setEditEntry({ ...editEntry, er: parseInt(e.target.value) || 0 })} />
              </div>
              <button type="submit" className="btn btn-primary">Сохранить</button>
              <button type="button" className="btn btn-ghost" onClick={() => setEditEntry(null)}>Отмена</button>
            </div>
          </form>
        )}

        {entries.length === 0 ? (
          <div className="empty">
            <div className="empty-ico">🤖</div>
            <div className="empty-title">Нет записей</div>
            <div className="empty-sub">Добавь первый день с помощью формы выше</div>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Prompt Grading</th>
                <th>Edit Reward</th>
                <th>Итого</th>
                <th>Заработано</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map(e => {
                const total = (e.pg || 0) + (e.er || 0)
                const earned = (e.pg || 0) * goal.pgRate + (e.er || 0) * goal.erRate
                return (
                  <tr key={e.date}>
                    <td className="bold">{new Date(e.date + 'T00:00:00').toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                    <td className="purple">{(e.pg || 0).toLocaleString()}</td>
                    <td className="green">{(e.er || 0).toLocaleString()}</td>
                    <td className="bold">{total.toLocaleString()}</td>
                    <td className="green">${earned.toFixed(2)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditEntry({ ...e })}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => dispatch({ type: 'DELETE_ENTRY', payload: e.date })}>🗑</button>
                      </div>
                    </td>
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

