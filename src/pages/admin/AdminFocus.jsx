import { useCallback, useEffect, useMemo, useState } from "react"
import {
  createFocusSnapshot,
  fetchActivityEvents,
  fetchFocusCurrent,
  fetchFocusSnapshots,
  fetchProjects,
  syncGitHubActivity,
  updateFocusCurrent
} from "../../services/admin"

const emptyFocusForm = {
  activeProjectId: "",
  weeklyMission: "",
  allowedWork: "",
  forbiddenWork: "",
  attentionItems: "",
  parkedProjects: ""
}

const toLines = (items) => Array.isArray(items) ? items.join("\n") : ""

const fromLines = (value) => {
  return value
    .split("\n")
    .map(item => item.trim())
    .filter(Boolean)
}

const toForm = (focus = {}) => ({
  activeProjectId: focus.activeProjectId || focus.active_project_id || "",
  weeklyMission: focus.weeklyMission || focus.weekly_mission || "",
  allowedWork: toLines(focus.allowedWork || focus.allowed_work),
  forbiddenWork: toLines(focus.forbiddenWork || focus.forbidden_work),
  attentionItems: toLines(focus.attentionItems || focus.attention_items),
  parkedProjects: toLines(focus.parkedProjects || focus.parked_projects)
})

const toPayload = (form) => ({
  activeProjectId: form.activeProjectId || null,
  weeklyMission: form.weeklyMission.trim(),
  allowedWork: fromLines(form.allowedWork),
  forbiddenWork: fromLines(form.forbiddenWork),
  attentionItems: fromLines(form.attentionItems),
  parkedProjects: fromLines(form.parkedProjects)
})

const formatDate = (value) => {
  if (!value) {
    return "Unknown time"
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value))
}

function AdminFocus() {
  const [form, setForm] = useState(emptyFocusForm)
  const [projects, setProjects] = useState([])
  const [snapshots, setSnapshots] = useState([])
  const [activityEvents, setActivityEvents] = useState([])
  const [latestDailySnapshot, setLatestDailySnapshot] = useState(null)
  const [latestWeeklySnapshot, setLatestWeeklySnapshot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [snapshotting, setSnapshotting] = useState(false)
  const [syncingGithub, setSyncingGithub] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [syncError, setSyncError] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const projectOptions = useMemo(() => {
    return projects.map(project => ({
      id: project.id || project._id,
      name: project.name,
      type: project.type || project.project_type || "project"
    }))
  }, [projects])

  const githubActivityEvents = useMemo(() => {
    return activityEvents.filter(event => event.source === "github")
  }, [activityEvents])

  const portfolioActivityEvents = useMemo(() => {
    return activityEvents.filter(event => event.source === "portfolio")
  }, [activityEvents])

  const loadFocus = useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setLoading(true)
    }
    setError("")

    try {
      const [current, snapshotData, projectData, dailySnapshotData, weeklySnapshotData, activityData] = await Promise.all([
        fetchFocusCurrent(),
        fetchFocusSnapshots({ limit: 20 }),
        fetchProjects(),
        fetchFocusSnapshots({ type: "daily", limit: 1 }),
        fetchFocusSnapshots({ type: "weekly", limit: 1 }),
        fetchActivityEvents({ limit: 30 })
      ])

      setForm(toForm(current || {}))
      setSnapshots(Array.isArray(snapshotData) ? snapshotData : [])
      setProjects(Array.isArray(projectData) ? projectData : [])
      setLatestDailySnapshot(Array.isArray(dailySnapshotData) ? dailySnapshotData[0] || null : null)
      setLatestWeeklySnapshot(Array.isArray(weeklySnapshotData) ? weeklySnapshotData[0] || null : null)
      setActivityEvents(Array.isArray(activityData) ? activityData : [])
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || "Failed to load focus dashboard.")
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    loadFocus()
  }, [loadFocus])

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    })
  }

  const refreshSnapshots = async () => {
    const [snapshotData, dailySnapshotData, weeklySnapshotData, activityData] = await Promise.all([
      fetchFocusSnapshots({ limit: 20 }),
      fetchFocusSnapshots({ type: "daily", limit: 1 }),
      fetchFocusSnapshots({ type: "weekly", limit: 1 }),
      fetchActivityEvents({ limit: 30 })
    ])

    setSnapshots(Array.isArray(snapshotData) ? snapshotData : [])
    setLatestDailySnapshot(Array.isArray(dailySnapshotData) ? dailySnapshotData[0] || null : null)
    setLatestWeeklySnapshot(Array.isArray(weeklySnapshotData) ? weeklySnapshotData[0] || null : null)
    setActivityEvents(Array.isArray(activityData) ? activityData : [])
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const updated = await updateFocusCurrent(toPayload(form))
      setForm(toForm(updated))
      setSuccess("Focus saved.")
      await refreshSnapshots()
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || "Failed to save focus.")
    } finally {
      setSaving(false)
    }
  }

  const handleSnapshot = async () => {
    setSnapshotting(true)
    setError("")
    setSuccess("")

    try {
      const snapshot = await createFocusSnapshot({ snapshotType: "manual" })
      setSnapshots(currentSnapshots => [snapshot, ...currentSnapshots].slice(0, 20))
      setSuccess("Manual snapshot created.")
      await refreshSnapshots()
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || "Failed to create manual snapshot.")
    } finally {
      setSnapshotting(false)
    }
  }

  const handleGitHubSync = async () => {
    setSyncingGithub(true)
    setError("")
    setSuccess("")
    setSyncResult(null)
    setSyncError("")

    try {
      const result = await syncGitHubActivity()
      setSyncResult(result)
      setSuccess("GitHub activity sync completed.")
      await loadFocus({ showLoading: false })
    } catch (err) {
      console.error(err)
      setSyncError(err.response?.data?.error || "Failed to sync GitHub activity.")
    } finally {
      setSyncingGithub(false)
    }
  }

  const renderActivityList = (events, emptyCopy) => {
    if (events.length === 0) {
      return (
        <article className="admin-list-card">
          <span className="card-kicker">Empty</span>
          <p>{emptyCopy}</p>
        </article>
      )
    }

    return events.map(event => (
      <article className="admin-list-card" key={event.id}>
        <div className="admin-list-card__header">
          <div>
            <span className="card-kicker">{event.eventType || event.event_type}</span>
            <h2>{event.title}</h2>
          </div>
          <small>{formatDate(event.occurredAt || event.occurred_at)}</small>
        </div>
        {(event.repoFullName || event.repo_full_name) && <p>{event.repoFullName || event.repo_full_name}</p>}
      </article>
    ))
  }

  return (
    <div className="page-stack">
      <section className="command-hero admin-hero">
        <span className="static-chip">GET /focus/current</span>
        <div className="command-hero__copy">
          <h1>Focus</h1>
          <p>Track current focus, allowed work, forbidden work, attention items, and parked projects.</p>
        </div>
      </section>

      {loading && <div className="skeleton" />}

      {!loading && (
        <>
          <section className="bento-grid bento-grid--two" aria-label="Latest automated focus snapshots">
            <article className="bento-card">
              <span className="card-kicker">Latest daily snapshot</span>
              {latestDailySnapshot ? (
                <>
                  <h2>{formatDate(latestDailySnapshot.createdAt)}</h2>
                  <p>{latestDailySnapshot.summary}</p>
                </>
              ) : (
                <p>No daily snapshot yet.</p>
              )}
            </article>
            <article className="bento-card">
              <span className="card-kicker">Latest weekly snapshot</span>
              {latestWeeklySnapshot ? (
                <>
                  <h2>{formatDate(latestWeeklySnapshot.createdAt)}</h2>
                  <p>{latestWeeklySnapshot.summary}</p>
                </>
              ) : (
                <p>No weekly snapshot yet.</p>
              )}
            </article>
          </section>

          <section className="page-stack" aria-label="Observed activity">
            <article className="admin-panel admin-focus-summary">
              <span className="card-kicker">Observed activity</span>
              <h2>Declared focus vs observed activity</h2>
              <p>Declared focus = what you said you planned. Observed activity = what the system detected from GitHub and portfolio actions.</p>
              <div className="admin-actions">
                <button className="button button--secondary" type="button" onClick={handleGitHubSync} disabled={syncingGithub}>
                  {syncingGithub ? "Syncing..." : "Sync GitHub activity now"}
                </button>
              </div>
              {syncResult && (
                <p className="form-status">
                  GitHub sync scanned {syncResult.reposScanned || 0} repos, inserted {syncResult.eventsInserted || 0} events, errors {(syncResult.errors || []).length}.
                </p>
              )}
              {syncError && <p className="form-status form-status--error">{syncError}</p>}
            </article>
            <div className="bento-grid bento-grid--two">
              <section className="admin-list" aria-label="GitHub activity">
                <span className="card-kicker">GitHub</span>
                {renderActivityList(githubActivityEvents, "No GitHub activity events yet.")}
              </section>
              <section className="admin-list" aria-label="Portfolio activity">
                <span className="card-kicker">Portfolio</span>
                {renderActivityList(portfolioActivityEvents, "No portfolio activity events yet.")}
              </section>
            </div>
          </section>

          <section className="admin-crud-grid admin-focus-grid">
            <form className="secure-form admin-panel admin-focus-form" onSubmit={handleSubmit}>
              <span className="card-kicker">Current focus</span>
              <label>
                Active project
                <select name="activeProjectId" value={form.activeProjectId} onChange={handleChange}>
                  <option value="">No active project</option>
                  {projectOptions.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.type})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Weekly aim
                <textarea name="weeklyMission" value={form.weeklyMission} onChange={handleChange} rows="4" />
              </label>
              <label>
                Allowed work
                <textarea name="allowedWork" value={form.allowedWork} onChange={handleChange} rows="5" />
              </label>
              <label>
                Forbidden work
                <textarea name="forbiddenWork" value={form.forbiddenWork} onChange={handleChange} rows="5" />
              </label>
              <label>
                Attention items
                <textarea name="attentionItems" value={form.attentionItems} onChange={handleChange} rows="5" />
              </label>
              <label>
                Parked projects
                <textarea name="parkedProjects" value={form.parkedProjects} onChange={handleChange} rows="5" />
              </label>
              <div className="admin-actions">
                <button className="button button--primary" type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save focus"}
                </button>
                <button className="button button--secondary" type="button" onClick={handleSnapshot} disabled={snapshotting}>
                  {snapshotting ? "Creating..." : "Manual snapshot"}
                </button>
              </div>
              {error && <p className="form-status form-status--error">{error}</p>}
              {success && <p className="form-status form-status--success">{success}</p>}
            </form>

            <section className="admin-list" aria-label="Recent focus snapshots">
              <article className="admin-panel admin-focus-summary">
                <span className="card-kicker">Recent snapshots</span>
                <h2>Manual history</h2>
                <p>Newest focus snapshots are listed first.</p>
              </article>

              {snapshots.length === 0 && (
                <article className="bento-card bento-card--quiet">
                  <span className="card-kicker">Empty</span>
                  <h2>No snapshots yet</h2>
                  <p>Create a manual snapshot when the current focus is worth preserving.</p>
                </article>
              )}

              {snapshots.map(snapshot => (
                <article className="admin-list-card" key={snapshot.id}>
                  <div className="admin-list-card__header">
                    <div>
                      <span className="card-kicker">{snapshot.snapshotType || snapshot.snapshot_type || "manual"}</span>
                      <h2>{formatDate(snapshot.createdAt)}</h2>
                    </div>
                    {snapshot.activeProjectId && <small>{snapshot.activeProjectId}</small>}
                  </div>
                  <p>{snapshot.summary}</p>
                </article>
              ))}
            </section>
          </section>
        </>
      )}
    </div>
  )
}

export default AdminFocus
