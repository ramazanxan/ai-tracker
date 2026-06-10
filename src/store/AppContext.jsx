import { createContext, useContext, useReducer, useEffect, useState } from 'react'
import { fetchUsdKgsRate } from '../lib/currency'

const STORAGE_KEY = 'ai_tracker_v1'

const defaultGoal = {
  totalTasks: 20000,
  deadline: '2026-06-30',
  pgRate: 0.04,
  erRate: 0.08,
  pgTarget: 12000,
  erTarget: 8000,
  targetEarnings: 2000,
}

const defaultState = {
  entries: [],
  goal: defaultGoal,
  calendarNotes: {},
  tasks: [],
  settings: { clickupToken: '', clickupListId: '', theme: 'dark' },
}

function load() {
  try { return { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } }
  catch { return defaultState }
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_ENTRY': {
      const existing = state.entries.findIndex(e => e.date === action.payload.date)
      const entries = existing >= 0
        ? state.entries.map((e, i) => i === existing ? { ...e, pg: e.pg + action.payload.pg, er: e.er + action.payload.er } : e)
        : [...state.entries, action.payload].sort((a, b) => b.date.localeCompare(a.date))
      return { ...state, entries }
    }
    case 'UPDATE_ENTRY': {
      const entries = state.entries.map(e => e.date === action.payload.date ? action.payload : e)
      return { ...state, entries }
    }
    case 'DELETE_ENTRY':
      return { ...state, entries: state.entries.filter(e => e.date !== action.payload) }
    case 'SET_GOAL':
      return { ...state, goal: { ...state.goal, ...action.payload } }
    case 'SET_NOTE':
      return { ...state, calendarNotes: { ...state.calendarNotes, [action.date]: action.note } }
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, { ...action.payload, id: Date.now().toString(), done: false, createdAt: new Date().toISOString() }] }
    case 'TOGGLE_TASK':
      return { ...state, tasks: state.tasks.map(t => t.id === action.id ? { ...t, done: !t.done } : t) }
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.id) }
    case 'SET_TASKS':
      return { ...state, tasks: action.payload }
    case 'SAVE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } }
    default:
      return state
  }
}

const Ctx = createContext(null)
const RateCtx = createContext(87.5)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const [kgsRate, setKgsRate] = useState(() => {
    try { return JSON.parse(localStorage.getItem('usd_kgs_rate') || 'null')?.rate || 87.5 } catch { return 87.5 }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    fetchUsdKgsRate().then(setKgsRate)
  }, [])

  return (
    <RateCtx.Provider value={kgsRate}>
      <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
    </RateCtx.Provider>
  )
}

export function useApp() { return useContext(Ctx) }
export function useRate() { return useContext(RateCtx) }

export function calcStats(entries, goal) {
  const totalPG = entries.reduce((s, e) => s + (e.pg || 0), 0)
  const totalER = entries.reduce((s, e) => s + (e.er || 0), 0)
  const total = totalPG + totalER
  const earned = totalPG * goal.pgRate + totalER * goal.erRate
  const maxEarned = goal.pgTarget * goal.pgRate + goal.erTarget * goal.erRate
  const targetEarnings = goal.targetEarnings || 0
  const earningsLeft = Math.max(0, targetEarnings - earned)
  const earningsPct = targetEarnings > 0 ? Math.min(100, (earned / targetEarnings) * 100) : 0
  const today = new Date().toISOString().slice(0, 10)
  const deadlineDate = new Date(goal.deadline)
  const todayDate = new Date(today)
  const daysLeft = Math.max(0, Math.ceil((deadlineDate - todayDate) / 86400000))
  const remaining = goal.totalTasks - total
  const neededPerDay = daysLeft > 0 ? Math.ceil(remaining / daysLeft) : remaining
  const pgRemaining = Math.max(0, goal.pgTarget - totalPG)
  const erRemaining = Math.max(0, goal.erTarget - totalER)
  const pgNeededPerDay = daysLeft > 0 ? Math.ceil(pgRemaining / daysLeft) : pgRemaining
  const erNeededPerDay = daysLeft > 0 ? Math.ceil(erRemaining / daysLeft) : erRemaining
  const daysWorked = entries.length
  const avgPerDay = daysWorked > 0 ? Math.round(total / daysWorked) : 0
  const onTrack = avgPerDay >= neededPerDay
  const projectedEarnings = daysWorked > 0 && total > 0
    ? earned + avgPerDay * daysLeft * (earned / total)
    : earned
  return {
    totalPG, totalER, total, earned, maxEarned,
    targetEarnings, earningsLeft, earningsPct,
    daysLeft, neededPerDay, pgNeededPerDay, erNeededPerDay,
    pgRemaining, erRemaining,
    avgPerDay, onTrack, projectedEarnings, remaining,
  }
}
