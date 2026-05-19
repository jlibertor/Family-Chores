const apiBase = process.env.API_BASE_URL ?? 'http://127.0.0.1:8787'
const parentPin = process.env.PARENT_PIN ?? '1234'

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}: ${JSON.stringify(body)}`)
  }

  return body
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

const health = await request('/api/health')
assert(health.ok === true, 'Health endpoint did not return ok.')

const members = await request('/api/members')
assert(Array.isArray(members.members) && members.members.length >= 6, 'Expected at least 6 active members.')

const chores = await request('/api/chores')
assert(Array.isArray(chores.chores) && chores.chores.length >= 10, 'Expected at least 10 active chores.')

const today = await request('/api/today')
assert(Array.isArray(today.due), 'Today endpoint should return due chores.')
assert(Array.isArray(today.overdue), 'Today endpoint should return overdue chores.')
assert(Array.isArray(today.completedToday), 'Today endpoint should return completedToday.')

const status = await request('/api/status')
assert(typeof status.weekly?.totalCompleted === 'number', 'Status endpoint should return weekly totals.')
assert(Array.isArray(status.reminders), 'Status endpoint should return reminders.')
assert(Array.isArray(status.suggestions), 'Status endpoint should return suggestions.')

const notes = await request('/api/notes')
assert(Array.isArray(notes.notes), 'Notes endpoint should return notes.')

const unauthorized = await fetch(`${apiBase}/api/admin/members`)
assert(unauthorized.status === 401, 'Admin members should require a PIN.')

const adminMembers = await request('/api/admin/members', {
  headers: { 'X-Parent-Pin': parentPin },
})
assert(Array.isArray(adminMembers.members), 'Admin members endpoint should return members.')

const memberChores = await request(`/api/members/${members.members[0].id}/chores`)
assert(Array.isArray(memberChores.chores), 'Member chore endpoint should return chores.')

const temporaryChore = await request('/api/admin/chores', {
  method: 'POST',
  headers: { 'X-Parent-Pin': parentPin },
  body: JSON.stringify({
    name: 'Smoke Test Assigned Chore',
    description: 'Temporary smoke test chore',
    frequency_type: 'daily',
    assignment_mode: 'assigned_individual',
    assignment_member_ids: [members.members[0].id],
    assigned_member_id: members.members[0].id,
    alert_if_overdue: 1,
    needs_reminder: 0,
    active: 1,
  }),
})
assert(temporaryChore.chore?.id, 'Admin chores endpoint should create a chore.')

const assignedChores = await request(`/api/members/${members.members[0].id}/chores`)
assert(
  assignedChores.chores.some((chore) => chore.id === temporaryChore.chore.id),
  'Assigned chore should appear for the assigned member.',
)

const deletedChore = await request(`/api/admin/chores/${temporaryChore.chore.id}`, {
  method: 'DELETE',
  headers: { 'X-Parent-Pin': parentPin },
})
assert(deletedChore.chore?.active === 0, 'Admin chores endpoint should delete a chore safely.')

const temporaryMember = await request('/api/admin/members', {
  method: 'POST',
  headers: { 'X-Parent-Pin': parentPin },
  body: JSON.stringify({
    display_name: 'Smoke Test Member',
    member_type: 'child',
    sort_order: 99,
    active: 1,
  }),
})
assert(temporaryMember.member?.id, 'Admin members endpoint should create a member.')

const deletedMember = await request(`/api/admin/members/${temporaryMember.member.id}`, {
  method: 'DELETE',
  headers: { 'X-Parent-Pin': parentPin },
})
assert(deletedMember.member?.active === 0, 'Admin members endpoint should delete a member safely.')

const note = await request('/api/admin/notes', {
  method: 'POST',
  headers: { 'X-Parent-Pin': parentPin },
  body: JSON.stringify({
    note_type: 'note',
    text: 'Smoke test note',
    active: 1,
  }),
})
assert(note.note?.id, 'Admin notes endpoint should create a note.')

const exported = await request('/api/admin/export', {
  headers: { 'X-Parent-Pin': parentPin },
})
assert(Array.isArray(exported.members), 'Export should include members.')
assert(Array.isArray(exported.chores), 'Export should include chores.')
assert(Array.isArray(exported.notes), 'Export should include notes.')

const session = await request('/api/session/kiosk', {
  method: 'POST',
  body: JSON.stringify({ deviceLabel: 'Smoke Test Kiosk' }),
})
assert(session.session?.id, 'Kiosk session should return an id.')

const completion = await request('/api/completions', {
  method: 'POST',
  body: JSON.stringify({
    memberId: members.members[0].id,
    choreId: chores.chores[0].id,
    sessionMode: 'kiosk',
    deviceSessionId: session.session.id,
    deviceLabel: 'Smoke Test Kiosk',
    notes: 'Smoke test completion',
  }),
})
assert(completion.completion?.id, 'Completion insert should return an id.')

const recent = await request('/api/completions/recent')
assert(Array.isArray(recent.completions) && recent.completions.length > 0, 'Recent completions should return rows.')

console.log('Smoke checks passed.')
