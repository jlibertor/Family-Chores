import { useCallback, useEffect, useState } from 'react'
import { ComicScene, type StoryScene } from './ComicView'

type SceneStepperProps = {
  apiBaseUrl: string
  onExit: () => void
}

type AllScenesData = {
  ok: boolean
  series: { slug: string; title: string; total_scenes: number; status?: string } | null
  seriesList: Array<{ slug: string; title: string; total_scenes: number; status: string }>
  scenes: StoryScene[]
}

export function SceneStepper({ apiBaseUrl, onExit }: SceneStepperProps) {
  const [data, setData] = useState<AllScenesData | null>(null)
  const [selectedSlug, setSelectedSlug] = useState('')
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const query = selectedSlug ? `?slug=${encodeURIComponent(selectedSlug)}` : ''
      const response = await fetch(`${apiBaseUrl}/api/story/scenes${query}`)
      const body = (await response.json()) as AllScenesData & { error?: string }
      if (!response.ok) throw new Error(body.error ?? 'Could not load scenes.')
      setData(body)
      setIndex(0)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load scenes.')
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl, selectedSlug])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [load])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!data) return
      if (event.key === 'ArrowRight') setIndex((i) => Math.min(data.scenes.length - 1, i + 1))
      if (event.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [data])

  const scene = data?.scenes[index]
  const count = data?.scenes.length ?? 0

  return (
    <section className="scene-stepper">
      <header className="scene-stepper-bar">
        <button type="button" className="comic-nav-button" onClick={onExit}>
          &lsaquo; Back to Setup
        </button>
        <span className="scene-stepper-title">{data?.series?.title ?? 'Scenes'} — test stepper</span>
        <select
          className="scene-stepper-select"
          value={data?.series?.slug ?? selectedSlug}
          onChange={(event) => setSelectedSlug(event.target.value)}
          aria-label="Preview story"
          disabled={!data?.seriesList.length}
        >
          {(data?.seriesList ?? []).map((series) => (
            <option key={series.slug} value={series.slug}>
              {series.title} ({series.status}, {series.total_scenes} scenes)
            </option>
          ))}
        </select>
        <button type="button" className="comic-nav-button" onClick={() => void load()}>
          Reload
        </button>
      </header>

      {loading && <p className="comic-empty">Loading scenes…</p>}
      {error && <p className="comic-error">{error}</p>}
      {!loading && !error && count === 0 && <p className="comic-empty">No scenes found for this story.</p>}

      {!loading && !error && scene && (
        <>
          <ComicScene scene={scene} />
          <div className="scene-stepper-controls">
            <button
              type="button"
              className="comic-nav-button"
              disabled={index <= 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
            >
              &lsaquo; Prev
            </button>
            <input
              type="range"
              min={0}
              max={Math.max(0, count - 1)}
              value={index}
              onChange={(event) => setIndex(Number(event.target.value))}
              className="scene-stepper-slider"
              aria-label="Jump to scene"
            />
            <button
              type="button"
              className="comic-nav-button"
              disabled={index >= count - 1}
              onClick={() => setIndex((i) => Math.min(count - 1, i + 1))}
            >
              Next &rsaquo;
            </button>
            <span className="scene-stepper-count">
              {index + 1} / {count}
            </span>
          </div>
          <p className="scene-stepper-hint">Tip: use the left and right arrow keys to fly through scenes.</p>
        </>
      )}
    </section>
  )
}
