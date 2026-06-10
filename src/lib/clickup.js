const BASE = 'https://api.clickup.com/api/v2'

function headers(token) {
  return { Authorization: token, 'Content-Type': 'application/json' }
}

export async function getTeams(token) {
  const res = await fetch(`${BASE}/team`, { headers: headers(token) })
  if (!res.ok) throw new Error('Invalid token or network error')
  const data = await res.json()
  return data.teams || []
}

export async function getSpaces(token, teamId) {
  const res = await fetch(`${BASE}/team/${teamId}/space?archived=false`, { headers: headers(token) })
  if (!res.ok) throw new Error('Failed to fetch spaces')
  const data = await res.json()
  return data.spaces || []
}

export async function getLists(token, spaceId) {
  const res = await fetch(`${BASE}/space/${spaceId}/list?archived=false`, { headers: headers(token) })
  if (!res.ok) throw new Error('Failed to fetch lists')
  const data = await res.json()
  return data.lists || []
}

export async function getTasks(token, listId, page = 0) {
  const res = await fetch(`${BASE}/list/${listId}/task?archived=false&page=${page}&include_closed=false`, { headers: headers(token) })
  if (!res.ok) throw new Error('Failed to fetch tasks')
  const data = await res.json()
  return data.tasks || []
}

export async function updateTaskStatus(token, taskId, statusName) {
  const res = await fetch(`${BASE}/task/${taskId}`, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify({ status: statusName }),
  })
  if (!res.ok) throw new Error('Failed to update task')
  return res.json()
}

export async function createTask(token, listId, { name, description, priority, dueDate }) {
  const body = { name }
  if (description) body.description = description
  if (priority) body.priority = priority
  if (dueDate) body.due_date = new Date(dueDate).getTime()
  const res = await fetch(`${BASE}/list/${listId}/task`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('Failed to create task')
  return res.json()
}

export const PRIORITY_MAP = { 1: 'urgent', 2: 'high', 3: 'normal', 4: 'low' }
export const STATUS_COLORS = {
  'to do': 'gray', 'in progress': 'blue', 'complete': 'green', 'closed': 'green',
}
