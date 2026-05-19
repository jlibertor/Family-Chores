import { useEffect, useMemo, useState } from 'react'
import './App.css'

type MemberType = 'adult' | 'child'
type FrequencyType = 'daily' | 'weekly' | 'as_needed'

type Member = {
  id: number
  display_name: string
  member_type: MemberType
  sort_order: number
  active: 0 | 1
}

type Chore = {
  id: number
  name: string
  description: string | null
  frequency_type: FrequencyType
  assigned_member_id: number | null
  assigned_member_name?: string | null
  alert_if_overdue: 0 | 1
  needs_reminder: 0 | 1
  active: 0 | 1
  is_due: 0 | 1
  is_overdue: 0 | 1
  last_completed_at: string | null
  last_completed_by: string | null
}

type Completion = {
  id: number
  member_name: string
  chore_name: string
  completed_at: string
  session_mode: 'member' | 'kiosk' | 'admin' | null
  device_label: string | null
  notes: string | null
}

type SessionState = {
  id: number
  mode: 'member' | 'kiosk'
  memberId: number | null
  deviceLabel: string
}

type TodayState = {
  due: Chore[]
  overdue: Chore[]
  completedToday: Completion[]
}

type HouseholdStatus = {
  weekly: {
    totalCompleted: number
    byMember: Array<{
      member_id: number
      member_name: string
      completed_count: number
      points: number
    }>
    mostActive: {
      member_name: string
      completed_count: number
      points: number
    } | null
  }
  reminders: Chore[]
  suggestions: Array<{
    chore_id: number
    message: string
  }>
}

type MemberDraft = {
  id: number | null
  display_name: string
  member_type: MemberType
  sort_order: number
  active: 0 | 1
}

type ChoreDraft = {
  id: number | null
  name: string
  description: string
  frequency_type: FrequencyType
  assigned_member_id: number | ''
  alert_if_overdue: 0 | 1
  needs_reminder: 0 | 1
  active: 0 | 1
}

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

const memberKey = 'family-chores.member-id'
const sessionKey = 'family-chores.session'

const routes = ['/today', '/choose-mode', '/member', '/kiosk', '/history', '/admin'] as const

const emptyMemberDraft: MemberDraft = {
  id: null,
  display_name: '',
  member_type: 'child',
  sort_order: 10,
  active: 1,
}

const emptyChoreDraft: ChoreDraft = {
  id: null,
  name: '',
  description: '',
  frequency_type: 'daily',
  assigned_member_id: '',
  alert_if_overdue: 0,
  needs_reminder: 0,
  active: 1,
}

function isKnownRoute(pathname: string) {
  return routes.includes(pathname as (typeof routes)[number])
}

async function api<T>(path: string, options?: RequestInit, attempts = 2): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(path, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      })

      const body = (await response.json()) as T & { error?: string }

      if (!response.ok) {
        throw new Error(body.error ?? 'Request failed.')
      }

      return body
    } catch (currentError) {
      lastError = currentError
      if (attempt === attempts || options?.method) {
        break
      }
      await new Promise((resolve) => window.setTimeout(resolve, 350))
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Request failed.')
}

function getStoredSession() {
  const raw = localStorage.getItem(sessionKey)
  if (!raw) return null

  try {
    return JSON.parse(raw) as SessionState
  } catch {
    localStorage.removeItem(sessionKey)
    return null
  }
}

function App() {
  const [route, setRoute] = useState(() =>
    isKnownRoute(window.location.pathname) ? window.location.pathname : '/today',
  )
  const [members, setMembers] = useState<Member[]>([])
  const [chores, setChores] = useState<Chore[]>([])
  const [history, setHistory] = useState<Completion[]>([])
  const [today, setToday] = useState<TodayState>({ due: [], overdue: [], completedToday: [] })
  const [status, setStatus] = useState<HouseholdStatus>({
    weekly: { totalCompleted: 0, byMember: [], mostActive: null },
    reminders: [],
    suggestions: [],
  })
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [error, setError] = useState('')
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(() => {
    const stored = Number(localStorage.getItem(memberKey))
    return Number.isInteger(stored) && stored > 0 ? stored : null
  })
  const [session, setSession] = useState<SessionState | null>(() => getStoredSession())
  const [pendingChore, setPendingChore] = useState<Chore | null>(null)
  const [kioskMemberId, setKioskMemberId] = useState<number | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [adminPin, setAdminPin] = useState('')
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [adminMembers, setAdminMembers] = useState<Member[]>([])
  const [adminChores, setAdminChores] = useState<Chore[]>([])
  const [memberDraft, setMemberDraft] = useState<MemberDraft>(emptyMemberDraft)
  const [choreDraft, setChoreDraft] = useState<ChoreDraft>(emptyChoreDraft)
  const [submitting, setSubmitting] = useState(false)
  const [completionNote, setCompletionNote] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => 'Notification' in window && Notification.permission === 'granted',
  )
  const [currentTime, setCurrentTime] = useState(() => new Date())

  const selectedMember = useMemo(
    () => members.find((member) => member.id === selectedMemberId) ?? null,
    [members, selectedMemberId],
  )
  const kioskMember = useMemo(
    () => members.find((member) => member.id === kioskMemberId) ?? null,
    [members, kioskMemberId],
  )
  const dueChores = chores.filter((chore) => chore.is_due === 1)
  const otherChores = chores.filter((chore) => chore.is_due !== 1)

  function navigate(nextRoute: string) {
    window.history.pushState({}, '', nextRoute)
    setRoute(nextRoute)
    setError('')
    setPendingChore(null)
    setSuccessMessage('')
  }

  async function refreshHousehold() {
    setLoadState('loading')
    setError('')

    try {
      const [memberData, choreData, todayData, statusData, historyData] = await Promise.all([
        api<{ ok: boolean; members: Member[] }>('/api/members'),
        api<{ ok: boolean; chores: Chore[] }>('/api/chores'),
        api<TodayState & { ok: boolean }>('/api/today'),
        api<HouseholdStatus & { ok: boolean }>('/api/status'),
        api<{ ok: boolean; completions: Completion[] }>('/api/completions/recent'),
      ])

      setMembers(memberData.members)
      setChores(choreData.chores)
      setToday({
        due: todayData.due,
        overdue: todayData.overdue,
        completedToday: todayData.completedToday,
      })
      setStatus({
        weekly: statusData.weekly,
        reminders: statusData.reminders,
        suggestions: statusData.suggestions,
      })
      setHistory(historyData.completions)
      setLoadState('ready')
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Could not load app data.')
      setLoadState('error')
    }
  }

  async function loadAdminData(pin = adminPin) {
    const [memberData, choreData] = await Promise.all([
      api<{ ok: boolean; members: Member[] }>('/api/admin/members', {
        headers: { 'X-Parent-Pin': pin },
      }),
      api<{ ok: boolean; chores: Chore[] }>('/api/admin/chores', {
        headers: { 'X-Parent-Pin': pin },
      }),
    ])

    setAdminMembers(memberData.members)
    setAdminChores(choreData.chores)
  }

  useEffect(() => {
    void Promise.resolve().then(() => refreshHousehold())
    const clock = window.setInterval(() => setCurrentTime(new Date()), 30_000)

    const onPopState = () => {
      setRoute(isKnownRoute(window.location.pathname) ? window.location.pathname : '/today')
    }

    window.addEventListener('popstate', onPopState)
    return () => {
      window.clearInterval(clock)
      window.removeEventListener('popstate', onPopState)
    }
  }, [])

  async function chooseMemberDevice(memberId: number) {
    setError('')

    try {
      const member = members.find((item) => item.id === memberId)
      const data = await api<{ ok: boolean; session: SessionState }>('/api/session/select-member', {
        method: 'POST',
        body: JSON.stringify({
          memberId,
          deviceLabel: member ? `${member.display_name} Device` : 'Personal Device',
        }),
      })

      localStorage.setItem(memberKey, String(memberId))
      localStorage.setItem(sessionKey, JSON.stringify(data.session))
      setSelectedMemberId(memberId)
      setSession(data.session)
      navigate('/member')
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Could not select this member.')
    }
  }

  async function chooseKioskDevice() {
    setError('')

    try {
      const data = await api<{ ok: boolean; session: SessionState }>('/api/session/kiosk', {
        method: 'POST',
        body: JSON.stringify({ deviceLabel: 'Kitchen Tablet' }),
      })

      localStorage.setItem(sessionKey, JSON.stringify(data.session))
      setSession(data.session)
      setKioskMemberId(null)
      navigate('/kiosk')
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Could not start kiosk mode.')
    }
  }

  async function submitCompletion(memberId: number, chore: Chore, mode: 'member' | 'kiosk') {
    setError('')
    setSubmitting(true)

    try {
      await api('/api/completions', {
        method: 'POST',
        body: JSON.stringify({
          memberId,
          choreId: chore.id,
          sessionMode: mode,
        deviceSessionId: session?.mode === mode ? session.id : undefined,
        deviceLabel: session?.deviceLabel,
        notes: completionNote,
      }),
    })

      const member = members.find((item) => item.id === memberId)
      setSuccessMessage(`${member?.display_name ?? 'Someone'} completed ${chore.name}.`)
      maybeShowCompletionNotification(member?.display_name ?? 'Someone', chore.name)
      setPendingChore(null)
      setCompletionNote('')
      await refreshHousehold()

      if (mode === 'kiosk') {
        setKioskMemberId(null)
      }
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Could not save that completion.')
    } finally {
      setSubmitting(false)
    }
  }

  async function unlockAdmin() {
    setError('')
    try {
      await loadAdminData(adminPin)
      setAdminUnlocked(true)
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Could not unlock parent setup.')
    }
  }

  async function saveMember() {
    setError('')

    try {
      const method = memberDraft.id ? 'PUT' : 'POST'
      const path = memberDraft.id ? `/api/admin/members/${memberDraft.id}` : '/api/admin/members'
      await api(path, {
        method,
        headers: { 'X-Parent-Pin': adminPin },
        body: JSON.stringify(memberDraft),
      })
      setMemberDraft(emptyMemberDraft)
      await Promise.all([loadAdminData(), refreshHousehold()])
      setSuccessMessage('Family member saved.')
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Could not save family member.')
    }
  }

  async function saveChore() {
    setError('')

    try {
      const method = choreDraft.id ? 'PUT' : 'POST'
      const path = choreDraft.id ? `/api/admin/chores/${choreDraft.id}` : '/api/admin/chores'
      await api(path, {
        method,
        headers: { 'X-Parent-Pin': adminPin },
        body: JSON.stringify({
          ...choreDraft,
          assigned_member_id: choreDraft.assigned_member_id === '' ? null : choreDraft.assigned_member_id,
        }),
      })
      setChoreDraft(emptyChoreDraft)
      await Promise.all([loadAdminData(), refreshHousehold()])
      setSuccessMessage('Chore saved.')
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Could not save chore.')
    }
  }

  async function enableNotifications() {
    if (!('Notification' in window)) {
      setError('This browser does not support notifications.')
      return
    }

    const permission = await Notification.requestPermission()
    setNotificationsEnabled(permission === 'granted')
    if (permission === 'granted') {
      new Notification('Family Chores reminders enabled')
    }
  }

  function maybeShowCompletionNotification(memberName: string, choreName: string) {
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Chore completed', {
        body: `${memberName} completed ${choreName}.`,
      })
    }
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <button type="button" className="brand-button" onClick={() => navigate('/today')}>
          Family Chores
        </button>
        <nav aria-label="Main navigation">
          <button type="button" onClick={() => navigate('/today')}>Today</button>
          <button type="button" onClick={() => navigate('/member')}>Member</button>
          <button type="button" onClick={() => navigate('/kiosk')}>Kiosk</button>
          <button type="button" onClick={() => navigate('/history')}>History</button>
          <button type="button" onClick={() => navigate('/admin')}>Setup</button>
        </nav>
      </header>

      {loadState === 'loading' && <p className="notice">Loading household data...</p>}
      {error && <p className="notice error">{error}</p>}
      {successMessage && <p className="notice success">{successMessage}</p>}

      {route === '/today' && (
        <TodayView
          today={today}
          chores={chores}
          status={status}
          notificationsEnabled={notificationsEnabled}
          onEnableNotifications={() => void enableNotifications()}
          onStart={() => navigate('/choose-mode')}
        />
      )}

      {route === '/choose-mode' && (
        <section className="screen">
          <div className="screen-heading">
            <p className="eyebrow">Choose mode</p>
            <h1>How is this device used?</h1>
          </div>

          <div className="choice-grid">
            <section className="panel">
              <h2>This is my device</h2>
              <p>Pick a family member and this browser will remember them.</p>
              <div className="button-grid">
                {members.map((member) => (
                  <button key={member.id} type="button" onClick={() => void chooseMemberDevice(member.id)}>
                    {member.display_name}
                  </button>
                ))}
              </div>
            </section>

            <section className="panel">
              <h2>This is a shared kiosk</h2>
              <p>Use this for a kitchen tablet or shared household screen.</p>
              <button type="button" className="primary-action" onClick={() => void chooseKioskDevice()}>
                Start kiosk mode
              </button>
            </section>
          </div>
        </section>
      )}

      {route === '/member' && (
        <section className="screen">
          <div className="screen-heading">
            <p className="eyebrow">Member mode</p>
            <h1>{selectedMember ? selectedMember.display_name : 'Choose your name'}</h1>
          </div>

          {!selectedMember && (
            <div className="button-grid">
              {members.map((member) => (
                <button key={member.id} type="button" onClick={() => void chooseMemberDevice(member.id)}>
                  {member.display_name}
                </button>
              ))}
            </div>
          )}

          {selectedMember && (
            <ChorePicker
              dueChores={dueChores}
              otherChores={otherChores}
              pendingChore={pendingChore}
              memberName={selectedMember.display_name}
              onPick={setPendingChore}
              onCancel={() => {
                setPendingChore(null)
                setCompletionNote('')
              }}
              onConfirm={(chore) => void submitCompletion(selectedMember.id, chore, 'member')}
              submitting={submitting}
              note={completionNote}
              onNoteChange={setCompletionNote}
            />
          )}
        </section>
      )}

      {route === '/kiosk' && (
        <section className="screen kiosk-screen">
          <div className="screen-heading">
            <p className="eyebrow">Kiosk mode</p>
            <h1>{kioskMember ? kioskMember.display_name : 'Who finished a chore?'}</h1>
          </div>

          {!kioskMember && (
            <>
              <KioskStatus today={today} status={status} currentTime={currentTime} />
              <div className="button-grid large">
                {members.map((member) => (
                  <button key={member.id} type="button" onClick={() => setKioskMemberId(member.id)}>
                    {member.display_name}
                  </button>
                ))}
              </div>
            </>
          )}

          {kioskMember && (
            <>
              <button type="button" className="secondary-action" onClick={() => setKioskMemberId(null)}>
                Change person
              </button>
              <ChorePicker
                dueChores={dueChores}
                otherChores={otherChores}
                pendingChore={pendingChore}
                memberName={kioskMember.display_name}
                onPick={setPendingChore}
                onCancel={() => {
                  setPendingChore(null)
                  setCompletionNote('')
                }}
                onConfirm={(chore) => void submitCompletion(kioskMember.id, chore, 'kiosk')}
                submitting={submitting}
                note={completionNote}
                onNoteChange={setCompletionNote}
              />
            </>
          )}
        </section>
      )}

      {route === '/history' && <HistoryView history={history} />}

      {route === '/admin' && (
        <AdminView
          pin={adminPin}
          unlocked={adminUnlocked}
          members={adminMembers}
          chores={adminChores}
          memberDraft={memberDraft}
          choreDraft={choreDraft}
          onPinChange={setAdminPin}
          onUnlock={() => void unlockAdmin()}
          onMemberDraftChange={setMemberDraft}
          onChoreDraftChange={setChoreDraft}
          onSaveMember={() => void saveMember()}
          onSaveChore={() => void saveChore()}
        />
      )}
    </main>
  )
}

function TodayView({
  today,
  chores,
  status,
  notificationsEnabled,
  onEnableNotifications,
  onStart,
}: {
  today: TodayState
  chores: Chore[]
  status: HouseholdStatus
  notificationsEnabled: boolean
  onEnableNotifications: () => void
  onStart: () => void
}) {
  return (
    <section className="screen">
      <div className="screen-heading">
        <p className="eyebrow">Today</p>
        <h1>Household view</h1>
      </div>

      <div className="today-summary">
        <div>
          <strong>{today.due.length}</strong>
          <span>due</span>
        </div>
        <div>
          <strong>{today.overdue.length}</strong>
          <span>overdue</span>
        </div>
        <div>
          <strong>{today.completedToday.length}</strong>
          <span>done today</span>
        </div>
      </div>

      <button type="button" className="primary-action" onClick={onStart}>
        Record a chore
      </button>

      <section className="panel status-panel">
        <h2>This week</h2>
        <div className="status-grid">
          <div>
            <strong>{status.weekly.totalCompleted}</strong>
            <span>chores completed</span>
          </div>
          <div>
            <strong>{status.weekly.mostActive?.member_name ?? 'None yet'}</strong>
            <span>most active helper</span>
          </div>
        </div>
        <div className="suggestion-list">
          {status.suggestions.length === 0 && <p className="empty-state">No reminder suggestions right now.</p>}
          {status.suggestions.map((suggestion) => (
            <p key={suggestion.chore_id}>{suggestion.message}</p>
          ))}
        </div>
        <button type="button" className="secondary-action" onClick={onEnableNotifications}>
          {notificationsEnabled ? 'Browser reminders enabled' : 'Enable browser reminders'}
        </button>
      </section>

      <div className="chores-layout">
        <ReadOnlyChoreSection title="Overdue" chores={today.overdue} emptyText="Nothing overdue." />
        <ReadOnlyChoreSection title="Due today" chores={today.due} emptyText="No due chores right now." />
      </div>

      <section className="panel">
        <h2>Completed today</h2>
        <div className="history-list">
          {today.completedToday.length === 0 && <p className="empty-state">Nothing completed today yet.</p>}
          {today.completedToday.map((completion) => (
            <HistoryItem key={completion.id} completion={completion} />
          ))}
        </div>
      </section>

      <ReadOnlyChoreSection title="All active chores" chores={chores} emptyText="No active chores." />
    </section>
  )
}

function ChorePicker({
  dueChores,
  otherChores,
  pendingChore,
  memberName,
  onPick,
  onCancel,
  onConfirm,
  submitting,
  note,
  onNoteChange,
}: {
  dueChores: Chore[]
  otherChores: Chore[]
  pendingChore: Chore | null
  memberName: string
  onPick: (chore: Chore) => void
  onCancel: () => void
  onConfirm: (chore: Chore) => void
  submitting: boolean
  note: string
  onNoteChange: (note: string) => void
}) {
  if (pendingChore) {
    return (
      <section className="confirm-panel">
        <p>{memberName}</p>
        <h2>{pendingChore.name}</h2>
        <span>{frequencyLabel(pendingChore.frequency_type)}</span>
        <label>
          Note
          <textarea
            placeholder="Optional note"
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
          />
        </label>
        <div className="action-row">
          <button type="button" className="secondary-action" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="primary-action"
            disabled={submitting}
            onClick={() => onConfirm(pendingChore)}
          >
            {submitting ? 'Saving...' : 'Confirm complete'}
          </button>
        </div>
      </section>
    )
  }

  return (
    <div className="chores-layout">
      <ChoreSection title="Due now" chores={dueChores} onPick={onPick} />
      <ChoreSection title="Other chores" chores={otherChores} onPick={onPick} />
    </div>
  )
}

function KioskStatus({
  today,
  status,
  currentTime,
}: {
  today: TodayState
  status: HouseholdStatus
  currentTime: Date
}) {
  return (
    <section className="kiosk-status">
      <div>
        <strong>{formatClock(currentTime)}</strong>
        <span>{today.completedToday.length} done today</span>
      </div>
      <div>
        <strong>{today.due.length}</strong>
        <span>due</span>
      </div>
      <div>
        <strong>{today.overdue.length}</strong>
        <span>overdue</span>
      </div>
      <div>
        <strong>{status.weekly.totalCompleted}</strong>
        <span>this week</span>
      </div>
    </section>
  )
}

function ChoreSection({
  title,
  chores,
  onPick,
}: {
  title: string
  chores: Chore[]
  onPick: (chore: Chore) => void
}) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <div className="chore-list">
        {chores.length === 0 && <p className="empty-state">Nothing here right now.</p>}
        {chores.map((chore) => (
          <button key={chore.id} type="button" className="chore-button" onClick={() => onPick(chore)}>
            <span>{chore.name}</span>
            <small>{choreMeta(chore)}</small>
          </button>
        ))}
      </div>
    </section>
  )
}

function ReadOnlyChoreSection({
  title,
  chores,
  emptyText,
}: {
  title: string
  chores: Chore[]
  emptyText: string
}) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <div className="read-list">
        {chores.length === 0 && <p className="empty-state">{emptyText}</p>}
        {chores.map((chore) => (
          <article key={chore.id} className="read-item">
            <strong>{chore.name}</strong>
            <span>{choreMeta(chore)}</span>
          </article>
        ))}
      </div>
    </section>
  )
}

function HistoryView({ history }: { history: Completion[] }) {
  const grouped = history.reduce<Record<string, Completion[]>>((groups, completion) => {
    const key = new Date(`${completion.completed_at}Z`).toDateString()
    groups[key] = [...(groups[key] ?? []), completion]
    return groups
  }, {})

  return (
    <section className="screen">
      <div className="screen-heading">
        <p className="eyebrow">History</p>
        <h1>What happened lately</h1>
      </div>

      {history.length === 0 && <p className="empty-state">No chores have been completed yet.</p>}
      {Object.entries(grouped).map(([day, completions]) => (
        <section key={day} className="panel">
          <h2>{dayLabel(day)}</h2>
          <div className="history-list">
            {completions.map((completion) => (
              <HistoryItem key={completion.id} completion={completion} />
            ))}
          </div>
        </section>
      ))}
    </section>
  )
}

function HistoryItem({ completion }: { completion: Completion }) {
  return (
    <article className="history-item">
      <div>
        <strong>{completion.member_name}</strong>
        <span>{completion.chore_name}</span>
      </div>
      <div className="history-meta">
        <span>{formatTime(completion.completed_at)}</span>
        <span>{completion.device_label ?? completion.session_mode ?? 'Unknown device'}</span>
      </div>
      {completion.notes && <p className="history-note">{completion.notes}</p>}
    </article>
  )
}

function AdminView({
  pin,
  unlocked,
  members,
  chores,
  memberDraft,
  choreDraft,
  onPinChange,
  onUnlock,
  onMemberDraftChange,
  onChoreDraftChange,
  onSaveMember,
  onSaveChore,
}: {
  pin: string
  unlocked: boolean
  members: Member[]
  chores: Chore[]
  memberDraft: MemberDraft
  choreDraft: ChoreDraft
  onPinChange: (pin: string) => void
  onUnlock: () => void
  onMemberDraftChange: (draft: MemberDraft) => void
  onChoreDraftChange: (draft: ChoreDraft) => void
  onSaveMember: () => void
  onSaveChore: () => void
}) {
  if (!unlocked) {
    return (
      <section className="screen narrow">
        <div className="screen-heading">
          <p className="eyebrow">Parent setup</p>
          <h1>Enter parent PIN</h1>
        </div>
        <section className="panel">
          <label>
            PIN
            <input
              inputMode="numeric"
              maxLength={8}
              type="password"
              value={pin}
              onChange={(event) => onPinChange(event.target.value)}
            />
          </label>
          <button type="button" className="primary-action" onClick={onUnlock}>
            Unlock setup
          </button>
        </section>
      </section>
    )
  }

  return (
    <section className="screen">
      <div className="screen-heading">
        <p className="eyebrow">Parent setup</p>
        <h1>Manage household</h1>
      </div>

      <div className="admin-layout">
        <section className="panel">
          <h2>{memberDraft.id ? 'Edit family member' : 'Add family member'}</h2>
          <label>
            Display name
            <input
              value={memberDraft.display_name}
              onChange={(event) => onMemberDraftChange({ ...memberDraft, display_name: event.target.value })}
            />
          </label>
          <label>
            Type
            <select
              value={memberDraft.member_type}
              onChange={(event) => onMemberDraftChange({ ...memberDraft, member_type: event.target.value as MemberType })}
            >
              <option value="adult">Adult</option>
              <option value="child">Child</option>
            </select>
          </label>
          <label>
            Sort order
            <input
              type="number"
              value={memberDraft.sort_order}
              onChange={(event) => onMemberDraftChange({ ...memberDraft, sort_order: Number(event.target.value) })}
            />
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={memberDraft.active === 1}
              onChange={(event) => onMemberDraftChange({ ...memberDraft, active: event.target.checked ? 1 : 0 })}
            />
            Active
          </label>
          <div className="action-row">
            <button type="button" className="primary-action" onClick={onSaveMember}>
              Save member
            </button>
            <button type="button" className="secondary-action" onClick={() => onMemberDraftChange(emptyMemberDraft)}>
              New
            </button>
          </div>
        </section>

        <section className="panel">
          <h2>{choreDraft.id ? 'Edit chore' : 'Add chore'}</h2>
          <label>
            Chore name
            <input
              value={choreDraft.name}
              onChange={(event) => onChoreDraftChange({ ...choreDraft, name: event.target.value })}
            />
          </label>
          <label>
            Description
            <textarea
              value={choreDraft.description}
              onChange={(event) => onChoreDraftChange({ ...choreDraft, description: event.target.value })}
            />
          </label>
          <label>
            Frequency
            <select
              value={choreDraft.frequency_type}
              onChange={(event) => onChoreDraftChange({ ...choreDraft, frequency_type: event.target.value as FrequencyType })}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="as_needed">As needed</option>
            </select>
          </label>
          <label>
            Assign to
            <select
              value={choreDraft.assigned_member_id}
              onChange={(event) =>
                onChoreDraftChange({
                  ...choreDraft,
                  assigned_member_id: event.target.value === '' ? '' : Number(event.target.value),
                })
              }
            >
              <option value="">Anyone</option>
              {members.filter((member) => member.active === 1).map((member) => (
                <option key={member.id} value={member.id}>
                  {member.display_name}
                </option>
              ))}
            </select>
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={choreDraft.alert_if_overdue === 1}
              onChange={(event) => onChoreDraftChange({ ...choreDraft, alert_if_overdue: event.target.checked ? 1 : 0 })}
            />
            Track overdue
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={choreDraft.needs_reminder === 1}
              onChange={(event) => onChoreDraftChange({ ...choreDraft, needs_reminder: event.target.checked ? 1 : 0 })}
            />
            Needs reminder
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={choreDraft.active === 1}
              onChange={(event) => onChoreDraftChange({ ...choreDraft, active: event.target.checked ? 1 : 0 })}
            />
            Active
          </label>
          <div className="action-row">
            <button type="button" className="primary-action" onClick={onSaveChore}>
              Save chore
            </button>
            <button type="button" className="secondary-action" onClick={() => onChoreDraftChange(emptyChoreDraft)}>
              New
            </button>
          </div>
        </section>
      </div>

      <div className="admin-layout">
        <section className="panel">
          <h2>Family members</h2>
          <div className="read-list">
            {members.map((member) => (
              <article key={member.id} className="read-item">
                <strong>{member.display_name}</strong>
                <span>
                  {member.member_type} · order {member.sort_order} · {member.active ? 'active' : 'inactive'}
                </span>
                <button type="button" onClick={() => onMemberDraftChange({ ...member })}>
                  Edit
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Chores</h2>
          <div className="read-list">
            {chores.map((chore) => (
              <article key={chore.id} className="read-item">
                <strong>{chore.name}</strong>
                <span>
                  {frequencyLabel(chore.frequency_type)} · {chore.active ? 'active' : 'inactive'}
                  {chore.assigned_member_name ? ` · ${chore.assigned_member_name}` : ''}
                  {chore.needs_reminder ? ' · reminder' : ''}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onChoreDraftChange({
                      id: chore.id,
                      name: chore.name,
                      description: chore.description ?? '',
                      frequency_type: chore.frequency_type,
                      assigned_member_id: chore.assigned_member_id ?? '',
                      alert_if_overdue: chore.alert_if_overdue,
                      needs_reminder: chore.needs_reminder,
                      active: chore.active,
                    })
                  }
                >
                  Edit
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}

function choreMeta(chore: Chore) {
  const assigned = chore.assigned_member_name ? ` · assigned to ${chore.assigned_member_name}` : ''
  const lastDone = chore.last_completed_at
    ? ` · last by ${chore.last_completed_by ?? 'someone'} ${relativeDate(chore.last_completed_at)}`
    : ''
  const status = chore.is_overdue ? 'Overdue' : chore.is_due ? 'Due' : 'Current'

  return `${frequencyLabel(chore.frequency_type)} · ${status}${assigned}${lastDone}`
}

function frequencyLabel(frequency: FrequencyType) {
  if (frequency === 'as_needed') return 'As needed'
  return frequency[0].toUpperCase() + frequency.slice(1)
}

function dayLabel(value: string) {
  const date = new Date(value)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'

  return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric' }).format(date)
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(`${value}Z`))
}

function formatClock(value: Date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(value)
}

function relativeDate(value: string) {
  const date = new Date(`${value}Z`)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'today'
  if (date.toDateString() === yesterday.toDateString()) return 'yesterday'

  return `on ${new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)}`
}

export default App
