import './App.css'

function App() {
  return (
    <main className="app-shell">
      <section className="intro">
        <p className="eyebrow">Phase 1 foundation</p>
        <h1>Family Chores</h1>
        <p>
          A small household chore tracker for phones and a shared kiosk. The
          first phase sets up the app shell, Worker API skeleton, and database
          migration draft.
        </p>
      </section>

      <section className="status-panel" aria-labelledby="status-heading">
        <h2 id="status-heading">Current scope</h2>
        <ul>
          <li>React + Vite frontend scaffold is running.</li>
          <li>Cloudflare Worker skeleton is ready for local development.</li>
          <li>D1 schema draft is documented for the next phase.</li>
        </ul>
      </section>
    </main>
  )
}

export default App
