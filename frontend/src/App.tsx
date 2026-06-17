import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { avatars, defaultAvatarId, getAvatar } from './avatars'
import { bugDefinitions, getBugDefinition } from './bugs'
import { AquariumFriendsView, AquariumView, type AquariumData } from './components/aquarium/AquariumView'
import { BugPhysicsBox, type ActiveBugViewModel } from './components/bugs/BugPhysicsBox'

type MemberType = 'adult' | 'child'
type FrequencyType = 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'monthly' | 'as_needed'
type NoteType = 'note' | 'shopping' | 'reminder'
type AssignmentMode = 'household_anyone' | 'assigned_individual' | 'per_person'

type Member = {
  id: number
  display_name: string
  nickname: string | null
  avatar_id: string | null
  member_type: MemberType
  sort_order: number
  active: 0 | 1
}

type Chore = {
  id: number
  name: string
  description: string | null
  frequency_type: FrequencyType
  assignment_mode: AssignmentMode
  assigned_member_id: number | null
  assigned_member_name?: string | null
  assigned_member_avatar_id?: string | null
  assignment_member_ids?: string | null
  assignment_member_names?: string | null
  assignment_member_avatar_ids?: string | null
  responsible_member_id?: number | null
  responsible_member_name?: string | null
  responsible_member_avatar_id?: string | null
  alert_if_overdue: 0 | 1
  needs_reminder: 0 | 1
  feeds_aquarium: 0 | 1
  active: 0 | 1
  is_due: 0 | 1
  is_overdue: 0 | 1
  last_completed_at: string | null
  last_completed_by: string | null
  last_completed_by_avatar_id?: string | null
}

type Completion = {
  id: number
  member_name: string
  member_avatar_id: string | null
  responsible_member_name: string | null
  responsible_member_avatar_id: string | null
  chore_name: string
  completed_at: string
  session_mode: 'member' | 'kiosk' | 'admin' | null
  device_label: string | null
  notes: string | null
}

type EarnedBug = {
  id: number
  family_member_id: number
  bug_id: string
  chore_id: number
  completion_id: number
  earned_at: string
  expires_at: string
  removed_at?: string | null
  removed_reason?: string | null
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

type HouseholdNote = {
  id: number
  note_type: NoteType
  text: string
  active: 0 | 1
  updated_at: string
}

type MemberDraft = {
  id: number | null
  display_name: string
  nickname: string
  avatar_id: string
  member_type: MemberType
  sort_order: number
  active: 0 | 1
}

type ChoreDraft = {
  id: number | null
  name: string
  description: string
  frequency_type: FrequencyType
  assignment_mode: AssignmentMode
  assignment_member_ids: number[]
  assigned_member_id: number | ''
  alert_if_overdue: 0 | 1
  needs_reminder: 0 | 1
  feeds_aquarium: 0 | 1
  active: 0 | 1
}

type NoteDraft = {
  id: number | null
  note_type: NoteType
  text: string
  active: 0 | 1
}

type AquariumConfigDraft = {
  food_reserve: number
  starting_food_reserve: number
  max_food_reserve: number
  daily_food_consumption: number
  creature_unlock_interval: number
  egg_incubation_minutes: number
  growth_days: number
}

type LoadState = 'idle' | 'loading' | 'ready' | 'error'
type HistoryRange = 'today' | '7d' | '30d'

const memberKey = 'family-chores.member-id'
const sessionKey = 'family-chores.session'
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? ''
const idleRedirectMs = 3 * 60 * 1000

const routes = ['/today', '/display', '/aquarium', '/aquarium-friends', '/choose-mode', '/member', '/kiosk', '/history', '/bug-box', '/admin'] as const

function currentTimestamp() {
  return Date.now()
}

function markIdleActivity(lastActivityRef: { current: number }, setIdleRemainingMs: (value: number) => void) {
  lastActivityRef.current = currentTimestamp()
  setIdleRemainingMs(idleRedirectMs)
}

const emptyMemberDraft: MemberDraft = {
  id: null,
  display_name: '',
  nickname: '',
  avatar_id: defaultAvatarId,
  member_type: 'child',
  sort_order: 10,
  active: 1,
}

const emptyChoreDraft: ChoreDraft = {
  id: null,
  name: '',
  description: '',
  frequency_type: 'daily',
  assignment_mode: 'household_anyone',
  assignment_member_ids: [],
  assigned_member_id: '',
  alert_if_overdue: 0,
  needs_reminder: 0,
  feeds_aquarium: 1,
  active: 1,
}

const emptyNoteDraft: NoteDraft = {
  id: null,
  note_type: 'note',
  text: '',
  active: 1,
}

const defaultAquariumConfigDraft: AquariumConfigDraft = {
  food_reserve: 14,
  starting_food_reserve: 14,
  max_food_reserve: 30,
  daily_food_consumption: 4,
  creature_unlock_interval: 25,
  egg_incubation_minutes: 60,
  growth_days: 7,
}

function isKnownRoute(pathname: string) {
  return routes.includes(pathname as (typeof routes)[number])
}

function displayFamilyMemberPublic(member: Pick<Member, 'display_name' | 'nickname'>) {
  return member.nickname?.trim() || member.display_name
}

function displayNicknameForAdmin(nickname: string | null | undefined) {
  if (!nickname?.trim()) return ''
  return nickname.trim().length > 20 ? `${nickname.trim().slice(0, 20)}…` : nickname.trim()
}

function displayFamilyMemberForSetup(member: Pick<Member, 'display_name' | 'nickname'>) {
  const nickname = displayNicknameForAdmin(member.nickname)
  return nickname ? `${member.display_name} (${nickname})` : member.display_name
}

function AvatarIcon({
  avatarId,
  name,
  size = 'medium',
}: {
  avatarId: string | null | undefined
  name: string
  size?: 'small' | 'medium' | 'large'
}) {
  const avatar = getAvatar(avatarId)

  return (
    <img
      className={`avatar-icon avatar-icon-${size}`}
      src={avatar.file}
      alt={`${name} avatar`}
      width={size === 'large' ? 72 : size === 'small' ? 36 : 48}
      height={size === 'large' ? 72 : size === 'small' ? 36 : 48}
    />
  )
}

function AvatarPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (avatarId: string) => void
}) {
  return (
    <fieldset className="avatar-picker">
      <legend>Avatar</legend>
      <div className="avatar-picker-grid">
        {avatars.map((avatar) => {
          const selected = avatar.id === value
          return (
            <button
              key={avatar.id}
              type="button"
              className={`avatar-choice${selected ? ' selected' : ''}`}
              aria-pressed={selected}
              aria-label={`${avatar.displayName} avatar`}
              onClick={() => onChange(avatar.id)}
            >
              <img src={avatar.file} alt="" aria-hidden="true" width={56} height={56} />
              <span>{avatar.displayName}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function BugIcon({
  bugId,
  size = 'medium',
}: {
  bugId: string | null | undefined
  size?: 'small' | 'medium' | 'large'
}) {
  const bug = getBugDefinition(bugId)

  return (
    <img
      className={`bug-icon bug-icon-${size}`}
      src={bug.file}
      alt={`${bug.displayName} bug`}
      width={size === 'large' ? 96 : size === 'small' ? 40 : 64}
      height={size === 'large' ? 96 : size === 'small' ? 40 : 64}
    />
  )
}

function ActivityDayBadge({ value }: { value: string }) {
  const day = activityDayLabel(value)

  return <span className={`activity-day-badge ${day.kind}`}>{day.label}</span>
}

async function api<T>(path: string, options?: RequestInit, attempts = 2): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(`${apiBaseUrl}${path}`, {
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
    isKnownRoute(window.location.pathname) ? window.location.pathname : '/aquarium',
  )
  const routeRef = useRef(route)
  const lastActivityRef = useRef(0)
  const [members, setMembers] = useState<Member[]>([])
  const [chores, setChores] = useState<Chore[]>([])
  const [memberChores, setMemberChores] = useState<Chore[]>([])
  const [kioskChores, setKioskChores] = useState<Chore[]>([])
  const [memberBugs, setMemberBugs] = useState<EarnedBug[]>([])
  const [bugBoxMemberId, setBugBoxMemberId] = useState<number | null>(null)
  const [history, setHistory] = useState<Completion[]>([])
  const [notes, setNotes] = useState<HouseholdNote[]>([])
  const [aquarium, setAquarium] = useState<AquariumData | null>(null)
  const [today, setToday] = useState<TodayState>({ due: [], overdue: [], completedToday: [] })
  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [error, setError] = useState('')
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(() => {
    const storedSession = getStoredSession()
    if (storedSession?.mode === 'kiosk') {
      localStorage.removeItem(memberKey)
      return null
    }

    const stored = Number(localStorage.getItem(memberKey))
    return Number.isInteger(stored) && stored > 0 ? stored : null
  })
  const [session, setSession] = useState<SessionState | null>(() => getStoredSession())
  const [pendingChore, setPendingChore] = useState<Chore | null>(null)
  const [kioskMemberId, setKioskMemberId] = useState<number | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [successBugId, setSuccessBugId] = useState<string | null>(null)
  const [adminPin, setAdminPin] = useState('')
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [panicPinEntry, setPanicPinEntry] = useState('')
  const [panicModalOpen, setPanicModalOpen] = useState(false)
  const [panicError, setPanicError] = useState('')
  const [panicSubmitting, setPanicSubmitting] = useState(false)
  const [textModeSubmitting, setTextModeSubmitting] = useState(false)
  const [adminMembers, setAdminMembers] = useState<Member[]>([])
  const [adminChores, setAdminChores] = useState<Chore[]>([])
  const [adminNotes, setAdminNotes] = useState<HouseholdNote[]>([])
  const [memberDraft, setMemberDraft] = useState<MemberDraft>(emptyMemberDraft)
  const [choreDraft, setChoreDraft] = useState<ChoreDraft>(emptyChoreDraft)
  const [noteDraft, setNoteDraft] = useState<NoteDraft>(emptyNoteDraft)
  const [aquariumConfigDraft, setAquariumConfigDraft] = useState<AquariumConfigDraft>(defaultAquariumConfigDraft)
  const [submitting, setSubmitting] = useState(false)
  const [completionNote, setCompletionNote] = useState('')
  const [notificationsEnabled] = useState(
    () => 'Notification' in window && Notification.permission === 'granted',
  )
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const [idleRemainingMs, setIdleRemainingMs] = useState(idleRedirectMs)

  const selectedMember = useMemo(
    () => members.find((member) => member.id === selectedMemberId) ?? null,
    [members, selectedMemberId],
  )
  const kioskMember = useMemo(
    () => members.find((member) => member.id === kioskMemberId) ?? null,
    [members, kioskMemberId],
  )
  const isMemberBugBoxLocked = Boolean(selectedMemberId) && session?.mode !== 'kiosk'
  const activeBugBoxMemberId = isMemberBugBoxLocked ? selectedMemberId : bugBoxMemberId
  const canSwitchBugBoxMember = !isMemberBugBoxLocked
  const bugBoxMember = useMemo(
    () => members.find((member) => member.id === activeBugBoxMemberId) ?? null,
    [activeBugBoxMemberId, members],
  )
  const memberDueChores = sortChoresForHousehold(memberChores.filter((chore) => chore.is_due === 1))
  const memberOtherChores = sortChoresForHousehold(memberChores.filter((chore) => chore.is_due !== 1))
  const kioskDueChores = sortChoresForHousehold(kioskChores.filter((chore) => chore.is_due === 1))
  const kioskOtherChores = sortChoresForHousehold(kioskChores.filter((chore) => chore.is_due !== 1))
  const deviceViewLabel = session?.mode === 'kiosk' ? 'Kiosk view' : selectedMemberId ? 'My view' : 'Login'
  const householdSessionLabel = session?.mode === 'kiosk' ? 'Kiosk' : selectedMember ? displayFamilyMemberPublic(selectedMember) : ''
  const canAccessSetup = selectedMember?.member_type === 'adult' && session?.mode !== 'kiosk'

  function resetIdleTimer() {
    markIdleActivity(lastActivityRef, setIdleRemainingMs)
  }

  function navigate(nextRoute: string) {
    resetIdleTimer()
    window.history.pushState({}, '', nextRoute)
    setRoute(nextRoute)
    setError('')
    setPendingChore(null)
    setSuccessMessage('')
    setSuccessBugId(null)
  }

  async function refreshHousehold(silent = false) {
    if (!silent) {
      setLoadState('loading')
    }
    setError('')

    try {
      const [memberData, choreData, todayData, noteData, historyData, aquariumData] = await Promise.all([
        api<{ ok: boolean; members: Member[] }>('/api/members'),
        api<{ ok: boolean; chores: Chore[] }>('/api/chores'),
        api<TodayState & { ok: boolean }>('/api/today'),
        api<{ ok: boolean; notes: HouseholdNote[] }>('/api/notes'),
        api<{ ok: boolean; completions: Completion[] }>('/api/completions/recent'),
        api<{ ok: boolean; aquarium: AquariumData }>('/api/aquarium'),
      ])

      setMembers(memberData.members)
      setChores(choreData.chores)
      setToday({
        due: todayData.due,
        overdue: todayData.overdue,
        completedToday: todayData.completedToday,
      })
      setNotes(noteData.notes)
      setHistory(historyData.completions)
      setAquarium(aquariumData.aquarium)

      const activeMemberIds = new Set(memberData.members.map((member) => member.id))

      if (selectedMemberId && activeMemberIds.has(selectedMemberId)) {
        setMemberChores(await loadChoresForMember(selectedMemberId))
      } else if (selectedMemberId) {
        localStorage.removeItem(memberKey)
        setSelectedMemberId(null)
        setMemberChores([])
        setSession((current) => {
          if (current?.mode !== 'member') return current
          localStorage.removeItem(sessionKey)
          return null
        })
      }

      if (kioskMemberId && activeMemberIds.has(kioskMemberId)) {
        setKioskChores(await loadChoresForMember(kioskMemberId))
      } else if (kioskMemberId) {
        setKioskMemberId(null)
        setKioskChores([])
      }

      setLoadState('ready')
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Could not load app data.')
      setLoadState('error')
    }
  }

  async function loadAdminData(pin = adminPin) {
    const [memberData, choreData, noteData, aquariumConfigData] = await Promise.all([
      api<{ ok: boolean; members: Member[] }>('/api/admin/members', {
        headers: { 'X-Parent-Pin': pin },
      }),
      api<{ ok: boolean; chores: Chore[] }>('/api/admin/chores', {
        headers: { 'X-Parent-Pin': pin },
      }),
      api<{ ok: boolean; notes: HouseholdNote[] }>('/api/admin/notes', {
        headers: { 'X-Parent-Pin': pin },
      }),
      api<{ ok: boolean; config: AquariumConfigDraft }>('/api/admin/aquarium-config', {
        headers: { 'X-Parent-Pin': pin },
      }),
    ])

    setAdminMembers(memberData.members)
    setAdminChores(choreData.chores)
    setAdminNotes(noteData.notes)
    setAquariumConfigDraft(toAquariumConfigDraft(aquariumConfigData.config))
  }

  async function loadChoresForMember(memberId: number) {
    const data = await api<{ ok: boolean; chores: Chore[] }>(`/api/members/${memberId}/chores`)
    return data.chores
  }

  async function loadBugsForMember(memberId: number) {
    const data = await api<{ ok: boolean; bugs: EarnedBug[] }>(`/api/members/${memberId}/bugs`)
    return data.bugs
  }

  async function removeEarnedBug(earnedBugId: string) {
    await api<{ ok: boolean; bug: EarnedBug }>(`/api/bugs/${earnedBugId}/remove`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'overclicked' }),
    })

    setMemberBugs((current) => current.filter((bug) => String(bug.id) !== earnedBugId))
  }

  useEffect(() => {
    void Promise.resolve().then(() => refreshHousehold())
    const clock = window.setInterval(() => setCurrentTime(new Date()), 30_000)
    const refresh = window.setInterval(() => {
      void refreshHousehold(true)
    }, 20_000)

    const onPopState = () => {
      const nextRoute = isKnownRoute(window.location.pathname) ? window.location.pathname : '/aquarium'
      setRoute(nextRoute)
      resetIdleTimer()
    }

    window.addEventListener('popstate', onPopState)
    return () => {
      window.clearInterval(clock)
      window.clearInterval(refresh)
      window.removeEventListener('popstate', onPopState)
    }
  }, [])

  useEffect(() => {
    routeRef.current = route
  }, [route])

  useEffect(() => {
    const activityEvents: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart', 'scroll']
    const onActivity = () => resetIdleTimer()
    resetIdleTimer()

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, onActivity, { passive: true })
    }

    const countdown = window.setInterval(() => {
      const remaining = Math.max(0, idleRedirectMs - (currentTimestamp() - lastActivityRef.current))
      setIdleRemainingMs(remaining)

      if (remaining > 0) {
        return
      }

      if (routeRef.current === '/aquarium') {
        markIdleActivity(lastActivityRef, setIdleRemainingMs)
        return
      }

      markIdleActivity(lastActivityRef, setIdleRemainingMs)
      window.history.pushState({}, '', '/aquarium')
      setRoute('/aquarium')
      setError('')
      setPendingChore(null)
      setSuccessMessage('')
      setSuccessBugId(null)
    }, 1_000)

    return () => {
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, onActivity)
      }
      window.clearInterval(countdown)
    }
  }, [])

  useEffect(() => {
    if (!selectedMemberId) {
      return
    }

    void loadChoresForMember(selectedMemberId)
      .then(setMemberChores)
      .catch((currentError) =>
        setError(currentError instanceof Error ? currentError.message : 'Could not load member chores.'),
      )
  }, [selectedMemberId])

  useEffect(() => {
    if (!kioskMemberId) {
      return
    }

    void loadChoresForMember(kioskMemberId)
      .then(setKioskChores)
      .catch((currentError) =>
        setError(currentError instanceof Error ? currentError.message : 'Could not load kiosk chores.'),
      )
  }, [kioskMemberId])

  useEffect(() => {
    if (!activeBugBoxMemberId) {
      void Promise.resolve().then(() => setMemberBugs([]))
      return
    }

    void loadBugsForMember(activeBugBoxMemberId)
      .then(setMemberBugs)
      .catch((currentError) =>
        setError(currentError instanceof Error ? currentError.message : 'Could not load Bug Box.'),
      )
  }, [activeBugBoxMemberId])

  async function chooseMemberDevice(memberId: number) {
    setError('')

    try {
      const member = members.find((item) => item.id === memberId)
      const data = await api<{ ok: boolean; session: SessionState }>('/api/session/select-member', {
        method: 'POST',
        body: JSON.stringify({
          memberId,
          deviceLabel: member ? `${displayFamilyMemberPublic(member)} Device` : 'Personal Device',
        }),
      })

      localStorage.setItem(memberKey, String(memberId))
      localStorage.setItem(sessionKey, JSON.stringify(data.session))
      setMemberChores([])
      setBugBoxMemberId(null)
      setKioskChores([])
      setKioskMemberId(null)
      setSelectedMemberId(memberId)
      setSession(data.session)
      navigate('/member')
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Could not select this member.')
    }
  }

  function changeMemberDevice() {
    localStorage.removeItem(memberKey)
    if (session?.mode === 'member') {
      localStorage.removeItem(sessionKey)
      setSession(null)
    }
    setSelectedMemberId(null)
    setBugBoxMemberId(null)
    setMemberChores([])
    setPendingChore(null)
    setCompletionNote('')
  }

  async function chooseKioskDevice() {
    setError('')

    try {
      const data = await api<{ ok: boolean; session: SessionState }>('/api/session/kiosk', {
        method: 'POST',
        body: JSON.stringify({ deviceLabel: 'Kitchen Tablet' }),
      })

      localStorage.removeItem(memberKey)
      localStorage.setItem(sessionKey, JSON.stringify(data.session))
      setSelectedMemberId(null)
      setMemberChores([])
      setBugBoxMemberId(null)
      setSession(data.session)
      setKioskMemberId(null)
      navigate('/kiosk')
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Could not start kiosk mode.')
    }
  }

  function logoutKioskMode() {
    localStorage.removeItem(sessionKey)
    setSession(null)
    setKioskMemberId(null)
    setKioskChores([])
    setPendingChore(null)
    setCompletionNote('')
    navigate('/choose-mode')
  }

  async function submitCompletion(memberId: number, chore: Chore, mode: 'member' | 'kiosk') {
    setError('')
    setSubmitting(true)

    try {
      const data = await api<{ ok: boolean; earnedBug?: EarnedBug; aquariumEvent?: { fedMessage: string; state: AquariumData['state']; egg: unknown | null } }>('/api/completions', {
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
      const memberName = member ? displayFamilyMemberPublic(member) : 'Someone'
      const bug = data.earnedBug ? getBugDefinition(data.earnedBug.bug_id) : null
      const completionMessage = data.aquariumEvent
        ? `${memberName} fed the aquarium${bug ? ` and caught a ${bug.displayName}!` : '!'}`
        : `${memberName} completed ${chore.name}${bug ? ` and caught a ${bug.displayName}!` : '!'}`
      setSuccessMessage(completionMessage)
      setSuccessBugId(bug?.id ?? null)
      maybeShowCompletionNotification(memberName, chore.name)
      setPendingChore(null)
      setCompletionNote('')
      await refreshHousehold()
      const refreshedChores = await loadChoresForMember(memberId)
      const refreshedBugs = await loadBugsForMember(memberId)
      setMemberBugs(refreshedBugs)

      if (mode === 'kiosk') {
        setKioskChores(refreshedChores)
        setKioskMemberId(null)
      } else {
        setMemberChores(refreshedChores)
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

  async function deleteMember(member: Member) {
    const memberName = displayFamilyMemberForSetup(member)

    if (!window.confirm(`Delete ${memberName}? Their old history will be kept, but they will leave setup lists and active app screens.`)) {
      return
    }

    setError('')

    try {
      await api(`/api/admin/members/${member.id}`, {
        method: 'DELETE',
        headers: { 'X-Parent-Pin': adminPin },
      })

      if (selectedMemberId === member.id) {
        localStorage.removeItem(memberKey)
        setSelectedMemberId(null)
      }

      setMemberDraft(emptyMemberDraft)
      await Promise.all([loadAdminData(), refreshHousehold()])
      setSuccessMessage(`${memberName} deleted from active family members.`)
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Could not delete family member.')
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
          assigned_member_id: choreDraft.assignment_member_ids[0] ?? null,
        }),
      })
      setChoreDraft(emptyChoreDraft)
      await Promise.all([loadAdminData(), refreshHousehold()])
      setSuccessMessage('Chore saved.')
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Could not save chore.')
    }
  }

  async function deleteChore(chore: Chore) {
    if (!window.confirm(`Delete ${chore.name}? Old completion history will be kept, but this chore will leave setup lists and active app screens.`)) {
      return
    }

    setError('')

    try {
      await api(`/api/admin/chores/${chore.id}`, {
        method: 'DELETE',
        headers: { 'X-Parent-Pin': adminPin },
      })

      setChoreDraft(emptyChoreDraft)
      await Promise.all([loadAdminData(), refreshHousehold()])
      setSuccessMessage(`${chore.name} deleted from chores.`)
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Could not delete chore.')
    }
  }

  async function saveNote() {
    setError('')

    try {
      const method = noteDraft.id ? 'PUT' : 'POST'
      const path = noteDraft.id ? `/api/admin/notes/${noteDraft.id}` : '/api/admin/notes'
      await api(path, {
        method,
        headers: { 'X-Parent-Pin': adminPin },
        body: JSON.stringify(noteDraft),
      })
      setNoteDraft(emptyNoteDraft)
      await Promise.all([loadAdminData(), refreshHousehold()])
      setSuccessMessage('Household note saved.')
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Could not save household note.')
    }
  }

  async function saveAquariumConfig() {
    setError('')

    try {
      const data = await api<{ ok: boolean; config: AquariumConfigDraft }>('/api/admin/aquarium-config', {
        method: 'PUT',
        headers: { 'X-Parent-Pin': adminPin },
        body: JSON.stringify(aquariumConfigDraft),
      })
      setAquariumConfigDraft(toAquariumConfigDraft(data.config))
      await Promise.all([loadAdminData(), refreshHousehold()])
      setSuccessMessage('Aquarium tuning saved.')
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Could not save aquarium tuning.')
    }
  }

  async function submitPanic(pin: string, isActive: boolean) {
    setPanicError('')
    setPanicSubmitting(true)
    try {
      await api('/api/admin/aquarium-panic', {
        method: isActive ? 'DELETE' : 'POST',
        headers: { 'X-Parent-Pin': pin },
      })
      setPanicModalOpen(false)
      setPanicPinEntry('')
      await refreshHousehold()
    } catch {
      setPanicError('Wrong PIN or something went wrong.')
    } finally {
      setPanicSubmitting(false)
    }
  }

  async function textCurrentAquariumMode() {
    setError('')
    setSuccessMessage('')
    setTextModeSubmitting(true)

    try {
      const data = await api<{ ok: boolean; result: { sent: boolean; skipped: boolean } }>('/api/fish-notifications/current-mode', {
        method: 'POST',
      })
      setSuccessMessage(data.result.skipped ? 'Fish text was just sent.' : 'Fish text sent.')
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Could not send fish text.')
    } finally {
      setTextModeSubmitting(false)
    }
  }

  async function exportHouseholdData() {
    setError('')

    try {
      const data = await api<Record<string, unknown>>('/api/admin/export', {
        headers: { 'X-Parent-Pin': adminPin },
      })
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `family-chores-export-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
      setSuccessMessage('Household export downloaded.')
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : 'Could not export household data.')
    }
  }

  function maybeShowCompletionNotification(memberName: string, choreName: string) {
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Chore completed', {
        body: `${memberName} completed ${choreName}.`,
      })
    }
  }

  function openDeviceView() {
    if (session?.mode === 'kiosk') {
      navigate('/kiosk')
      return
    }

    if (selectedMemberId) {
      navigate('/member')
      return
    }

    navigate('/choose-mode')
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <button type="button" className="brand-button" onClick={() => navigate('/aquarium')}>
          Family Chores
        </button>
        <nav aria-label="Main navigation">
          <button type="button" onClick={() => navigate('/aquarium')}>Aquarium</button>
          <button type="button" onClick={() => navigate('/aquarium-friends')}>Friends</button>
          <button type="button" onClick={() => navigate('/display')}>Household</button>
          <button type="button" onClick={openDeviceView}>{deviceViewLabel}</button>
          <button type="button" onClick={() => navigate('/bug-box')}>Bug Box</button>
          {canAccessSetup && <button type="button" onClick={() => navigate('/admin')}>Setup</button>}
        </nav>
        <span className="idle-countdown" aria-live="polite">
          Aquarium in {formatIdleCountdown(idleRemainingMs)}
        </span>
      </header>

      {loadState === 'loading' && <p className="notice">Loading household data...</p>}
      {error && <p className="notice error">{error}</p>}
      {successMessage && (
        <p className="notice success reward-notice">
          {successBugId && <BugIcon bugId={successBugId} size="small" />}
          <span>{successMessage}</span>
        </p>
      )}

      {route === '/aquarium' && (
        <AquariumView
          aquarium={aquarium}
          onRecord={() => navigate('/choose-mode')}
          onFriends={() => navigate('/aquarium-friends')}
          onPanic={() => { setPanicPinEntry(''); setPanicError(''); setPanicModalOpen(true) }}
          onTextMode={() => void textCurrentAquariumMode()}
          textModeSubmitting={textModeSubmitting}
        />
      )}

      {route === '/aquarium-friends' && <AquariumFriendsView aquarium={aquarium} />}

      {(route === '/display' || route === '/today') && (
        <HouseholdDashboard
          today={today}
          members={members}
          notes={notes}
          history={history}
          currentTime={currentTime}
          sessionLabel={householdSessionLabel}
          selectedMember={selectedMember}
          memberChores={memberChores}
          memberBugs={selectedMember ? memberBugs : []}
          onRecord={() => navigate('/choose-mode')}
          onHistory={() => navigate('/history')}
          onBugBox={() => navigate('/bug-box')}
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
                  <button key={member.id} type="button" className="member-choice" onClick={() => void chooseMemberDevice(member.id)}>
                    <AvatarIcon avatarId={member.avatar_id} name={displayFamilyMemberPublic(member)} size="medium" />
                    <span>{displayFamilyMemberPublic(member)}</span>
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
            <div className="member-heading-row">
              <h1 className="avatar-heading">
                {selectedMember && (
                  <AvatarIcon avatarId={selectedMember.avatar_id} name={displayFamilyMemberPublic(selectedMember)} size="large" />
                )}
                <span>{selectedMember ? displayFamilyMemberPublic(selectedMember) : 'Choose your name'}</span>
              </h1>
              {selectedMember && (
                <button type="button" className="secondary-action member-change-action" onClick={changeMemberDevice}>
                  Change member
                </button>
              )}
            </div>
          </div>

          {!selectedMember && (
            <div className="button-grid">
              {members.map((member) => (
                <button key={member.id} type="button" className="member-choice" onClick={() => void chooseMemberDevice(member.id)}>
                  <AvatarIcon avatarId={member.avatar_id} name={displayFamilyMemberPublic(member)} size="medium" />
                  <span>{displayFamilyMemberPublic(member)}</span>
                </button>
              ))}
            </div>
          )}

          {selectedMember && (
            <ChorePicker
              dueChores={memberDueChores}
              otherChores={memberOtherChores}
              pendingChore={pendingChore}
              memberName={displayFamilyMemberPublic(selectedMember)}
              memberAvatarId={selectedMember.avatar_id}
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
            <h1 className="avatar-heading">
              {kioskMember && (
                <AvatarIcon avatarId={kioskMember.avatar_id} name={displayFamilyMemberPublic(kioskMember)} size="large" />
              )}
              <span>{kioskMember ? displayFamilyMemberPublic(kioskMember) : 'Who finished a chore?'}</span>
            </h1>
          </div>

          {!kioskMember && (
            <>
              <div className="button-grid large">
                {members.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      setKioskChores([])
                      setKioskMemberId(member.id)
                    }}
                  >
                    <AvatarIcon avatarId={member.avatar_id} name={displayFamilyMemberPublic(member)} size="medium" />
                    <span>{displayFamilyMemberPublic(member)}</span>
                  </button>
                ))}
              </div>
              <button type="button" className="secondary-action kiosk-logout-action" onClick={logoutKioskMode}>
                Log out of kiosk mode
              </button>
            </>
          )}

          {kioskMember && (
            <>
              <button type="button" className="secondary-action" onClick={() => setKioskMemberId(null)}>
                Change person
              </button>
              <ChorePicker
                dueChores={kioskDueChores}
                otherChores={kioskOtherChores}
                pendingChore={pendingChore}
                memberName={displayFamilyMemberPublic(kioskMember)}
                memberAvatarId={kioskMember.avatar_id}
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

      {route === '/history' && <HistoryView history={history} members={members} chores={chores} />}

      {route === '/bug-box' && (
        <BugBoxView
          members={members}
          selectedMember={bugBoxMember}
          bugs={memberBugs}
          selectedMemberId={activeBugBoxMemberId}
          canSwitchMembers={canSwitchBugBoxMember}
          onSelectMember={setBugBoxMemberId}
          onExplodeBug={removeEarnedBug}
        />
      )}

      {route === '/admin' && canAccessSetup && (
        <AdminView
          pin={adminPin}
          unlocked={adminUnlocked}
          members={adminMembers}
          chores={adminChores}
          memberDraft={memberDraft}
          choreDraft={choreDraft}
          noteDraft={noteDraft}
          aquariumConfigDraft={aquariumConfigDraft}
          notes={adminNotes}
          onPinChange={setAdminPin}
          onUnlock={() => void unlockAdmin()}
          onMemberDraftChange={setMemberDraft}
          onChoreDraftChange={setChoreDraft}
          onNoteDraftChange={setNoteDraft}
          onAquariumConfigDraftChange={setAquariumConfigDraft}
          onSaveMember={() => void saveMember()}
          onDeleteMember={(member) => void deleteMember(member)}
          onSaveChore={() => void saveChore()}
          onDeleteChore={(chore) => void deleteChore(chore)}
          onSaveNote={() => void saveNote()}
          onSaveAquariumConfig={() => void saveAquariumConfig()}
          onExport={() => void exportHouseholdData()}
        />
      )}

      {route === '/admin' && !canAccessSetup && (
        <section className="screen">
          <div className="screen-heading">
            <p className="eyebrow">Setup</p>
            <h1>Parent setup</h1>
            <p className="empty-state">Log in as an adult to open setup.</p>
          </div>
        </section>
      )}

      {panicModalOpen && (
        <div className="modal-overlay" onClick={() => setPanicModalOpen(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <h2>{aquarium?.state.panic_mode ? 'Clear panic mode' : '🚨 Panic mode'}</h2>
            <p>
              {aquarium?.state.panic_mode
                ? 'Enter your parent PIN to cancel panic mode early.'
                : 'Chores weren\'t done right. Enter your parent PIN to make the fish sad until 3 real chores are completed.'}
            </p>
            <input
              type="password"
              inputMode="numeric"
              placeholder="Parent PIN"
              value={panicPinEntry}
              className="pin-input"
              autoFocus
              onChange={(e) => { setPanicPinEntry(e.target.value); setPanicError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter' && panicPinEntry) void submitPanic(panicPinEntry, !!aquarium?.state.panic_mode) }}
            />
            {panicError && <p className="notice error">{panicError}</p>}
            <div className="modal-actions">
              <button
                type="button"
                className="primary-action"
                disabled={!panicPinEntry || panicSubmitting}
                onClick={() => void submitPanic(panicPinEntry, !!aquarium?.state.panic_mode)}
              >
                {panicSubmitting ? 'Saving…' : aquarium?.state.panic_mode ? 'Clear panic' : 'Activate panic'}
              </button>
              <button type="button" className="secondary-action" onClick={() => setPanicModalOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function HouseholdDashboard({
  today,
  members,
  notes,
  history,
  currentTime,
  sessionLabel,
  selectedMember,
  memberChores,
  memberBugs,
  onRecord,
  onHistory,
  onBugBox,
}: {
  today: TodayState
  members: Member[]
  notes: HouseholdNote[]
  history: Completion[]
  currentTime: Date
  sessionLabel: string
  selectedMember: Member | null
  memberChores: Chore[]
  memberBugs: EarnedBug[]
  onRecord: () => void
  onHistory: () => void
  onBugBox: () => void
}) {
  const attentionChores = getNeedsAttention(today)
  const rhythmMessage = getHouseholdRhythmMessage(today)
  const helpers = getTodayContributions(members, today.completedToday)
  const selectedMemberName = selectedMember ? displayFamilyMemberPublic(selectedMember) : null
  const selectedMemberDone = memberChores.filter((chore) => chore.last_completed_at && relativeDate(chore.last_completed_at) === 'today')
  const selectedMemberOpen = sortChoresForHousehold(memberChores.filter((chore) => chore.is_due === 1 || chore.is_overdue === 1))
  const recentActivity = getRecentActivity(history, 6)

  return (
    <section className="screen household-dashboard">
      <section className="household-header">
        <div>
          <p className="eyebrow">{formatCompactDateTime(currentTime)}</p>
          <h1>Household view</h1>
          {sessionLabel && <p>{sessionLabel}</p>}
        </div>
        <strong>
          {today.overdue.length} overdue • {today.due.length} due today • {today.completedToday.length} completed today
        </strong>
      </section>

      <div className="action-row">
        <button type="button" className="primary-action" onClick={onRecord}>
          Record a chore
        </button>
        <button type="button" className="secondary-action" onClick={onHistory}>
          View history
        </button>
      </div>

      <section className="panel attention-panel">
        <h2>Needs attention</h2>
        <div className="attention-list">
          {attentionChores.length === 0 && <p className="empty-state">Nothing needs attention right now.</p>}
          {attentionChores.map((chore) => (
            <article key={choreKey(chore)} className={`attention-item${chore.is_overdue ? ' urgent' : ''}`}>
              <span className="avatar-line">
                <AvatarIcon avatarId={choreAvatarId(chore)} name={choreAvatarName(chore)} size="small" />
                <strong>{chore.name}</strong>
              </span>
              <span>
                {chore.is_overdue ? 'Overdue' : 'Due today'} • {frequencyLabel(chore.frequency_type)}
                {chore.responsible_member_name ? ` • ${chore.responsible_member_name}` : ' • household'}
              </span>
              {chore.last_completed_at && (
                <small>Last completed by {chore.last_completed_by ?? 'someone'} {relativeDate(chore.last_completed_at)}</small>
              )}
            </article>
          ))}
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <h2>Recent activity</h2>
          <div className="activity-feed">
            {recentActivity.length === 0 && <p className="empty-state">No recent activity.</p>}
            {recentActivity.map((completion) => (
              <article key={completion.id}>
                <span className="avatar-line">
                  <AvatarIcon avatarId={completion.member_avatar_id} name={completion.member_name} size="small" />
                  <strong>{completion.member_name}</strong>
                </span>
                <span>completed {completion.chore_name}</span>
                <small>
                  {formatTime(completion.completed_at)}
                  <ActivityDayBadge value={completion.completed_at} />
                </small>
              </article>
            ))}
          </div>
          <button type="button" className="secondary-action compact-action" onClick={onHistory}>
            Full history
          </button>
        </section>

        <section className="panel">
          <h2>Today’s helpers</h2>
          <div className="helper-list">
            {helpers.map((helper) => (
              <span key={helper.id} className="helper-row">
                <span className="avatar-line">
                  <AvatarIcon avatarId={helper.avatarId} name={helper.name} size="small" />
                  <strong>{helper.name}</strong>
                </span>
                <strong>{helper.count}</strong>
              </span>
            ))}
          </div>
        </section>
      </div>

      <section className="panel bug-teaser">
        <div>
          <h2>Bug Box</h2>
          <p className="empty-state">
            {selectedMember
              ? `${selectedMemberName} has ${memberBugs.length} bug${memberBugs.length === 1 ? '' : 's'} hanging out.`
              : 'Complete chores to catch temporary bugs.'}
          </p>
        </div>
        <div className="bug-teaser-strip">
          {memberBugs.slice(0, 5).map((bug) => (
            <BugIcon key={bug.id} bugId={bug.bug_id} size="small" />
          ))}
          {memberBugs.length === 0 && bugDefinitions.slice(0, 3).map((bug) => <BugIcon key={bug.id} bugId={bug.id} size="small" />)}
        </div>
        <button type="button" className="secondary-action compact-action" onClick={onBugBox}>
          Open Bug Box
        </button>
      </section>

      {selectedMember && (
        <section className="panel">
          <h2>Your chores</h2>
          <div className="your-chore-list">
            {selectedMemberOpen.length === 0 && selectedMemberDone.length === 0 && (
              <p className="empty-state">{selectedMemberName} has no chores showing right now.</p>
            )}
            {selectedMemberOpen.map((chore) => (
              <article key={choreKey(chore)} className="your-chore-row attention">
                <strong>{chore.is_overdue ? '!' : '•'} {chore.name}</strong>
                <span>{chore.is_overdue ? 'Overdue' : 'Still due'} • {frequencyLabel(chore.frequency_type)}</span>
              </article>
            ))}
            {selectedMemberDone.map((chore) => (
              <article key={choreKey(chore)} className="your-chore-row done">
                <strong>✓ {chore.name}</strong>
                <span>Done today</span>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="panel">
        <h2>Household rhythm</h2>
        <div className="rhythm-list">
          <p>{rhythmMessage}</p>
        </div>
      </section>

      <section className="panel">
        <h2>Household notes</h2>
        <div className="read-list compact-list">
          {notes.length === 0 && <p className="empty-state">No active notes.</p>}
          {notes.slice(0, 3).map((note) => (
            <article key={note.id} className="read-item">
              <strong>{noteTypeLabel(note.note_type)}</strong>
              <span>{note.text}</span>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

function ChorePicker({
  dueChores,
  otherChores,
  pendingChore,
  memberName,
  memberAvatarId,
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
  memberAvatarId: string | null
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
        <p className="avatar-line">
          <AvatarIcon avatarId={memberAvatarId} name={memberName} size="small" />
          <span>{memberName}</span>
        </p>
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
          <button key={choreKey(chore)} type="button" className="chore-button" onClick={() => onPick(chore)}>
            <span className="avatar-line">
              <AvatarIcon avatarId={choreAvatarId(chore)} name={choreAvatarName(chore)} size="small" />
              <span>{chore.name}</span>
            </span>
            <small>{choreMeta(chore)}</small>
          </button>
        ))}
      </div>
    </section>
  )
}

function HistoryView({
  history,
  members,
  chores,
}: {
  history: Completion[]
  members: Member[]
  chores: Chore[]
}) {
  const [range, setRange] = useState<HistoryRange>('7d')
  const [memberFilter, setMemberFilter] = useState('all')
  const [choreFilter, setChoreFilter] = useState('all')
  const memberOptions = members.map((member) => displayFamilyMemberPublic(member))
  const choreOptions = [...new Set(chores.map((chore) => chore.name).concat(history.map((completion) => completion.chore_name)))].sort()
  const filteredHistory = filterCompletions(history, range, memberFilter, choreFilter)
  const memberCounts = getCompletionCountsByMember(filteredHistory, members)
  const choreCounts = getCompletionCountsByChore(filteredHistory)
  const mostActive = memberCounts.find((member) => member.count > 0)
  const mostRepeated = choreCounts[0]
  const grouped = filteredHistory.reduce<Record<string, Completion[]>>((groups, completion) => {
    const key = new Date(`${completion.completed_at}Z`).toDateString()
    groups[key] = [...(groups[key] ?? []), completion]
    return groups
  }, {})

  return (
    <section className="screen">
      <div className="screen-heading">
        <p className="eyebrow">History</p>
        <h1>Activity and trends</h1>
      </div>

      <section className="panel history-filters">
        <div className="segmented-control" aria-label="Time range">
          {([
            ['today', 'Today'],
            ['7d', '7 days'],
            ['30d', '30 days'],
          ] as Array<[HistoryRange, string]>).map(([value, label]) => (
            <button key={value} type="button" className={range === value ? 'selected' : ''} onClick={() => setRange(value)}>
              {label}
            </button>
          ))}
        </div>
        <label>
          Member
          <select value={memberFilter} onChange={(event) => setMemberFilter(event.target.value)}>
            <option value="all">All</option>
            {memberOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>
        <label>
          Chore
          <select value={choreFilter} onChange={(event) => setChoreFilter(event.target.value)}>
            <option value="all">All</option>
            {choreOptions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>
      </section>

      <div className="summary-grid">
        <section className="panel metric-card">
          <span>Total completed</span>
          <strong>{filteredHistory.length}</strong>
        </section>
        <section className="panel metric-card">
          <span>Most active helper</span>
          <strong>{mostActive ? mostActive.name : 'None yet'}</strong>
        </section>
        <section className="panel metric-card">
          <span>Most repeated chore</span>
          <strong>{mostRepeated ? mostRepeated.name : 'None yet'}</strong>
        </section>
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <h2>Contribution breakdown</h2>
          <div className="helper-list">
            {memberCounts.map((member) => (
              <span key={member.id} className="helper-row">
                <span className="avatar-line">
                  <AvatarIcon avatarId={member.avatarId} name={member.name} size="small" />
                  <strong>{member.name}</strong>
                </span>
                <strong>{member.count}</strong>
              </span>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Most completed chores</h2>
          <div className="helper-list">
            {choreCounts.length === 0 && <p className="empty-state">No chores in this range.</p>}
            {choreCounts.slice(0, 8).map((chore) => (
              <span key={chore.name} className="helper-row">
                <strong>{chore.name}</strong>
                <strong>{chore.count}</strong>
              </span>
            ))}
          </div>
        </section>
      </div>

      {filteredHistory.length === 0 && <p className="empty-state">No chores match these filters.</p>}
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

function BugBoxView({
  members,
  selectedMember,
  selectedMemberId,
  canSwitchMembers,
  bugs,
  onSelectMember,
  onExplodeBug,
}: {
  members: Member[]
  selectedMember: Member | null
  selectedMemberId: number | null
  canSwitchMembers: boolean
  bugs: EarnedBug[]
  onSelectMember: (memberId: number | null) => void
  onExplodeBug: (earnedBugId: string) => Promise<void> | void
}) {
  const visibleBugs = useMemo(() => bugs.slice(0, 30), [bugs])
  const memberName = selectedMember ? displayFamilyMemberPublic(selectedMember) : null
  const bugViewModels: ActiveBugViewModel[] = useMemo(
    () =>
      visibleBugs.map((bug) => {
        const definition = getBugDefinition(bug.bug_id)
        return {
          earnedBugId: String(bug.id),
          bugId: bug.bug_id,
          displayName: definition.displayName,
          file: definition.file,
          earnedAt: bug.earned_at,
          expiresAt: bug.expires_at,
        }
      }),
    [visibleBugs],
  )

  return (
    <section className="screen bug-box-screen">
      <div className="screen-heading">
        <h1>{memberName ? `${memberName}’s Bug Box` : 'Whose Bug Box?'}</h1>
      </div>

      {canSwitchMembers && !selectedMemberId && (
        <div className="button-grid">
          {members.filter((member) => member.active === 1).map((member) => (
            <button key={member.id} type="button" className="member-choice" onClick={() => onSelectMember(member.id)}>
              <AvatarIcon avatarId={member.avatar_id} name={displayFamilyMemberPublic(member)} size="medium" />
              <span>{displayFamilyMemberPublic(member)}</span>
            </button>
          ))}
        </div>
      )}

      {selectedMemberId && (
        <>
          {bugs.length > 30 && <p className="empty-state">Showing newest 30 bugs in physics mode.</p>}

          <BugPhysicsBox bugs={bugViewModels} onExplodeBug={onExplodeBug} />

          <div className="bug-box-toolbar">
            <div className="bug-box-details">
              <p className="empty-state">Bugs stay for 3 days after each chore.</p>
              <strong>{bugs.length} bug{bugs.length === 1 ? '' : 's'} hanging out</strong>
            </div>
            {canSwitchMembers && (
              <button type="button" className="secondary-action compact-action" onClick={() => onSelectMember(null)}>
                Back to bug boxes
              </button>
            )}
          </div>

          {bugs.length > 0 && (
            <div className="bug-summary-list" aria-label="Active bug list">
              {visibleBugs.map((bug) => {
                const definition = getBugDefinition(bug.bug_id)
                return (
                  <span key={bug.id}>
                    {definition.displayName} · {bugTimeLeft(bug.expires_at)}
                  </span>
                )
              })}
            </div>
          )}
        </>
      )}
    </section>
  )
}

function HistoryItem({ completion }: { completion: Completion }) {
  return (
    <article className="history-item">
      <div>
        <span className="avatar-line">
          <AvatarIcon avatarId={completion.member_avatar_id} name={completion.member_name} size="small" />
          <strong>{completion.member_name}</strong>
        </span>
        <span>{completion.chore_name}</span>
        {completion.responsible_member_name && completion.responsible_member_name !== completion.member_name && (
          <small className="avatar-line">
            <AvatarIcon
              avatarId={completion.responsible_member_avatar_id}
              name={completion.responsible_member_name}
              size="small"
            />
            <span>For {completion.responsible_member_name}</span>
          </small>
        )}
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
  noteDraft,
  aquariumConfigDraft,
  notes,
  onPinChange,
  onUnlock,
  onMemberDraftChange,
  onChoreDraftChange,
  onNoteDraftChange,
  onAquariumConfigDraftChange,
  onSaveMember,
  onDeleteMember,
  onSaveChore,
  onDeleteChore,
  onSaveNote,
  onSaveAquariumConfig,
  onExport,
}: {
  pin: string
  unlocked: boolean
  members: Member[]
  chores: Chore[]
  memberDraft: MemberDraft
  choreDraft: ChoreDraft
  noteDraft: NoteDraft
  aquariumConfigDraft: AquariumConfigDraft
  notes: HouseholdNote[]
  onPinChange: (pin: string) => void
  onUnlock: () => void
  onMemberDraftChange: (draft: MemberDraft) => void
  onChoreDraftChange: (draft: ChoreDraft) => void
  onNoteDraftChange: (draft: NoteDraft) => void
  onAquariumConfigDraftChange: (draft: AquariumConfigDraft) => void
  onSaveMember: () => void
  onDeleteMember: (member: Member) => void
  onSaveChore: () => void
  onDeleteChore: (chore: Chore) => void
  onSaveNote: () => void
  onSaveAquariumConfig: () => void
  onExport: () => void
}) {
  const [section, setSection] = useState<'menu' | 'members' | 'chores' | 'notes' | 'aquarium' | 'backup'>('menu')
  const activeMembers = members.filter((member) => member.active === 1)

  function updateChoreAssignmentMode(assignment_mode: AssignmentMode) {
    onChoreDraftChange({
      ...choreDraft,
      assignment_mode,
      assignment_member_ids: assignment_mode === 'household_anyone' ? [] : choreDraft.assignment_member_ids.slice(0, 1),
      assigned_member_id: assignment_mode === 'assigned_individual' ? choreDraft.assignment_member_ids[0] ?? '' : '',
    })
  }

  function updateChoreAssignmentMember(memberId: number, checked: boolean) {
    const nextIds = checked
      ? [...new Set([...choreDraft.assignment_member_ids, memberId])]
      : choreDraft.assignment_member_ids.filter((id) => id !== memberId)

    onChoreDraftChange({
      ...choreDraft,
      assignment_member_ids: nextIds,
      assigned_member_id: choreDraft.assignment_mode === 'assigned_individual' ? nextIds[0] ?? '' : '',
    })
  }

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

  if (section === 'menu') {
    return (
      <section className="screen">
        <div className="screen-heading">
          <p className="eyebrow">Parent setup</p>
          <h1>What do you want to manage?</h1>
        </div>
        <div className="setup-tile-grid">
          <button type="button" onClick={() => setSection('members')}>
            <strong>Family members</strong>
            <span>Add, edit, delete, reorder, and activate people.</span>
          </button>
          <button type="button" onClick={() => setSection('chores')}>
            <strong>Chores</strong>
            <span>Create chores, assign them, and set frequency.</span>
          </button>
          <button type="button" onClick={() => setSection('backup')}>
            <strong>Backup</strong>
            <span>Download a lightweight household export.</span>
          </button>
          <button type="button" onClick={() => setSection('notes')}>
            <strong>Notes</strong>
            <span>Manage shared notes, reminders, and shopping items.</span>
          </button>
          <button type="button" onClick={() => setSection('aquarium')}>
            <strong>Aquarium</strong>
            <span>Tune food, eggs, milestones, and growth timing.</span>
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="screen">
      <div className="screen-heading">
        <p className="eyebrow">Parent setup</p>
        <h1>{setupSectionTitle(section)}</h1>
      </div>
      <button type="button" className="secondary-action setup-back" onClick={() => setSection('menu')}>
        Back to setup
      </button>

      {section === 'members' && (
        <>
          <section className="panel setup-form-panel">
            <h2>{memberDraft.id ? 'Edit family member' : 'Add family member'}</h2>
            <label>
              Real name
              <input
                value={memberDraft.display_name}
                onChange={(event) => onMemberDraftChange({ ...memberDraft, display_name: event.target.value })}
              />
            </label>
            <label>
              Nickname
              <input
                value={memberDraft.nickname}
                onChange={(event) => onMemberDraftChange({ ...memberDraft, nickname: event.target.value })}
              />
            </label>
            <AvatarPicker
              value={memberDraft.avatar_id || defaultAvatarId}
              onChange={(avatarId) => onMemberDraftChange({ ...memberDraft, avatar_id: avatarId })}
            />
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
            <h2>Family members</h2>
            <div className="member-grid">
              <div className="member-grid-header" aria-hidden="true">
                <span>Name</span>
                <span>Type</span>
                <span>Sort order</span>
                <span>Active</span>
                <span>Actions</span>
              </div>
              {members.map((member) => (
                <article key={member.id} className="member-grid-row">
                  <span className="avatar-line">
                    <AvatarIcon avatarId={member.avatar_id} name={displayFamilyMemberForSetup(member)} size="small" />
                    <strong>{displayFamilyMemberForSetup(member)}</strong>
                  </span>
                  <span>{member.member_type}</span>
                  <span>{member.sort_order}</span>
                  <span>{member.active ? 'Yes' : 'No'}</span>
                  <div className="member-grid-actions">
                    <button
                      type="button"
                      onClick={() =>
                        onMemberDraftChange({
                          ...member,
                          nickname: member.nickname ?? '',
                          avatar_id: member.avatar_id ?? defaultAvatarId,
                        })
                      }
                    >
                      Edit
                    </button>
                    {member.active === 1 && (
                      <button type="button" className="danger-action" onClick={() => onDeleteMember(member)}>
                        Delete
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {section === 'chores' && (
        <>
          <section className="panel setup-form-panel">
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
                <option value="weekdays">Weekdays (M-F)</option>
                <option value="weekends">Weekends (Sa-Su)</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="as_needed">As needed</option>
              </select>
            </label>
            <label>
              Who needs to do this?
              <select
                value={choreDraft.assignment_mode}
                onChange={(event) => updateChoreAssignmentMode(event.target.value as AssignmentMode)}
              >
                <option value="household_anyone">Anyone in the family can do it once</option>
                <option value="assigned_individual">One specific person</option>
                <option value="per_person">Each selected person must do it individually</option>
              </select>
            </label>
            {choreDraft.assignment_mode === 'assigned_individual' && (
              <label>
                Assigned person
                <select
                  value={choreDraft.assignment_member_ids[0] ?? ''}
                  onChange={(event) => {
                    const memberId = event.target.value === '' ? null : Number(event.target.value)
                    onChoreDraftChange({
                      ...choreDraft,
                      assignment_member_ids: memberId ? [memberId] : [],
                      assigned_member_id: memberId ?? '',
                    })
                  }}
                >
                  <option value="">Choose a person</option>
                  {activeMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {displayFamilyMemberForSetup(member)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {choreDraft.assignment_mode === 'per_person' && (
              <fieldset className="check-group">
                <legend>Assigned people</legend>
                {activeMembers.map((member) => (
                  <label key={member.id} className="check-row">
                    <input
                      type="checkbox"
                      checked={choreDraft.assignment_member_ids.includes(member.id)}
                      onChange={(event) => updateChoreAssignmentMember(member.id, event.target.checked)}
                    />
                    {displayFamilyMemberForSetup(member)}
                  </label>
                ))}
              </fieldset>
            )}
            {choreDraft.assignment_mode === 'household_anyone' && (
              <p className="empty-state">This chore appears for every active family member and is done once per period.</p>
            )}
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
                checked={choreDraft.feeds_aquarium === 1}
                onChange={(event) => onChoreDraftChange({ ...choreDraft, feeds_aquarium: event.target.checked ? 1 : 0 })}
              />
              Feeds fish
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

          <section className="panel">
            <h2>Chores</h2>
            <div className="chore-grid">
              <div className="chore-grid-header" aria-hidden="true">
                <span>Name</span>
                <span>Description</span>
                <span>Frequency</span>
                <span>Assignment</span>
                <span>Overdue</span>
                <span>Reminder</span>
                <span>Feeds fish</span>
                <span>Active</span>
                <span>Actions</span>
              </div>
              {chores.map((chore) => (
                <article key={chore.id} className="chore-grid-row">
                  <strong>{chore.name}</strong>
                  <span>{chore.description || 'None'}</span>
                  <span>{frequencyLabel(chore.frequency_type)}</span>
                  <span>{assignmentLabel(chore, members)}</span>
                  <span>{chore.alert_if_overdue ? 'Yes' : 'No'}</span>
                  <span>{chore.needs_reminder ? 'Yes' : 'No'}</span>
                  <span>{chore.feeds_aquarium ? 'Yes' : 'No'}</span>
                  <span>{chore.active ? 'Yes' : 'No'}</span>
                  <div className="chore-grid-actions">
                    <button
                      type="button"
                      onClick={() =>
                        onChoreDraftChange({
                          id: chore.id,
                          name: chore.name,
                          description: chore.description ?? '',
                          frequency_type: chore.frequency_type,
                          assignment_mode: chore.assignment_mode ?? 'household_anyone',
                          assignment_member_ids: parseAssignmentMemberIds(chore),
                          assigned_member_id: parseAssignmentMemberIds(chore)[0] ?? '',
                          alert_if_overdue: chore.alert_if_overdue,
                          needs_reminder: chore.needs_reminder,
                          feeds_aquarium: chore.feeds_aquarium ?? 1,
                          active: chore.active,
                        })
                      }
                    >
                      Edit
                    </button>
                    <button type="button" className="danger-action" onClick={() => onDeleteChore(chore)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {section === 'backup' && (
        <section className="panel">
          <h2>Backup</h2>
          <p>Download a lightweight JSON export for household records.</p>
          <button type="button" className="secondary-action" onClick={onExport}>
            Export household data
          </button>
        </section>
      )}

      {section === 'notes' && (
        <>
      <section className="panel">
        <h2>{noteDraft.id ? 'Edit household note' : 'Add household note'}</h2>
        <label>
          Type
          <select
            value={noteDraft.note_type}
            onChange={(event) => onNoteDraftChange({ ...noteDraft, note_type: event.target.value as NoteType })}
          >
            <option value="note">Note</option>
            <option value="shopping">Shopping</option>
            <option value="reminder">Reminder</option>
          </select>
        </label>
        <label>
          Text
          <textarea
            value={noteDraft.text}
            onChange={(event) => onNoteDraftChange({ ...noteDraft, text: event.target.value })}
          />
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={noteDraft.active === 1}
            onChange={(event) => onNoteDraftChange({ ...noteDraft, active: event.target.checked ? 1 : 0 })}
          />
          Active
        </label>
        <div className="action-row">
          <button type="button" className="primary-action" onClick={onSaveNote}>
            Save note
          </button>
          <button type="button" className="secondary-action" onClick={() => onNoteDraftChange(emptyNoteDraft)}>
            New
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Household notes</h2>
        <div className="read-list">
          {notes.length === 0 && <p className="empty-state">No notes yet.</p>}
          {notes.map((note) => (
            <article key={note.id} className="read-item">
              <strong>{note.text}</strong>
              <span>
                {noteTypeLabel(note.note_type)} · {note.active ? 'active' : 'inactive'}
              </span>
              <button type="button" onClick={() => onNoteDraftChange({ ...note })}>
                Edit
              </button>
            </article>
          ))}
        </div>
      </section>
        </>
      )}

      {section === 'aquarium' && (
        <section className="panel setup-form-panel">
          <h2>Aquarium tuning</h2>
          <div className="setup-number-grid">
            <label>
              Current food reserve
              <input
                type="number"
                min={0}
                value={aquariumConfigDraft.food_reserve}
                onChange={(event) =>
                  onAquariumConfigDraftChange({ ...aquariumConfigDraft, food_reserve: Number(event.target.value) })
                }
              />
            </label>
            <label>
              Starting food reserve
              <input
                type="number"
                min={0}
                value={aquariumConfigDraft.starting_food_reserve}
                onChange={(event) =>
                  onAquariumConfigDraftChange({ ...aquariumConfigDraft, starting_food_reserve: Number(event.target.value) })
                }
              />
            </label>
            <label>
              Maximum food reserve
              <input
                type="number"
                min={1}
                value={aquariumConfigDraft.max_food_reserve}
                onChange={(event) =>
                  onAquariumConfigDraftChange({ ...aquariumConfigDraft, max_food_reserve: Number(event.target.value) })
                }
              />
            </label>
            <label>
              Food consumed per day
              <input
                type="number"
                min={0}
                value={aquariumConfigDraft.daily_food_consumption}
                onChange={(event) =>
                  onAquariumConfigDraftChange({ ...aquariumConfigDraft, daily_food_consumption: Number(event.target.value) })
                }
              />
            </label>
            <label>
              Chores required for egg
              <input
                type="number"
                min={1}
                value={aquariumConfigDraft.creature_unlock_interval}
                onChange={(event) =>
                  onAquariumConfigDraftChange({ ...aquariumConfigDraft, creature_unlock_interval: Number(event.target.value) })
                }
              />
            </label>
            <label>
              Egg incubation minutes
              <input
                type="number"
                min={0}
                value={aquariumConfigDraft.egg_incubation_minutes}
                onChange={(event) =>
                  onAquariumConfigDraftChange({ ...aquariumConfigDraft, egg_incubation_minutes: Number(event.target.value) })
                }
              />
            </label>
            <label>
              Baby growth days
              <input
                type="number"
                min={0}
                value={aquariumConfigDraft.growth_days}
                onChange={(event) =>
                  onAquariumConfigDraftChange({ ...aquariumConfigDraft, growth_days: Number(event.target.value) })
                }
              />
            </label>
          </div>
          <button type="button" className="primary-action" onClick={onSaveAquariumConfig}>
            Save aquarium tuning
          </button>
        </section>
      )}
    </section>
  )
}

function getNeedsAttention(today: TodayState) {
  return sortChoresForHousehold([...today.overdue, ...today.due])
}

function getRecentActivity(history: Completion[], limit: number) {
  return [...history]
    .sort((left, right) => new Date(`${right.completed_at}Z`).getTime() - new Date(`${left.completed_at}Z`).getTime())
    .slice(0, limit)
}

function getTodayContributions(members: Member[], completedToday: Completion[]) {
  const counts = completedToday.reduce<Record<string, number>>((totals, completion) => {
    totals[completion.member_name] = (totals[completion.member_name] ?? 0) + 1
    return totals
  }, {})

  return members
    .filter((member) => member.active === 1)
    .map((member) => ({
      id: member.id,
      name: displayFamilyMemberPublic(member),
      avatarId: member.avatar_id,
      count: counts[displayFamilyMemberPublic(member)] ?? 0,
    }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
}

function getHouseholdRhythmMessage(today: TodayState) {
  if (today.overdue.length > 0) {
    return `${today.overdue.length} chore${today.overdue.length === 1 ? '' : 's'} need attention.`
  }

  if (today.completedToday.length >= 10) return 'Great teamwork today.'
  if (today.completedToday.length > 0) return 'Chores are getting done.'
  return 'No chores completed yet today.'
}

function filterCompletions(history: Completion[], range: HistoryRange, memberName: string, choreName: string) {
  return history
    .filter((completion) => isCompletionInRange(completion, range))
    .filter((completion) => memberName === 'all' || completion.member_name === memberName)
    .filter((completion) => choreName === 'all' || completion.chore_name === choreName)
    .sort((left, right) => new Date(`${right.completed_at}Z`).getTime() - new Date(`${left.completed_at}Z`).getTime())
}

function isCompletionInRange(completion: Completion, range: HistoryRange) {
  const completedAt = new Date(`${completion.completed_at}Z`)
  const now = new Date()

  if (range === 'today') {
    return completedAt.toDateString() === now.toDateString()
  }

  const days = range === '7d' ? 7 : 30
  const start = new Date(now)
  start.setDate(now.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)
  return completedAt >= start
}

function getCompletionCountsByMember(history: Completion[], members: Member[]) {
  const counts = history.reduce<Record<string, number>>((totals, completion) => {
    totals[completion.member_name] = (totals[completion.member_name] ?? 0) + 1
    return totals
  }, {})

  return members
    .filter((member) => member.active === 1)
    .map((member) => ({
      id: member.id,
      name: displayFamilyMemberPublic(member),
      avatarId: member.avatar_id,
      count: counts[displayFamilyMemberPublic(member)] ?? 0,
    }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
}

function getCompletionCountsByChore(history: Completion[]) {
  const counts = history.reduce<Record<string, number>>((totals, completion) => {
    totals[completion.chore_name] = (totals[completion.chore_name] ?? 0) + 1
    return totals
  }, {})

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
}

function choreMeta(chore: Chore) {
  const assigned = chore.responsible_member_name
    ? ` · for ${chore.responsible_member_name}`
    : chore.assignment_mode === 'household_anyone'
      ? ' · household'
      : chore.assigned_member_name
        ? ` · assigned to ${chore.assigned_member_name}`
        : ''
  const lastDone = chore.last_completed_at
    ? ` · last by ${chore.last_completed_by ?? 'someone'} ${relativeDate(chore.last_completed_at)}`
    : ''
  const status = chore.is_overdue ? 'Overdue' : chore.is_due ? 'Due' : 'Current'

  return `${frequencyLabel(chore.frequency_type)} · ${status}${assigned}${lastDone}`
}

function choreAvatarId(chore: Chore) {
  return chore.responsible_member_avatar_id ?? chore.assigned_member_avatar_id ?? chore.last_completed_by_avatar_id ?? null
}

function choreAvatarName(chore: Chore) {
  return chore.responsible_member_name ?? chore.assigned_member_name ?? chore.last_completed_by ?? 'Household'
}

function choreKey(chore: Chore) {
  return `${chore.id}-${chore.responsible_member_id ?? 'household'}`
}

function parseAssignmentMemberIds(chore: Chore) {
  if (chore.assignment_member_ids) {
    return chore.assignment_member_ids
      .split(',')
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0)
  }

  return chore.assigned_member_id ? [chore.assigned_member_id] : []
}

function assignmentLabel(chore: Chore, members: Member[]) {
  const assignedMembers = parseAssignmentMemberIds(chore)
    .map((id) => members.find((member) => member.id === id))
    .filter((member): member is Member => Boolean(member))
    .map(displayFamilyMemberForSetup)

  if (chore.assignment_mode === 'household_anyone') return 'Anyone once'
  if (chore.assignment_mode === 'assigned_individual') {
    return assignedMembers[0] || chore.assigned_member_name || 'One person'
  }
  return assignedMembers.length > 0 ? assignedMembers.join(', ') : chore.assignment_member_names || 'Selected people'
}

function sortChoresForHousehold(items: Chore[]) {
  return [...items].sort((left, right) => chorePriority(left) - chorePriority(right) || left.name.localeCompare(right.name))
}

function chorePriority(chore: Chore) {
  let priority = 0
  if (chore.is_overdue) priority -= 100
  if (chore.is_due) priority -= 50
  if (chore.needs_reminder) priority -= 10
  if (!chore.last_completed_at) priority -= 5
  if (chore.last_completed_at && relativeDate(chore.last_completed_at) === 'today') priority += 50
  return priority
}

function frequencyLabel(frequency: FrequencyType) {
  if (frequency === 'as_needed') return 'As needed'
  if (frequency === 'weekdays') return 'Weekdays'
  if (frequency === 'weekends') return 'Weekends'
  return frequency[0].toUpperCase() + frequency.slice(1)
}

function setupSectionTitle(section: 'menu' | 'members' | 'chores' | 'notes' | 'aquarium' | 'backup') {
  if (section === 'members') return 'Manage family members'
  if (section === 'chores') return 'Manage chores'
  if (section === 'notes') return 'Manage notes'
  if (section === 'aquarium') return 'Tune aquarium'
  if (section === 'backup') return 'Backup'
  return 'What do you want to manage?'
}

function toAquariumConfigDraft(config: AquariumConfigDraft): AquariumConfigDraft {
  return {
    food_reserve: Number(config.food_reserve ?? defaultAquariumConfigDraft.food_reserve),
    starting_food_reserve: Number(config.starting_food_reserve ?? defaultAquariumConfigDraft.starting_food_reserve),
    max_food_reserve: Number(config.max_food_reserve ?? defaultAquariumConfigDraft.max_food_reserve),
    daily_food_consumption: Number(config.daily_food_consumption ?? defaultAquariumConfigDraft.daily_food_consumption),
    creature_unlock_interval: Number(config.creature_unlock_interval ?? defaultAquariumConfigDraft.creature_unlock_interval),
    egg_incubation_minutes: Number(config.egg_incubation_minutes ?? defaultAquariumConfigDraft.egg_incubation_minutes),
    growth_days: Number(config.growth_days ?? defaultAquariumConfigDraft.growth_days),
  }
}

function noteTypeLabel(type: NoteType) {
  if (type === 'shopping') return 'Shopping'
  if (type === 'reminder') return 'Reminder'
  return 'Note'
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

function activityDayLabel(value: string) {
  const date = new Date(`${value}Z`)
  const today = startOfLocalDay(new Date())
  const activityDay = startOfLocalDay(date)
  const diffDays = Math.round((today.getTime() - activityDay.getTime()) / 86_400_000)

  if (diffDays === 0) return { label: 'Today', kind: 'today' }
  if (diffDays === 1) return { label: 'Yesterday', kind: 'yesterday' }

  return {
    label: new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(date),
    kind: 'weekday',
  }
}

function startOfLocalDay(value: Date) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

function formatCompactDateTime(value: Date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(value)
}

function formatIdleCountdown(valueMs: number) {
  const totalSeconds = Math.max(0, Math.ceil(valueMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function bugTimeLeft(expiresAt: string) {
  const remainingMs = new Date(`${expiresAt}Z`).getTime() - Date.now()
  if (remainingMs <= 0) return 'expires today'

  const remainingDays = Math.ceil(remainingMs / 86_400_000)
  if (remainingDays <= 1) return 'expires tomorrow'
  return `${remainingDays} days left`
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
