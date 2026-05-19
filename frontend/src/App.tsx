import { useEffect, useMemo, useState } from 'react'
import './App.css'

type Member = {
  id: number
  display_name: string
  member_type: 'adult' | 'child'
}

type Chore = {
  id: number
  name: string
  description: string | null
  frequency_type: 'daily' | 'weekly' | 'as_needed'
  is_due: 0 | 1
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
}

type SessionState = {
  id: number
  mode: 'member' | 'kiosk'
  memberId: number | null
  deviceLabel: string
}

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

const memberKey = 'family-chores.member-id'
const sessionKey = 'family-chores.session'

const routes = ['/choose-mode', '/member', '/kiosk', '/history'] as const

function isKnownRoute(pathname: string) {
  return routes.includes(pathname as (typeof routes)[number])
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
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
}

function getStoredSession() {
  const raw = localStorage.getItem(sessionKey)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as SessionState
  } catch {
    localStorage.removeItem(sessionKey)
    return null
  }
}

function App() {
  const [route, setRoute] = useState(() =>
    isKnownRoute(window.location.pathname) ? window.location.pathname : '/choose-mode',
  )
  const [members, setMembers] = useState<Member[]>([])
  const [chores, setChores] = useState<Chore[]>([])
  const [history, setHistory] = useState<Completion[]>([])
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

  const selectedMember = useMemo(
    () => members.find((member) => member.id === selectedMemberId) ?? null,
    [members, selectedMemberId],
  )
  const kioskMember = useMemo(
    () => members.find((member) => member.id === kioskMemberId) ?? null,
    [members, kioskMemberId],
  )

  function navigate(nextRoute: string) {
    window.history.pushState({}, '', nextRoute)
    setRoute(nextRoute)
    setError('')
    setPendingChore(null)
    setSuccessMessage('')
  }

  async function loadCoreData() {
    setLoadState('loading')
    setError('')

    try {
      const [memberData, choreData] = await Promise.all([
        api<{ ok: boolean; members: Member[] }>('/api/members'),
        api<{ ok: boolean; chores: Chore[] }>('/api/chores'),
      ])
      setMembers(memberData.members)
      setChores(choreData.chores)
      setLoadState('ready')
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Could not load app data.')
      setLoadState('error')
    }
  }

  async function loadHistory() {
    try {
      const data = await api<{ ok: boolean; completions: Completion[] }>('/api/completions/recent')
      setHistory(data.completions)
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Could not load history.')
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => loadCoreData())
    void Promise.resolve().then(() => loadHistory())

    const onPopState = () => {
      setRoute(isKnownRoute(window.location.pathname) ? window.location.pathname : '/choose-mode')
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  async function chooseMemberDevice(memberId: number) {
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
  }

  async function chooseKioskDevice() {
    const data = await api<{ ok: boolean; session: SessionState }>('/api/session/kiosk', {
      method: 'POST',
      body: JSON.stringify({ deviceLabel: 'Kitchen Tablet' }),
    })

    localStorage.setItem(sessionKey, JSON.stringify(data.session))
    setSession(data.session)
    setKioskMemberId(null)
    navigate('/kiosk')
  }

  async function submitCompletion(memberId: number, chore: Chore, mode: 'member' | 'kiosk') {
    setError('')
    await api('/api/completions', {
      method: 'POST',
      body: JSON.stringify({
        memberId,
        choreId: chore.id,
        sessionMode: mode,
        deviceSessionId: session?.mode === mode ? session.id : undefined,
        deviceLabel: session?.deviceLabel,
      }),
    })

    const member = members.find((item) => item.id === memberId)
    setSuccessMessage(`${member?.display_name ?? 'Someone'} completed ${chore.name}.`)
    setPendingChore(null)
    await Promise.all([loadCoreData(), loadHistory()])

    if (mode === 'kiosk') {
      setKioskMemberId(null)
    }
  }

  const dueChores = chores.filter((chore) => chore.is_due === 1)
  const otherChores = chores.filter((chore) => chore.is_due !== 1)

  return (
    <main className="app-shell">
      <header className="top-bar">
        <button type="button" className="brand-button" onClick={() => navigate('/choose-mode')}>
          Family Chores
        </button>
        <nav aria-label="Main navigation">
          <button type="button" onClick={() => navigate('/member')}>Member</button>
          <button type="button" onClick={() => navigate('/kiosk')}>Kiosk</button>
          <button type="button" onClick={() => navigate('/history')}>History</button>
        </nav>
      </header>

      {loadState === 'loading' && <p className="notice">Loading household data...</p>}
      {error && <p className="notice error">{error}</p>}
      {successMessage && <p className="notice success">{successMessage}</p>}

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
              chores={chores}
              dueChores={dueChores}
              otherChores={otherChores}
              pendingChore={pendingChore}
              memberName={selectedMember.display_name}
              onPick={setPendingChore}
              onCancel={() => setPendingChore(null)}
              onConfirm={(chore) => void submitCompletion(selectedMember.id, chore, 'member')}
            />
          )}
        </section>
      )}

      {route === '/kiosk' && (
        <section className="screen">
          <div className="screen-heading">
            <p className="eyebrow">Kiosk mode</p>
            <h1>{kioskMember ? kioskMember.display_name : 'Who finished a chore?'}</h1>
          </div>

          {!kioskMember && (
            <div className="button-grid large">
              {members.map((member) => (
                <button key={member.id} type="button" onClick={() => setKioskMemberId(member.id)}>
                  {member.display_name}
                </button>
              ))}
            </div>
          )}

          {kioskMember && (
            <>
              <button type="button" className="secondary-action" onClick={() => setKioskMemberId(null)}>
                Change person
              </button>
              <ChorePicker
                chores={chores}
                dueChores={dueChores}
                otherChores={otherChores}
                pendingChore={pendingChore}
                memberName={kioskMember.display_name}
                onPick={setPendingChore}
                onCancel={() => setPendingChore(null)}
                onConfirm={(chore) => void submitCompletion(kioskMember.id, chore, 'kiosk')}
              />
            </>
          )}
        </section>
      )}

      {route === '/history' && (
        <section className="screen">
          <div className="screen-heading">
            <p className="eyebrow">Recent history</p>
            <h1>What happened lately</h1>
          </div>

          <div className="history-list">
            {history.length === 0 && <p className="empty-state">No chores have been completed yet.</p>}
            {history.map((completion) => (
              <article key={completion.id} className="history-item">
                <div>
                  <strong>{completion.member_name}</strong>
                  <span>{completion.chore_name}</span>
                </div>
                <div className="history-meta">
                  <span>{formatDateTime(completion.completed_at)}</span>
                  <span>{completion.device_label ?? completion.session_mode ?? 'Unknown device'}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
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
}: {
  chores: Chore[]
  dueChores: Chore[]
  otherChores: Chore[]
  pendingChore: Chore | null
  memberName: string
  onPick: (chore: Chore) => void
  onCancel: () => void
  onConfirm: (chore: Chore) => void
}) {
  if (pendingChore) {
    return (
      <section className="confirm-panel">
        <p>{memberName}</p>
        <h2>{pendingChore.name}</h2>
        <span>{frequencyLabel(pendingChore.frequency_type)}</span>
        <div className="action-row">
          <button type="button" className="secondary-action" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="primary-action" onClick={() => onConfirm(pendingChore)}>
            Confirm complete
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
            <small>
              {frequencyLabel(chore.frequency_type)}
              {chore.last_completed_at
                ? ` · last by ${chore.last_completed_by ?? 'someone'} ${relativeDate(chore.last_completed_at)}`
                : ''}
            </small>
          </button>
        ))}
      </div>
    </section>
  )
}

function frequencyLabel(frequency: Chore['frequency_type']) {
  if (frequency === 'as_needed') {
    return 'As needed'
  }

  return frequency[0].toUpperCase() + frequency.slice(1)
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(`${value}Z`))
}

function relativeDate(value: string) {
  const date = new Date(`${value}Z`)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) {
    return 'today'
  }

  return `on ${new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)}`
}

export default App
