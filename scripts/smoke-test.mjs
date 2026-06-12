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
assert(Array.isArray(chores.chores) && chores.chores.length > 0, 'Expected at least one active chore.')

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
    frequency_type: 'weekdays',
    assignment_mode: 'assigned_individual',
    assignment_member_ids: [members.members[0].id],
    assigned_member_id: members.members[0].id,
    alert_if_overdue: 1,
    needs_reminder: 0,
    active: 1,
  }),
})
assert(temporaryChore.chore?.id, 'Admin chores endpoint should create a chore.')
assert(temporaryChore.chore.frequency_type === 'weekdays', 'Admin chores endpoint should save weekday frequency.')

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

const longNickname = 'Smoke Test Nickname That Is Longer Than Twenty'
const temporaryMember = await request('/api/admin/members', {
  method: 'POST',
  headers: { 'X-Parent-Pin': parentPin },
  body: JSON.stringify({
    display_name: 'Smoke Test Member',
    nickname: longNickname,
    avatar_id: 'frog-wizard',
    member_type: 'child',
    sort_order: 99,
    active: 1,
  }),
})
assert(temporaryMember.member?.id, 'Admin members endpoint should create a member.')
assert(temporaryMember.member.nickname === longNickname, 'Admin members endpoint should save the full nickname.')
assert(temporaryMember.member.avatar_id === 'frog-wizard', 'Admin members endpoint should save the avatar id.')

const publicMembersAfterNickname = await request('/api/members')
assert(
  publicMembersAfterNickname.members.some(
    (member) =>
      member.id === temporaryMember.member.id &&
      member.nickname === longNickname &&
      member.avatar_id === 'frog-wizard',
  ),
  'Public members endpoint should return the saved nickname and avatar id.',
)

const adminMembersAfterNickname = await request('/api/admin/members', {
  headers: { 'X-Parent-Pin': parentPin },
})
assert(
  adminMembersAfterNickname.members.some(
    (member) =>
      member.id === temporaryMember.member.id &&
      member.display_name === 'Smoke Test Member' &&
      member.nickname === longNickname &&
      member.avatar_id === 'frog-wizard',
  ),
  'Admin members endpoint should return real name, nickname, and avatar id.',
)

const nicknameChore = await request('/api/admin/chores', {
  method: 'POST',
  headers: { 'X-Parent-Pin': parentPin },
  body: JSON.stringify({
    name: 'Smoke Test Nickname Chore',
    description: 'Temporary smoke test nickname chore',
    frequency_type: 'weekends',
    assignment_mode: 'assigned_individual',
    assignment_member_ids: [temporaryMember.member.id],
    assigned_member_id: temporaryMember.member.id,
    alert_if_overdue: 1,
    needs_reminder: 0,
    active: 1,
  }),
})
assert(nicknameChore.chore?.id, 'Admin chores endpoint should create a nickname chore.')
assert(nicknameChore.chore.frequency_type === 'weekends', 'Admin chores endpoint should save weekend frequency.')
assert(nicknameChore.chore.feeds_aquarium === 1, 'New chores should feed the aquarium by default.')

const nicknameMemberChores = await request(`/api/members/${temporaryMember.member.id}/chores`)
const publicNicknameChore = nicknameMemberChores.chores.find((chore) => chore.id === nicknameChore.chore.id)
assert(publicNicknameChore, 'Nickname chore should appear for the nickname member.')
assert(
  publicNicknameChore.responsible_member_name === longNickname ||
    publicNicknameChore.assigned_member_name === longNickname,
  'Public chore responses should show the full nickname.',
)
assert(
  publicNicknameChore.responsible_member_avatar_id === 'frog-wizard' ||
    publicNicknameChore.assigned_member_avatar_id === 'frog-wizard',
  'Public chore responses should include the member avatar id.',
)

const nicknameCompletion = await request('/api/completions', {
  method: 'POST',
  body: JSON.stringify({
    memberId: temporaryMember.member.id,
    choreId: nicknameChore.chore.id,
    sessionMode: 'kiosk',
    notes: 'Smoke test nickname completion',
  }),
})
assert(nicknameCompletion.completion?.id, 'Nickname completion insert should return an id.')
assert(nicknameCompletion.aquariumEvent?.fedMessage, 'Child completions should feed the aquarium.')

const noFeedChore = await request('/api/admin/chores', {
  method: 'POST',
  headers: { 'X-Parent-Pin': parentPin },
  body: JSON.stringify({
    name: 'Smoke Test No Fish Food Chore',
    description: 'Temporary smoke test chore that should not feed fish',
    frequency_type: 'as_needed',
    assignment_mode: 'assigned_individual',
    assignment_member_ids: [temporaryMember.member.id],
    assigned_member_id: temporaryMember.member.id,
    alert_if_overdue: 0,
    needs_reminder: 0,
    feeds_aquarium: 0,
    active: 1,
  }),
})
assert(noFeedChore.chore?.id, 'Admin chores endpoint should create a no-feed chore.')
assert(noFeedChore.chore.feeds_aquarium === 0, 'Admin chores endpoint should save fish feeding opt-out.')

const noFeedCompletion = await request('/api/completions', {
  method: 'POST',
  body: JSON.stringify({
    memberId: temporaryMember.member.id,
    choreId: noFeedChore.chore.id,
    sessionMode: 'kiosk',
    notes: 'Smoke test no fish food completion',
  }),
})
assert(noFeedCompletion.completion?.id, 'No-feed completion insert should return an id.')
assert(noFeedCompletion.aquariumEvent === null, 'Chores with fish feeding off should not feed the aquarium.')

const recentWithNickname = await request('/api/completions/recent')
assert(
  recentWithNickname.completions.some(
    (completion) =>
      completion.id === nicknameCompletion.completion.id &&
      completion.member_name === longNickname &&
      completion.member_avatar_id === 'frog-wizard',
  ),
  'Recent completions should show the full nickname and avatar id.',
)

const deletedNicknameChore = await request(`/api/admin/chores/${nicknameChore.chore.id}`, {
  method: 'DELETE',
  headers: { 'X-Parent-Pin': parentPin },
})
assert(deletedNicknameChore.chore?.active === 0, 'Admin chores endpoint should delete the nickname chore safely.')

const deletedNoFeedChore = await request(`/api/admin/chores/${noFeedChore.chore.id}`, {
  method: 'DELETE',
  headers: { 'X-Parent-Pin': parentPin },
})
assert(deletedNoFeedChore.chore?.active === 0, 'Admin chores endpoint should delete the no-feed chore safely.')

const deletedMember = await request(`/api/admin/members/${temporaryMember.member.id}`, {
  method: 'DELETE',
  headers: { 'X-Parent-Pin': parentPin },
})
assert(deletedMember.member?.active === 0, 'Admin members endpoint should delete a member safely.')

const blankNicknameMember = await request('/api/admin/members', {
  method: 'POST',
  headers: { 'X-Parent-Pin': parentPin },
  body: JSON.stringify({
    display_name: 'Smoke Test Blank Nickname',
    nickname: '   ',
    avatar_id: 'black-cat',
    member_type: 'child',
    sort_order: 100,
    active: 1,
  }),
})
assert(blankNicknameMember.member?.id, 'Admin members endpoint should create a blank nickname member.')
assert(blankNicknameMember.member.nickname === null, 'Blank nickname should be stored as null.')
assert(blankNicknameMember.member.avatar_id === 'black-cat', 'Blank nickname member should keep the avatar id.')

const blankNicknameChore = await request('/api/admin/chores', {
  method: 'POST',
  headers: { 'X-Parent-Pin': parentPin },
  body: JSON.stringify({
    name: 'Smoke Test Blank Nickname Chore',
    description: 'Temporary smoke test blank nickname chore',
    frequency_type: 'daily',
    assignment_mode: 'assigned_individual',
    assignment_member_ids: [blankNicknameMember.member.id],
    assigned_member_id: blankNicknameMember.member.id,
    alert_if_overdue: 1,
    needs_reminder: 0,
    active: 1,
  }),
})
assert(blankNicknameChore.chore?.id, 'Admin chores endpoint should create a blank nickname chore.')

const blankNicknameMemberChores = await request(`/api/members/${blankNicknameMember.member.id}/chores`)
const publicBlankNicknameChore = blankNicknameMemberChores.chores.find((chore) => chore.id === blankNicknameChore.chore.id)
assert(publicBlankNicknameChore, 'Blank nickname chore should appear for the blank nickname member.')
assert(
  publicBlankNicknameChore.responsible_member_name === 'Smoke Test Blank Nickname' ||
    publicBlankNicknameChore.assigned_member_name === 'Smoke Test Blank Nickname',
  'Public chore responses should fall back to the real name when nickname is blank.',
)
assert(
  publicBlankNicknameChore.responsible_member_avatar_id === 'black-cat' ||
    publicBlankNicknameChore.assigned_member_avatar_id === 'black-cat',
  'Public chore responses should include avatar id when nickname is blank.',
)

const deletedBlankNicknameChore = await request(`/api/admin/chores/${blankNicknameChore.chore.id}`, {
  method: 'DELETE',
  headers: { 'X-Parent-Pin': parentPin },
})
assert(deletedBlankNicknameChore.chore?.active === 0, 'Admin chores endpoint should delete the blank nickname chore safely.')

const deletedBlankNicknameMember = await request(`/api/admin/members/${blankNicknameMember.member.id}`, {
  method: 'DELETE',
  headers: { 'X-Parent-Pin': parentPin },
})
assert(deletedBlankNicknameMember.member?.active === 0, 'Admin members endpoint should delete a blank nickname member safely.')

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
assert(completion.aquariumEvent === null, 'Adult completions should not feed the aquarium.')
assert(completion.earnedBug?.id, 'Completion insert should award an earned bug.')
assert(
  completion.earnedBug.family_member_id === members.members[0].id,
  'Earned bug should belong to the completing member.',
)
assert(completion.earnedBug.chore_id === chores.chores[0].id, 'Earned bug should link to the completed chore.')
assert(
  completion.earnedBug.completion_id === completion.completion.id,
  'Earned bug should link to the completion.',
)
assert(typeof completion.earnedBug.bug_id === 'string', 'Earned bug should include a bug id.')

const earnedAtMs = new Date(`${completion.earnedBug.earned_at}Z`).getTime()
const expiresAtMs = new Date(`${completion.earnedBug.expires_at}Z`).getTime()
const threeDaysMs = 3 * 24 * 60 * 60 * 1000
assert(
  Math.abs(expiresAtMs - earnedAtMs - threeDaysMs) < 60_000,
  'Earned bug should expire about 3 days after it is earned.',
)

const memberBugs = await request(`/api/members/${members.members[0].id}/bugs`)
assert(Array.isArray(memberBugs.bugs), 'Member bugs endpoint should return bugs.')
assert(
  memberBugs.bugs.some((bug) => bug.id === completion.earnedBug.id),
  'Member bugs endpoint should include the newly earned active bug.',
)

const removedBug = await request(`/api/bugs/${completion.earnedBug.id}/remove`, {
  method: 'POST',
  body: JSON.stringify({ reason: 'overclicked' }),
})
assert(removedBug.bug?.removed_at, 'Earned bug removal should set removed_at.')
assert(removedBug.bug.removed_reason === 'overclicked', 'Earned bug removal should save the removal reason.')

const memberBugsAfterRemoval = await request(`/api/members/${members.members[0].id}/bugs`)
assert(
  !memberBugsAfterRemoval.bugs.some((bug) => bug.id === completion.earnedBug.id),
  'Member bugs endpoint should exclude removed bugs.',
)

const recent = await request('/api/completions/recent')
assert(Array.isArray(recent.completions) && recent.completions.length > 0, 'Recent completions should return rows.')

console.log('Smoke checks passed.')
