import { useState, useCallback } from 'react'
import { useApp, useRate } from '../store/AppContext'
import { fmtKgs, usdToKgs } from '../lib/currency'

export default function Settings() {
  const { state, dispatch } = useApp()
  const rate = useRate()
  const { settings, goal } = state

  const [form, setForm] = useState({ ...settings })
  const [goalForm, setGoalForm] = useState({ ...goal, targetEarningsKgs: Math.round((goal.targetEarnings || 0) * rate) })
  const [saved, setSaved] = useState(false)
  const [goalSaved, setGoalSaved] = useState(false)

  /* ── bidirectional sync helpers ── */

  // recalc pgTarget + erTarget + totalTasks from a USD amount, keeping PG:ER ratio
  const recalcTasksFromUsd = useCallback((usd, form) => {
    const pgR = parseFloat(form.pgRate) || 0.04
    const erR = parseFloat(form.erRate) || 0.08
    const pg = parseInt(form.pgTarget) || 0
    const er = parseInt(form.erTarget) || 0
    const total = pg + er
    const pgRatio = total > 0 ? pg / total : 0.6
    const erRatio = 1 - pgRatio
    const avgRate = pgRatio * pgR + erRatio * erR
    if (avgRate <= 0 || usd <= 0) return {}
    const totalTasks = Math.round(usd / avgRate)
    const newPg = Math.round(totalTasks * pgRatio)
    const newEr = totalTasks - newPg
    return { totalTasks, pgTarget: newPg, erTarget: newEr }
  }, [])

  // recalc earnings from current pgTarget + erTarget
  const calcEarningsFromTasks = useCallback((form) => {
    const pgR = parseFloat(form.pgRate) || 0.04
    const erR = parseFloat(form.erRate) || 0.08
    const pg = parseInt(form.pgTarget) || 0
    const er = parseInt(form.erTarget) || 0
    return pg * pgR + er * erR
  }, [])

  /* ── handlers ── */

  // user types in USD earnings field
  function handleUsdChange(val) {
    const usd = parseFloat(val) || 0
    const kgs = Math.round(usd * rate)
    const taskUpdates = recalcTasksFromUsd(usd, goalForm)
    setGoalForm(f => ({ ...f, targetEarnings: val, targetEarningsKgs: kgs, ...taskUpdates }))
  }

  // user types in KGS earnings field
  function handleKgsChange(val) {
    const kgs = parseInt(val) || 0
    const usd = kgs / rate
    const taskUpdates = recalcTasksFromUsd(usd, goalForm)
    setGoalForm(f => ({ ...f, targetEarningsKgs: val, targetEarnings: usd.toFixed(2), ...taskUpdates }))
  }

  // user changes pgTarget or erTarget → recalc earnings
  function handleTaskTargetChange(field, val) {
    const updated = { ...goalForm, [field]: val }
    const usd = calcEarningsFromTasks(updated)
    const kgs = Math.round(usd * rate)
    setGoalForm(f => ({ ...f, [field]: val, targetEarnings: usd.toFixed(2), targetEarningsKgs: kgs }))
  }

  // user changes rates → recalc earnings
  function handleRateChange(field, val) {
    const updated = { ...goalForm, [field]: val }
    const usd = calcEarningsFromTasks(updated)
    const kgs = Math.round(usd * rate)
    setGoalForm(f => ({ ...f, [field]: val, targetEarnings: usd.toFixed(2), targetEarningsKgs: kgs }))
  }

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
        targetEarnings: parseFloat(goalForm.targetEarnings) || 0,
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

  const pgTarget = parseInt(goalForm.pgTarget) || 0
  const erTarget = parseInt(goalForm.erTarget) || 0
  const pgR = parseFloat(goalForm.pgRate) || 0.04
  const erR = parseFloat(goalForm.erRate) || 0.08
  const maxPossible = pgTarget * pgR + erTarget * erR

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

              {/* deadline + total tasks */}
              <div className="g2" style={{ marginBottom: 14 }}>
                <div className="field">
                  <label className="field-label">Всего задач (цель)</label>
                  <input type="number" className="field-input"
                    value={goalForm.totalTasks}
                    onChange={e => setGoalForm(f => ({ ...f, totalTasks: e.target.value }))} />
                </div>
                <div className="field">
                  <label className="field-label">Дедлайн</label>
                  <input type="date" className="field-input"
                    value={goalForm.deadline}
                    onChange={e => setGoalForm(f => ({ ...f, deadline: e.target.value }))} />
                </div>
              </div>

              {/* rates */}
              <div className="g2" style={{ marginBottom: 14 }}>
                <div className="field">
                  <label className="field-label">Ставка Prompt Grading ($)</label>
                  <input type="number" step="0.001" className="field-input"
                    value={goalForm.pgRate}
                    onChange={e => handleRateChange('pgRate', e.target.value)} />
                </div>
                <div className="field">
                  <label className="field-label">Ставка Edit Reward ($)</label>
                  <input type="number" step="0.001" className="field-input"
                    value={goalForm.erRate}
                    onChange={e => handleRateChange('erRate', e.target.value)} />
                </div>
              </div>

              {/* task targets — synced with earnings */}
              <div className="g2" style={{ marginBottom: 14 }}>
                <div className="field">
                  <label className="field-label">Цель PG задач</label>
                  <input type="number" className="field-input"
                    value={goalForm.pgTarget}
                    onChange={e => handleTaskTargetChange('pgTarget', e.target.value)} />
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>
                    = <strong style={{ color: 'var(--primary-light)' }}>${(pgTarget * pgR).toFixed(2)}</strong>
                    {' · '}
                    <span style={{ color: 'var(--warning)' }}>{fmtKgs(usdToKgs(pgTarget * pgR, rate))}</span>
                  </div>
                </div>
                <div className="field">
                  <label className="field-label">Цель ER задач</label>
                  <input type="number" className="field-input"
                    value={goalForm.erTarget}
                    onChange={e => handleTaskTargetChange('erTarget', e.target.value)} />
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>
                    = <strong style={{ color: 'var(--secondary)' }}>${(erTarget * erR).toFixed(2)}</strong>
                    {' · '}
                    <span style={{ color: 'var(--warning)' }}>{fmtKgs(usdToKgs(erTarget * erR, rate))}</span>
                  </div>
                </div>
              </div>

              {/* TARGET EARNINGS — bidirectional USD + KGS */}
              <div style={{
                marginBottom: 18,
                padding: '16px',
                background: 'rgba(16,185,129,0.07)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 'var(--radius-sm)',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>
                  💰 Целевой заработок — меняй в любом поле
                </div>
                <div className="g2" style={{ marginBottom: 8 }}>
                  <div className="field">
                    <label className="field-label">В долларах ($)</label>
                    <input
                      type="number"
                      step="10"
                      className="field-input"
                      placeholder="например 1200"
                      value={goalForm.targetEarnings || ''}
                      onChange={e => handleUsdChange(e.target.value)}
                      style={{ borderColor: 'rgba(16,185,129,0.35)' }}
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">В сомах (сом) 🇰🇬</label>
                    <input
                      type="number"
                      step="1000"
                      className="field-input"
                      placeholder="например 104000"
                      value={goalForm.targetEarningsKgs || ''}
                      onChange={e => handleKgsChange(e.target.value)}
                      style={{ borderColor: 'rgba(245,158,11,0.35)' }}
                    />
                  </div>
                </div>
                {(goalForm.targetEarnings > 0 || goalForm.targetEarningsKgs > 0) && (
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>Курс: <strong style={{ color: 'var(--text)' }}>1$ = {rate.toFixed(1)} сом</strong></span>
                    <span>Макс. возможный: <strong style={{ color: 'var(--text)' }}>${maxPossible.toFixed(2)}</strong> · <strong style={{ color: 'var(--warning)' }}>{fmtKgs(usdToKgs(maxPossible, rate))}</strong></span>
                    {parseFloat(goalForm.targetEarnings) > maxPossible && maxPossible > 0 && (
                      <span style={{ color: 'var(--warning)' }}>⚠ Цель выше макс. — задачи пересчитаны</span>
                    )}
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>
                  ↕ При вводе суммы — автоматически пересчитываются PG и ER задачи выше
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: 15, padding: '12px' }}>
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

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header"><div className="card-title">ℹ️ О приложении</div></div>
        <div style={{ display: 'flex', gap: 40, fontSize: 13, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          <div><strong style={{ color: 'var(--text)' }}>WorkTracker</strong><br/>Бизнес-дашборд для AI labeling и задач</div>
          <div><strong style={{ color: 'var(--text)' }}>Хранение данных</strong><br/>Всё в localStorage браузера</div>
          <div><strong style={{ color: 'var(--text)' }}>Курс USD/KGS</strong><br/>Авто-обновление через open.er-api.com</div>
          <div><strong style={{ color: 'var(--text)' }}>Версия</strong><br/>1.1.0 · React 19 + Vite</div>
        </div>
      </div>
    </div>
  )
}
