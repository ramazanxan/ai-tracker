import { useState } from 'react'
import { useApp } from '../store/AppContext'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns'
import { ru } from 'date-fns/locale'

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export default function CalendarPage() {
  const { state, dispatch } = useApp()
  const { entries, calendarNotes, tasks } = state
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selected, setSelected] = useState(new Date())
  const [note, setNote] = useState('')
  const [noteInput, setNoteInput] = useState('')
  const [addingTask, setAddingTask] = useState(false)
  const [taskName, setTaskName] = useState('')

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  const selKey = format(selected, 'yyyy-MM-dd')
  const selEntry = entries.find(e => e.date === selKey)
  const selNote = calendarNotes[selKey] || ''
  const selTasks = tasks.filter(t => t.dueDate === selKey)
  const selTotal = selEntry ? (selEntry.pg || 0) + (selEntry.er || 0) : 0

  function prevMonth() { setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)) }
  function nextMonth() { setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)) }

  function saveNote() {
    dispatch({ type: 'SET_NOTE', date: selKey, note: noteInput })
    setNoteInput('')
  }

  function addTask() {
    if (!taskName.trim()) return
    dispatch({ type: 'ADD_TASK', payload: { name: taskName, dueDate: selKey, priority: 'normal', description: '' } })
    setTaskName('')
    setAddingTask(false)
  }

  return (
    <div className="page">
      <div className="g2">
        {/* Calendar */}
        <div className="card">
          <div className="card-header">
            <button className="btn btn-ghost btn-sm" onClick={prevMonth}>←</button>
            <div className="card-title" style={{ textTransform: 'capitalize' }}>
              {format(currentDate, 'LLLL yyyy', { locale: ru })}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={nextMonth}>→</button>
          </div>

          <div className="cal-grid">
            {DAYS.map(d => (
              <div key={d} className="cal-day-name">{d}</div>
            ))}
            {days.map(day => {
              const key = format(day, 'yyyy-MM-dd')
              const entry = entries.find(e => e.date === key)
              const dayTasks = tasks.filter(t => t.dueDate === key)
              const total = entry ? (entry.pg || 0) + (entry.er || 0) : 0
              const inMonth = isSameMonth(day, currentDate)
              const isSelected = isSameDay(day, selected)
              const hasData = !!entry || dayTasks.length > 0

              return (
                <div
                  key={key}
                  className={`cal-day${!inMonth ? ' empty' : ''}${isToday(day) ? ' today' : ''}${isSelected ? ' selected' : ''}${hasData ? ' has-data' : ''}`}
                  style={{ opacity: inMonth ? 1 : 0.25 }}
                  onClick={() => inMonth && setSelected(day)}
                >
                  <span>{format(day, 'd')}</span>
                  {total > 0 && <span className="cal-tasks-count">{total.toLocaleString()}</span>}
                  <span className="cal-dot" />
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-dim)' }}>
            <span>🟢 Есть данные</span>
            <span>🟣 Сегодня</span>
            <span>Нажми на день — увидишь детали</span>
          </div>
        </div>

        {/* Day detail */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <div className="card-title">
                {format(selected, 'd MMMM yyyy', { locale: ru })}
              </div>
              {isToday(selected) && <span className="badge badge-green">Сегодня</span>}
            </div>

            {selEntry ? (
              <>
                <div className="g2" style={{ marginBottom: 16 }}>
                  <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: 14 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>PROMPT GRADING</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary-light)' }}>{(selEntry.pg || 0).toLocaleString()}</div>
                  </div>
                  <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: 14 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>EDIT REWARD</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--secondary)' }}>{(selEntry.er || 0).toLocaleString()}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--border)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Итого: <strong style={{ color: 'var(--text)' }}>{selTotal.toLocaleString()}</strong></span>
                  <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>
                    +${((selEntry.pg || 0) * state.goal.pgRate + (selEntry.er || 0) * state.goal.erRate).toFixed(2)}
                  </span>
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--text-dim)', fontSize: 13, padding: '12px 0' }}>Нет записей по AI Labeling</div>
            )}
          </div>

          {/* Notes */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><div className="card-title">📝 Заметки</div></div>
            {selNote && (
              <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: 12, fontSize: 13, marginBottom: 12, color: 'var(--text-muted)', whiteSpace: 'pre-wrap' }}>
                {selNote}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="field-input"
                placeholder="Добавить заметку..."
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveNote()}
              />
              <button className="btn btn-primary" onClick={saveNote}>Сохранить</button>
            </div>
          </div>

          {/* Tasks for this day */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">✅ Задачи на день</div>
              <button className="btn btn-primary btn-sm" onClick={() => setAddingTask(true)}>+ Добавить</button>
            </div>

            {addingTask && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  className="field-input"
                  placeholder="Название задачи..."
                  value={taskName}
                  onChange={e => setTaskName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                  autoFocus
                />
                <button className="btn btn-primary btn-sm" onClick={addTask}>Добавить</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setAddingTask(false)}>✕</button>
              </div>
            )}

            {selTasks.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Нет задач на этот день</div>
            ) : (
              selTasks.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <button className="btn btn-ghost btn-sm" style={{ padding: 0, fontSize: 16 }} onClick={() => dispatch({ type: 'TOGGLE_TASK', id: t.id })}>
                    {t.done ? '✅' : '⬜'}
                  </button>
                  <span style={{ flex: 1, fontSize: 13, color: t.done ? 'var(--text-dim)' : 'var(--text)', textDecoration: t.done ? 'line-through' : 'none' }}>{t.name}</span>
                  <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px', color: 'var(--danger)' }} onClick={() => dispatch({ type: 'DELETE_TASK', id: t.id })}>×</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

