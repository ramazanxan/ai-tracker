import { useState } from 'react'
import { useApp } from '../store/AppContext'

export default function Settings() {
  const { state, dispatch } = useApp()
  const { settings, goal } = state

  const [form, setForm] = useState({ ...settings })
  const [goalForm, setGoalForm] = useState({ ...goal })
  const [saved, setSaved] = useState(false)
  const [goalSaved, setGoalSaved] = useState(false)

  function saveSettings(e) {
    e.preventDefault()
    dispatch({ type: 'SAVE_SETTINGS', payload: form })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function saveGoal(e) {
    e.preventDefault()
    dispatch({
      type: 'SET_GOAL',
      payload: {
        totalTasks: parseInt(goalForm.totalTasks) || 20000,
        deadline: goalForm.deadline,
        pgRate: parseFloat(goalForm.pgRate) || 0.04,
        erRate: parseFloat(goalForm.erRate) || 0.08,
        pgTarget: parseInt(goalForm.pgTarget) || 12000,
        erTarget: parseInt(goalForm.erTarget) || 8000,
      },
    })
    setGoalSaved(true)
    setTimeout(() => setGoalSaved(false), 2000)
  }

  function clearAllData() {
    if (!window.confirm('Удалить ВСЕ данные? Это нельзя отменить.')) return
    localStorage.clear()
    window.location.reload()
  }

  return (
    <div className="page">
      <div className="g2">
        {/* ClickUp settings */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🔗 ClickUp интеграция</div>
          </div>
          <form onSubmit={saveSettings}>
            <div className="field" style={{ marginBottom: 16 }}>
              <label className="field-label">Personal API Token</label>
              <input
                type="password"
                className="field-input"
                placeholder="pk_xxxxxxxxxx..."
                value={form.clickupToken}
                onChange={e => setForm(f => ({ ...f, clickupToken: e.target.value }))}
              />
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                Получи на: ClickUp → Settings → Apps → API Token
              </div>
            </div>
            <div className="field" style={{ marginBottom: 20 }}>
              <label className="field-label">Default List ID (необязательно)</label>
              <input
                type="text"
                className="field-input"
                placeholder="901xxxxxxxx"
                value={form.clickupListId}
                onChange={e => setForm(f => ({ ...f, clickupListId: e.target.value }))}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              {saved ? '✅ Сохранено!' : 'Сохранить настройки ClickUp'}
            </button>
          </form>

          <div className="divider" />

          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Как получить API токен:</div>
            <ol style={{ paddingLeft: 18, lineHeight: 2 }}>
              <li>Открой ClickUp → нажми свой аватар</li>
              <li>Settings → Apps</li>
              <li>API Token → Copy</li>
            </ol>
          </div>
        </div>

        {/* Goal settings */}
        <div>
          <div className="card" style={{ marginBottom: 18 }}>
            <div className="card-header">
              <div className="card-title">🎯 Цель AI Labeling</div>
            </div>
            <form onSubmit={saveGoal}>
              <div className="g2" style={{ marginBottom: 14 }}>
                <div className="field">
                  <label className="field-label">Всего задач (цель)</label>
                  <input type="number" className="field-input" value={goalForm.totalTasks} onChange={e => setGoalForm(f => ({ ...f, totalTasks: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="field-label">Дедлайн</label>
                  <input type="date" className="field-input" value={goalForm.deadline} onChange={e => setGoalForm(f => ({ ...f, deadline: e.target.value }))} />
                </div>
              </div>
              <div className="g2" style={{ marginBottom: 14 }}>
                <div className="field">
                  <label className="field-label">Ставка Prompt Grading ($)</label>
                  <input type="number" step="0.01" className="field-input" value={goalForm.pgRate} onChange={e => setGoalForm(f => ({ ...f, pgRate: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="field-label">Ставка Edit Reward ($)</label>
                  <input type="number" step="0.01" className="field-input" value={goalForm.erRate} onChange={e => setGoalForm(f => ({ ...f, erRate: e.target.value }))} />
                </div>
              </div>
              <div className="g2" style={{ marginBottom: 20 }}>
                <div className="field">
                  <label className="field-label">Цель PG (из {goalForm.totalTasks})</label>
                  <input type="number" className="field-input" value={goalForm.pgTarget} onChange={e => setGoalForm(f => ({ ...f, pgTarget: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="field-label">Цель ER (из {goalForm.totalTasks})</label>
                  <input type="number" className="field-input" value={goalForm.erTarget} onChange={e => setGoalForm(f => ({ ...f, erTarget: e.target.value }))} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                {goalSaved ? '✅ Сохранено!' : 'Сохранить цели'}
              </button>
            </form>
          </div>

          {/* Danger zone */}
          <div className="card" style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="card-header">
              <div className="card-title" style={{ color: 'var(--danger)' }}>⚠️ Опасная зона</div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
              Удаление всех данных нельзя отменить. Все записи, задачи и настройки будут стёрты.
            </div>
            <button className="btn btn-danger" style={{ width: '100%' }} onClick={clearAllData}>
              🗑 Удалить все данные
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header"><div className="card-title">ℹ️ О приложении</div></div>
        <div style={{ display: 'flex', gap: 40, fontSize: 13, color: 'var(--text-muted)' }}>
          <div><strong style={{ color: 'var(--text)' }}>WorkTracker</strong><br/>Бизнес-дашборд для AI labeling и задач</div>
          <div><strong style={{ color: 'var(--text)' }}>Хранение данных</strong><br/>Всё в localStorage браузера</div>
          <div><strong style={{ color: 'var(--text)' }}>ClickUp API</strong><br/>REST API v2, Personal Token</div>
          <div><strong style={{ color: 'var(--text)' }}>Версия</strong><br/>1.0.0 · React 19 + Vite</div>
        </div>
      </div>
    </div>
  )
}

