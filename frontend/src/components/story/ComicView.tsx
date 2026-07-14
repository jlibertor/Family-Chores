import { useCallback, useEffect, useMemo, useState } from 'react'
import { CreatureArt, isAquariumSpecies, type AquariumMood } from '../aquarium/CreatureArt'

const SPEAKER_SPECIES: Record<string, string> = {
  stranger: 'pufferfish',
  gang: 'pufferfish',
}

export type BeatPosition = 'left' | 'center' | 'right'

export type StoryBeat = {
  speaker: string
  name: string
  position: BeatPosition
  expression: AquariumMood
  line: string
}

export type SceneScript = { narration?: string; prop?: string; beats: StoryBeat[] }

export type StoryScene = {
  scene_order: number
  title: string
  setting: string
  script: SceneScript
}

export type StoryData = {
  ok: boolean
  series: { slug: string; title: string; total_scenes: number; status?: string } | null
  releasedCount: number
  accessibleCount: number
  totalScenes: number
  nextReleaseDate: string | null
  canUnlockMore: boolean
  scenes: StoryScene[]
}

type PreviewStoryData = {
  ok: boolean
  series: { slug: string; title: string; total_scenes: number; status?: string } | null
  seriesList: Array<{ slug: string; title: string; total_scenes: number; status: string }>
  scenes: StoryScene[]
}

type ComicViewer = {
  id: number
  display_name: string
  nickname: string | null
  member_type: 'adult' | 'child'
}

type ComicViewProps = {
  apiBaseUrl: string
  members: ComicViewer[]
  previewMode?: boolean
}

const POSITIONS: BeatPosition[] = ['left', 'center', 'right']

function CharacterPortrait({ beat }: { beat: StoryBeat }) {
  const speciesId = isAquariumSpecies(beat.speaker) ? beat.speaker : SPEAKER_SPECIES[beat.speaker]

  return (
    <>
      <div className="comic-portrait">
        {speciesId ? (
          <CreatureArt speciesId={speciesId} mood={beat.expression} />
        ) : (
          <div className="comic-silhouette" aria-hidden="true">?</div>
        )}
      </div>
      <span className="comic-name">{beat.name}</span>
    </>
  )
}

// Presentational: one scene as a static comic panel. Shared by the player and
// the scene-stepper test tool.
export function ComicScene({ scene }: { scene: StoryScene }) {
  const cast = useMemo(() => {
    const slots: Record<BeatPosition, StoryBeat | null> = { left: null, center: null, right: null }
    for (const beat of scene.script.beats) {
      if (!slots[beat.position]) slots[beat.position] = beat
    }
    return slots
  }, [scene])

  return (
    <article className="comic-panel" aria-label={`Scene ${scene.scene_order}: ${scene.title}`}>
      <div className="comic-panel-heading">
        <span className="comic-scene-number">Scene {scene.scene_order}</span>
        <h2>{scene.title}</h2>
        {scene.setting && <span className="comic-setting">{scene.setting}</span>}
      </div>

      {scene.script.prop && <p className="comic-prop">{scene.script.prop}</p>}

      <div className="comic-stage">
        {POSITIONS.map((position) => (
          <div key={position} className={`comic-slot comic-slot-${position}`}>
            {cast[position] ? <CharacterPortrait beat={cast[position] as StoryBeat} /> : null}
          </div>
        ))}
      </div>

      {scene.script.narration && <p className="comic-narration">{scene.script.narration}</p>}

      <div className="comic-dialogue">
        {scene.script.beats.map((beat, index) => (
          <div key={index} className={`comic-bubble comic-bubble-${beat.position}`}>
            <span className="comic-bubble-name">{beat.name}</span>
            <p>{beat.line}</p>
          </div>
        ))}
      </div>
    </article>
  )
}

function formatReleaseDate(value: string | null) {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1)).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
}

export function ComicView({ apiBaseUrl, members, previewMode = false }: ComicViewProps) {
  const children = useMemo(() => members.filter((member) => member.member_type === 'child'), [members])

  const [data, setData] = useState<(StoryData & Partial<PreviewStoryData>) | null>(null)
  const [selectedSlug, setSelectedSlug] = useState('')
  const [sceneIndex, setSceneIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const communalViewerId = children[0]?.id ?? null

  const loadStory = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const query = previewMode
        ? selectedSlug
          ? `?slug=${encodeURIComponent(selectedSlug)}`
          : ''
        : communalViewerId
          ? `?memberId=${communalViewerId}`
          : ''
      const response = await fetch(`${apiBaseUrl}${previewMode ? '/api/story/scenes' : '/api/story'}${query}`)
      const body = (await response.json()) as (StoryData & Partial<PreviewStoryData>) & { error?: string }
      if (!response.ok) throw new Error(body.error ?? 'Could not load the story.')
      setData(body)
      setSceneIndex(previewMode ? 0 : Math.max(0, body.scenes.length - 1))
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load the story.')
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, communalViewerId, previewMode, selectedSlug])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadStory()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadStory])

  const scene = data?.scenes[sceneIndex]

  if (!previewMode && children.length === 0) {
    return (
      <section className="comic-view">
        <p className="comic-empty">Add a family member to start following the story.</p>
      </section>
    )
  }

  return (
    <section className="comic-view">
      <header className="comic-header">
        <div>
          <p className="comic-eyebrow">{previewMode ? 'Storyboard preview' : 'Now showing'}</p>
          <h1 className="comic-title">{data?.series?.title ?? 'Story'}</h1>
        </div>
        {previewMode ? (
          <select
            className="comic-story-select"
            value={data?.series?.slug ?? selectedSlug}
            onChange={(event) => setSelectedSlug(event.target.value)}
            aria-label="Preview story"
            disabled={!data?.seriesList?.length}
          >
            {(data?.seriesList ?? []).map((series) => (
              <option key={series.slug} value={series.slug}>
                {series.title} ({series.status}, {series.total_scenes} scenes)
              </option>
            ))}
          </select>
        ) : null}
      </header>

      {data?.series && (
        <p className="comic-progress">
          {previewMode
            ? `Previewing all ${data.scenes.length} scenes`
            : `Scene ${data.accessibleCount} of ${data.totalScenes} · ${data.releasedCount} released so far`}
        </p>
      )}

      {loading && <p className="comic-empty">Loading the story…</p>}
      {error && <p className="comic-error">{error}</p>}

      {!loading && !error && data && !data.series && (
        <p className="comic-empty">No story is running yet. A parent can start one in Setup.</p>
      )}

      {!loading && !error && data?.series && scene && (
        <>
          <ComicScene scene={scene} />

          <nav className="comic-nav" aria-label="Scene navigation">
            <button
              type="button"
              className="comic-nav-button"
              disabled={sceneIndex <= 0}
              onClick={() => setSceneIndex((index) => Math.max(0, index - 1))}
            >
              &lsaquo; Previous
            </button>
            <span className="comic-nav-count">
              {sceneIndex + 1} / {data.scenes.length}
            </span>
            <button
              type="button"
              className="comic-nav-button"
              disabled={sceneIndex >= data.scenes.length - 1}
              onClick={() => setSceneIndex((index) => Math.min(data.scenes.length - 1, index + 1))}
            >
              Next &rsaquo;
            </button>
          </nav>

          {!previewMode && sceneIndex >= data.scenes.length - 1 && (
            <div className="comic-footer">
              {data.canUnlockMore ? (
                <p className="comic-unlock-hint">
                  The next panel is waiting for the aquarium to brighten.
                </p>
              ) : data.accessibleCount >= data.totalScenes ? (
                <p className="comic-unlock-hint comic-caught-up">You are all caught up. To be continued…</p>
              ) : data.nextReleaseDate ? (
                <p className="comic-unlock-hint">
                  You are caught up. The next scene releases {formatReleaseDate(data.nextReleaseDate)} — do a chore
                  that day to read it.
                </p>
              ) : null}
            </div>
          )}
        </>
      )}
    </section>
  )
}
