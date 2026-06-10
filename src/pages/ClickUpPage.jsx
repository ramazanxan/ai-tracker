import { useState, useEffect } from 'react'
import { useApp } from '../store/AppContext'
import { getTeams, getSpaces, getLists, getTasks, updateTaskStatus, createTask, PRIORITY_MAP } from '../lib/clickup'
import { useNavigate } from 'react-router-dom'

const PRIORITY_BADGE = { urgent: 'badge-red', high: 'badge-amber', normal: 'badge-blue', low: 'badge-gray' }

export default function ClickUpPage() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const token = state.settings.clickupToken
  const [teams, setTeams] = useState([])
  const [spaces, setSpaces] = useState([])
  const [lists, setLists] = useState([])
  const [tasks, setTasks] = useState([])
  const [selTeam, setSelTeam] = useState('')
  const [selSpace, setSelSpace] = useState('')
  const [selList, setSelList] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newTask, setNewTask] = useState({ name: '', description: '', priority: 3 })
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!token) return
    setLoading(true)
    getTeams(token)
      .then(t => { setTeams(t); if (t.length === 1) setSelTeam(t[0].id) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  useEffect(() => {
    if (!selTeam || !token) return
    getSpaces(token, selTeam).then(setSpaces).catch(e => setError(e.message))
  }, [selTeam, token])

  useEffect(() => {
    if (!selSpace || !token) return
    getLists(token, selSpace).then(setLists).catch(e => setError(e.message))
  }, [selSpace, token])

  async function loadTasks() {
    if (!selList || !token) return
    setLoading(true)
    try {
      const t = await getTasks(token, selList)
      setTasks(t)
      setError('')
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadTasks() }, [selList])

  async function handleToggle(task) {
    const newStatus = task.status?.status === 'complete' ? 'to do' : 'complete'
    try {
      await updateTaskStatus(token, task.id, newStatus)
      setTasks(ts => ts.map(t => t.id === task.id ? { ...t, status: { ...t.status, status: newStatus } } : t))
      dispatch({
        type: 'TOGGLE_TASK',
        id: task.id,
      })
    } catch(e) { setError(e.message) }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!newTask.name || !selList) return
    setLoading(true)
    try {
      const created = await createTask(token, selList, { ...newTask, priority: newTask.priority })
      setTasks(ts => [created, ...ts])
      dispatch({ type: 'ADD_TASK', payload: { name: created.name, description: created.description, priority: PRIORITY_MAP[newTask.priority] || 'normal', clickupId: created.id } })
      setNewTask({ name: '', description: '', priority: 3 })
      setShowAdd(false)
    } catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const filtered = tasks.filter(t => {
    if (filter === 'open') return t.status?.status !== 'complete' && t.status?.status !== 'closed'
    if (filter === 'done') return t.status?.status === 'complete' || t.status?.status === 'closed'
    return true
  })

  if (!token) {
    return (
      <div className="page">
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>ClickUp не подключён</div>
          <div style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Добавь Personal API токен в настройках</div>
          <button className="btn btn-primary" onClick={() => navigate('/settings')}>⚙️ Открыть настройки</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: 16, color: 'var(--danger)', fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Workspace selector */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><div className="card-title">🔗 ClickUp</div>
          <button className="btn btn-secondary btn-sm" onClick={loadTasks} disabled={loading}>
            {loading ? '...' : '🔄 Обновить'}
          </button>
        </div>
        <div className="form-row">
          <div className="field">
            <label className="field-label">Workspace</label>
            <select className="field-input" value={selTeam} onChange={e => setSelTeam(e.target.value)}>
              <option value="">Выбери workspace</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Space</label>
            <select className="field-input" value={selSpace} onChange={e => setSelSpace(e.target.value)} disabled={!spaces.length}>
              <option value="">Выбери space</option>
              {spaces.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field-label">List</label>
            <select className="field-input" value={selList} onChange={e => setSelList(e.target.value)} disabled={!lists.length}>
              <option value="">Выбери list</option>
              {lists.map(l => <option key={l.id} value={l.id}>{l.name} ({l.task_count})</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'open', 'done'].map(f => (
              <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'Все' : f === 'open' ? 'Активные' : 'Выполнены'}
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)} disabled={!selList}>
            + Создать задачу
          </button>
        </div>

        {showAdd && (
          <form onSubmit={handleCreate} style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: 16, marginBottom: 16 }}>
            <div className="form-row" style={{ marginBottom: 10 }}>
              <div className="field" style={{ flex: 2 }}>
                <label className="field-label">Название задачи</label>
                <input className="field-input" placeholder="Что нужно сделать?" value={newTask.name} onChange={e => setNewTask(n => ({ ...n, name: e.target.value }))} autoFocus required />
              </div>
              <div className="field">
                <label className="field-label">Приоритет</label>
                <select className="field-input" value={newTask.priority} onChange={e => setNewTask(n => ({ ...n, priority: parseInt(e.target.value) }))}>
                  <option value={1}>🔴 Urgent</option>
                  <option value={2}>🟠 High</option>
                  <option value={3}>🔵 Normal</option>
                  <option value={4}>⚪ Low</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>Создать</button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>✕</button>
            </div>
            <div className="field">
              <textarea className="field-input" rows={2} placeholder="Описание (необязательно)" value={newTask.description} onChange={e => setNewTask(n => ({ ...n, description: e.target.value }))} />
            </div>
          </form>
        )}

        {loading && !tasks.length ? (
          <div className="empty"><div className="empty-ico">⏳</div><div className="empty-title">Загрузка...</div></div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-ico">✅</div>
            <div className="empty-title">{selList ? 'Нет задач' : 'Выбери list'}</div>
            <div className="empty-sub">{selList ? 'Все задачи выполнены!' : 'Выбери workspace → space → list выше'}</div>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th>Задача</th>
                <th>Статус</th>
                <th>Приоритет</th>
                <th>Исполнитель</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(task => {
                const isDone = task.status?.status === 'complete' || task.status?.status === 'closed'
                const priority = task.priority ? PRIORITY_MAP[task.priority.priority] || 'normal' : 'normal'
                return (
                  <tr key={task.id}>
                    <td>
                      <button className="btn btn-ghost btn-sm" style={{ fontSize: 16, padding: 0 }} onClick={() => handleToggle(task)}>
                        {isDone ? '✅' : '⬜'}
                      </button>
                    </td>
                    <td className="bold" style={{ textDecoration: isDone ? 'line-through' : 'none', opacity: isDone ? 0.6 : 1 }}>
                      {task.name}
                    </td>
                    <td><span className={`badge badge-${isDone ? 'green' : 'blue'}`}>{task.status?.status || 'to do'}</span></td>
                    <td><span className={`badge ${PRIORITY_BADGE[priority] || 'badge-gray'}`}>{priority}</span></td>
                    <td style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                      {task.assignees?.map(a => a.username || a.email).join(', ') || '—'}
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

