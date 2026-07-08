import { useCallback, useEffect, useMemo, useState } from "react"
import {
  createFocusSnapshot,
  createFocusWorkEvent,
  fetchActivityEvents,
  fetchFocusBriefing,
  fetchFocusCurrent,
  fetchFocusProjectGoals,
  fetchFocusProjectRegistry,
  fetchFocusSnapshots,
  fetchFocusTracking,
  fetchFocusWorkEvents,
  fetchProjects,
  syncGitHubActivity,
  updateFocusCurrent
} from "../../services/admin"
import {
  buildDisplayOutcomes,
  filterVisibleActions,
  formatSummaryItems,
  getChangedFileCount,
  getCommandSummary,
  getDisplayField,
  getDisplayReadyState,
  getProjectLastWorkSummary,
  getProjectLastWorkTime,
  getProjectLatestStatus,
  getWorkEventStatus,
  isRenewalHeadersActionText,
  isUnknownValue
} from "./focusIntelligence"

const emptyFocusForm = {
  activeProjectId: "",
  weeklyMission: "",
  allowedWork: "",
  forbiddenWork: "",
  attentionItems: "",
  parkedProjects: ""
}

const emptyWorkEventForm = {
  rawReport: "",
  source: "codex",
  projectKey: "mam-portfolio-api",
  projectName: "Mam Portfolio API",
  projectType: "backend",
  workspace: "portfolio",
  repo: "Mamduh5/mam-portfolio-api",
  area: "",
  goal: "",
  status: "",
  nextAction: "",
  resultStatus: "",
  resolved: "",
  verified: "",
  failed: "",
  branchCreated: false,
  deployPerformed: false
}

const toLines = (items) => Array.isArray(items) ? items.join("\n") : ""

const fromLines = (value) => {
  return value
    .split("\n")
    .map(item => item.trim())
    .filter(Boolean)
}

const splitListField = (value) => {
  return value
    .split(/[\n,]/)
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

const compactList = (value) => {
  if (Array.isArray(value)) {
    return value
  }

  if (!value) {
    return []
  }

  return [value]
}

const listFromResponse = (value, keys = []) => {
  if (Array.isArray(value)) {
    return value
  }

  if (!value || typeof value !== "object") {
    return []
  }

  for (const key of keys) {
    if (Array.isArray(value[key])) {
      return value[key]
    }
  }

  for (const key of ["items", "data", "results"]) {
    if (Array.isArray(value[key])) {
      return value[key]
    }
  }

  return []
}

const getField = (item, names, fallback = "") => {
  if (!item || typeof item !== "object") {
    return fallback
  }

  for (const name of names) {
    if (item[name] !== undefined && item[name] !== null && item[name] !== "") {
      return item[name]
    }
  }

  return fallback
}

const formatDate = (value) => {
  if (!value) {
    return "Unknown time"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date)
}

const formatValue = (value, emptyCopy = "None") => {
  if (value === undefined || value === null || value === "") {
    return emptyCopy
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }

  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : emptyCopy
  }

  if (typeof value === "object") {
    return `${Object.keys(value).length} fields`
  }

  return String(value)
}

const getErrorMessage = (err, fallback) => {
  return err?.response?.data?.error || err?.response?.data?.message || fallback
}

const logAdminError = (label, err) => {
  console.error(label, {
    status: err?.response?.status,
    message: err?.message || String(err)
  })
}

const countGoalsByStatus = (goals, statuses) => {
  const normalizedStatuses = statuses.map(status => status.toLowerCase())

  return goals.filter(goal => {
    const status = String(getField(goal, ["status", "goalStatus", "goal_status", "state"], "")).toLowerCase()
    return normalizedStatuses.includes(status)
  }).length
}

function DetailValue({ value, emptyCopy = "None" }) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const entries = Object.entries(value).filter(([, itemValue]) => (
      itemValue !== undefined && itemValue !== null && itemValue !== ""
    ))

    if (entries.length === 0) {
      return <p>{emptyCopy}</p>
    }

    return (
      <dl className="admin-focus-fields">
        {entries.slice(0, 8).map(([key, itemValue]) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd>{formatValue(itemValue)}</dd>
          </div>
        ))}
      </dl>
    )
  }

  if (Array.isArray(value)) {
    return <CompactList items={value} emptyCopy={emptyCopy} />
  }

  return <p>{formatValue(value, emptyCopy)}</p>
}

function CompactList({ items, emptyCopy }) {
  const normalizedItems = compactList(items)

  if (normalizedItems.length === 0) {
    return <p>{emptyCopy}</p>
  }

  return (
    <ul className="admin-focus-list">
      {normalizedItems.map((item, index) => (
        <li key={`${formatValue(item)}-${index}`}>{formatValue(item)}</li>
      ))}
    </ul>
  )
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
  const [briefing, setBriefing] = useState(null)
  const [tracking, setTracking] = useState(null)
  const [focusWorkEvents, setFocusWorkEvents] = useState([])
  const [focusProjectRegistry, setFocusProjectRegistry] = useState(null)
  const [focusProjectGoals, setFocusProjectGoals] = useState(null)
  const [intelligenceLoading, setIntelligenceLoading] = useState(false)
  const [intelligenceError, setIntelligenceError] = useState("")
  const [workEventForm, setWorkEventForm] = useState(emptyWorkEventForm)
  const [workEventSaving, setWorkEventSaving] = useState(false)
  const [workEventSuccess, setWorkEventSuccess] = useState("")
  const [workEventError, setWorkEventError] = useState("")

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

  const rawActionQueue = useMemo(() => {
    return listFromResponse(briefing?.actionQueue || briefing?.action_queue, ["actions", "queue"]).slice(0, 5)
  }, [briefing])

  const trackingSummary = useMemo(() => {
    return tracking?.summary || {}
  }, [tracking])

  const trackingProjects = useMemo(() => {
    return listFromResponse(tracking?.projects, ["projects"]).slice(0, 8)
  }, [tracking])

  const recentWorkEvents = useMemo(() => {
    return listFromResponse(focusWorkEvents, ["events", "workEvents", "work_events"]).slice(0, 5)
  }, [focusWorkEvents])

  const { visibleActions: actionQueue, suppressedActions } = useMemo(() => {
    return filterVisibleActions(rawActionQueue, recentWorkEvents)
  }, [rawActionQueue, recentWorkEvents])

  const displayReadyState = useMemo(() => {
    return getDisplayReadyState({
      briefing,
      trackingSummary,
      visibleActions: actionQueue,
      recentWorkEvents
    })
  }, [actionQueue, briefing, recentWorkEvents, trackingSummary])

  const nextSmallestAction = briefing?.nextSmallestAction || briefing?.next_smallest_action
  const displayNextSmallestAction = suppressedActions.length > 0 && isRenewalHeadersActionText(nextSmallestAction)
    ? ""
    : nextSmallestAction

  const displayOutcomes = useMemo(() => {
    return buildDisplayOutcomes(briefing, recentWorkEvents, trackingProjects)
  }, [briefing, recentWorkEvents, trackingProjects])

  const registeredProjects = useMemo(() => {
    return listFromResponse(focusProjectRegistry, ["projects", "registry"])
  }, [focusProjectRegistry])

  const projectGoals = useMemo(() => {
    return listFromResponse(focusProjectGoals, ["goals", "projectGoals", "project_goals"])
  }, [focusProjectGoals])

  const projectGoalSummary = focusProjectGoals?.summary || {}
  const registeredProjectCount = focusProjectRegistry?.summary?.projectCount
    ?? focusProjectRegistry?.summary?.project_count
    ?? focusProjectRegistry?.projectCount
    ?? focusProjectRegistry?.project_count
    ?? registeredProjects.length
  const activeProjectGoalCount = projectGoalSummary.activeGoalCount
    ?? projectGoalSummary.active_goal_count
    ?? projectGoalSummary.active
    ?? countGoalsByStatus(projectGoals, ["active", "in_progress", "ready"])
  const blockedProjectGoalCount = projectGoalSummary.blockedGoalCount
    ?? projectGoalSummary.blocked_goal_count
    ?? projectGoalSummary.blocked
    ?? countGoalsByStatus(projectGoals, ["blocked"])

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
      logAdminError("Failed to load focus dashboard.", err)
      setError(getErrorMessage(err, "Failed to load focus dashboard."))
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }, [])

  const loadFocusIntelligence = useCallback(async ({
    showLoading = true,
    includeProjectCounts = true
  } = {}) => {
    if (showLoading) {
      setIntelligenceLoading(true)
    }
    setIntelligenceError("")

    try {
      const [briefingData, trackingData, workEventData] = await Promise.all([
        fetchFocusBriefing(),
        fetchFocusTracking(),
        fetchFocusWorkEvents({ limit: 5 })
      ])

      setBriefing(briefingData || null)
      setTracking(trackingData || null)
      setFocusWorkEvents(workEventData || [])

      if (includeProjectCounts) {
        const [projectRegistryData, projectGoalData] = await Promise.all([
          fetchFocusProjectRegistry(),
          fetchFocusProjectGoals()
        ])

        setFocusProjectRegistry(projectRegistryData || null)
        setFocusProjectGoals(projectGoalData || null)
      }
    } catch (err) {
      logAdminError("Failed to load focus intelligence.", err)
      setIntelligenceError(getErrorMessage(err, "Failed to load focus intelligence."))
    } finally {
      if (showLoading) {
        setIntelligenceLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    loadFocus()
  }, [loadFocus])

  useEffect(() => {
    loadFocusIntelligence()
  }, [loadFocusIntelligence])

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    })
  }

  const handleWorkEventChange = (event) => {
    const { checked, name, type, value } = event.target

    setWorkEventForm(current => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }))
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
      logAdminError("Failed to save focus.", err)
      setError(getErrorMessage(err, "Failed to save focus."))
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
      logAdminError("Failed to create manual snapshot.", err)
      setError(getErrorMessage(err, "Failed to create manual snapshot."))
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
      logAdminError("Failed to sync GitHub activity.", err)
      setSyncError(getErrorMessage(err, "Failed to sync GitHub activity."))
    } finally {
      setSyncingGithub(false)
    }
  }

  const handleRefreshIntelligence = () => {
    loadFocusIntelligence()
  }

  const handleWorkEventSubmit = async (event) => {
    event.preventDefault()
    setWorkEventSaving(true)
    setWorkEventError("")
    setWorkEventSuccess("")

    const rawReport = workEventForm.rawReport.trim()

    if (!rawReport) {
      setWorkEventError("Raw report is required.")
      setWorkEventSaving(false)
      return
    }

    const payload = {
      rawReport,
      branchCreated: workEventForm.branchCreated,
      deployPerformed: workEventForm.deployPerformed
    }

    for (const field of [
      "source",
      "projectKey",
      "projectName",
      "projectType",
      "workspace",
      "repo",
      "area",
      "goal",
      "status",
      "nextAction",
      "resultStatus"
    ]) {
      const value = workEventForm[field]

      if (typeof value === "string" && value.trim()) {
        payload[field] = value.trim()
      }
    }

    for (const field of ["resolved", "verified", "failed"]) {
      const items = splitListField(workEventForm[field])

      if (items.length > 0) {
        payload[field] = items
      }
    }

    try {
      await createFocusWorkEvent(payload)
      setWorkEventSuccess("Work event recorded.")
      setWorkEventForm(current => ({
        ...current,
        rawReport: ""
      }))
      await loadFocusIntelligence({ showLoading: false, includeProjectCounts: false })
    } catch (err) {
      logAdminError("Failed to record work event.", err)
      setWorkEventError(getErrorMessage(err, "Failed to record work event."))
    } finally {
      setWorkEventSaving(false)
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

  const renderFocusMetric = (label, value) => (
    <div className="admin-focus-metric" key={label}>
      <span>{label}</span>
      <strong>{formatValue(value, "0")}</strong>
    </div>
  )

  const renderProjectRows = () => {
    if (trackingProjects.length === 0) {
      return (
        <article className="admin-list-card">
          <span className="card-kicker">Empty</span>
          <p>No tracked projects returned yet.</p>
        </article>
      )
    }

    return trackingProjects.map((project, index) => {
      const key = getField(project, ["projectKey", "project_key", "key", "id"], `project-${index}`)
      const name = getField(project, ["projectName", "project_name", "name"], key)
      const latestStatus = getProjectLatestStatus(project)
      const lastWorkTime = getProjectLastWorkTime(project)
      const lastWorkSummary = getProjectLastWorkSummary(project)
      const changedFileCount = getChangedFileCount(project)
      const commandSummaryItems = formatSummaryItems(getCommandSummary(project))

      return (
        <article className="admin-list-card" key={`${key}-${index}`}>
          <div className="admin-list-card__header">
            <div>
              <span className="card-kicker">{key}</span>
              <h2>{name}</h2>
            </div>
            <small>{latestStatus}</small>
          </div>
          <dl className="admin-focus-fields admin-focus-fields--compact">
            <div>
              <dt>Last work</dt>
              <dd>{formatDate(lastWorkTime)}</dd>
            </div>
            {lastWorkSummary && (
              <div>
                <dt>Latest work</dt>
                <dd>{formatValue(lastWorkSummary)}</dd>
              </div>
            )}
            {!isUnknownValue(changedFileCount) && (
              <div>
                <dt>Changed files</dt>
                <dd>{formatValue(changedFileCount)}</dd>
              </div>
            )}
            <div>
              <dt>Active goals</dt>
              <dd>{formatValue(getField(project, ["activeGoalCount", "active_goal_count", "activeGoals", "active_goals"], 0))}</dd>
            </div>
            <div>
              <dt>Blockers</dt>
              <dd>{formatValue(getField(project, ["openBlockerCount", "open_blocker_count", "blockedGoalCount", "blocked_goal_count"], 0))}</dd>
            </div>
            <div>
              <dt>Risks</dt>
              <dd>{formatValue(getField(project, ["openRiskCount", "open_risk_count", "riskCount", "risk_count"], 0))}</dd>
            </div>
            <div>
              <dt>Failed</dt>
              <dd>{formatValue(getField(project, ["failedCount", "failed_count"], 0))}</dd>
            </div>
          </dl>
          {commandSummaryItems.length > 0 && (
            <>
              <span className="card-kicker">Commands</span>
              <CompactList items={commandSummaryItems} emptyCopy="No command summary returned." />
            </>
          )}
        </article>
      )
    })
  }

  const renderWorkEvents = () => {
    if (recentWorkEvents.length === 0) {
      return (
        <article className="admin-list-card">
          <span className="card-kicker">Empty</span>
          <p>No work events recorded yet.</p>
        </article>
      )
    }

    return recentWorkEvents.map((workEvent, index) => {
      const id = getField(workEvent, ["id", "_id"], `work-event-${index}`)
      const title = getField(workEvent, ["task", "summary", "title", "rawReport", "raw_report"], "Untitled work event")
      const status = getWorkEventStatus(workEvent)
      const project = getField(workEvent, ["projectKey", "project_key", "projectName", "project_name"], "Unknown project")
      const createdAt = getField(workEvent, ["createdAt", "created_at", "occurredAt", "occurred_at"])
      const goal = getDisplayField(workEvent, ["goal"])
      const changedFileCount = getChangedFileCount(workEvent)
      const commandSummaryItems = formatSummaryItems(getCommandSummary(workEvent))

      return (
        <article className="admin-list-card" key={`${id}-${index}`}>
          <div className="admin-list-card__header">
            <div>
              <span className="card-kicker">{project}</span>
              <h2>{title}</h2>
            </div>
            <small>{formatDate(createdAt)}</small>
          </div>
          <p>Status: {status}</p>
          {goal && <p>Goal: {goal}</p>}
          {!isUnknownValue(changedFileCount) && <p>Changed files: {changedFileCount}</p>}
          {commandSummaryItems.length > 0 && (
            <>
              <span className="card-kicker">Commands</span>
              <CompactList items={commandSummaryItems} emptyCopy="No command summary returned." />
            </>
          )}
        </article>
      )
    })
  }

  return (
    <div className="admin-desk">
      <section className="admin-page-bar">
        <div>
          <span className="card-kicker">Focus workspace</span>
          <h1>Focus</h1>
          <p>Track current focus, allowed work, forbidden work, attention items, and parked projects.</p>
        </div>
        <div className="admin-actions">
          <button className="button button--primary" type="submit" form="admin-focus-form" disabled={saving || loading}>
            {saving ? "Saving..." : "Save focus"}
          </button>
          <button className="button button--secondary" type="button" onClick={handleSnapshot} disabled={snapshotting || loading}>
            {snapshotting ? "Creating..." : "Manual snapshot"}
          </button>
        </div>
      </section>

      {loading && <div className="skeleton" />}

      {!loading && (
        <>
          <section className="admin-compact-grid" aria-label="Latest automated focus snapshots">
            <article className="admin-panel">
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
            <article className="admin-panel">
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

          <section className="page-stack admin-compact-section" aria-label="Focus Intelligence">
            <article className="admin-panel admin-focus-summary">
              <div className="admin-inspector__header">
                <div>
                  <span className="card-kicker">Focus Intelligence</span>
                  <h2>Backend briefing and tracking</h2>
                  <p>Read-only view of the deployed Focus Intelligence endpoints.</p>
                </div>
                <button
                  className="button button--secondary"
                  type="button"
                  onClick={handleRefreshIntelligence}
                  disabled={intelligenceLoading}
                >
                  {intelligenceLoading ? "Refreshing..." : "Refresh intelligence"}
                </button>
              </div>
              {intelligenceError && <p className="form-status form-status--error">{intelligenceError}</p>}
            </article>

            {intelligenceLoading && <div className="skeleton" />}

            <section className="admin-focus-intelligence-grid">
              <article className="admin-panel admin-focus-summary">
                <span className="card-kicker">Briefing</span>
                <h2>{formatValue(displayReadyState, "No ready state")}</h2>
                <dl className="admin-focus-fields">
                  <div>
                    <dt>Current priority</dt>
                    <dd>{formatValue(briefing?.currentPriority || briefing?.current_priority)}</dd>
                  </div>
                  <div>
                    <dt>Next smallest action</dt>
                    <dd>{formatValue(displayNextSmallestAction)}</dd>
                  </div>
                  <div>
                    <dt>Confidence</dt>
                    <dd>{formatValue(briefing?.confidence)}</dd>
                  </div>
                </dl>
              </article>

              <article className="admin-panel admin-focus-summary">
                <span className="card-kicker">Tracking summary</span>
                <div className="admin-focus-metric-grid">
                  {renderFocusMetric("Projects", trackingSummary.projectCount ?? trackingSummary.project_count)}
                  {renderFocusMetric("Active goals", trackingSummary.activeGoalCount ?? trackingSummary.active_goal_count)}
                  {renderFocusMetric("Blocked goals", trackingSummary.blockedGoalCount ?? trackingSummary.blocked_goal_count)}
                  {renderFocusMetric("Open risks", trackingSummary.openRiskCount ?? trackingSummary.open_risk_count)}
                  {renderFocusMetric("Failed", trackingSummary.failedCount ?? trackingSummary.failed_count)}
                  {renderFocusMetric("Verified", trackingSummary.verifiedCount ?? trackingSummary.verified_count)}
                  {renderFocusMetric("Resolved", trackingSummary.resolvedCount ?? trackingSummary.resolved_count)}
                </div>
              </article>

              <article className="admin-panel admin-focus-summary">
                <span className="card-kicker">Registry</span>
                <div className="admin-focus-metric-grid">
                  {renderFocusMetric("Registered projects", registeredProjectCount)}
                  {renderFocusMetric("Active project goals", activeProjectGoalCount)}
                  {renderFocusMetric("Blocked project goals", blockedProjectGoalCount)}
                </div>
              </article>
            </section>

            <section className="admin-focus-intelligence-grid">
              <article className="admin-panel">
                <span className="card-kicker">Needs attention</span>
                <CompactList items={briefing?.needsAttention || briefing?.needs_attention} emptyCopy="No attention items returned." />
              </article>
              <article className="admin-panel">
                <span className="card-kicker">Can wait</span>
                <CompactList items={briefing?.canWait || briefing?.can_wait} emptyCopy="No waiting items returned." />
              </article>
              <article className="admin-panel">
                <span className="card-kicker">Do not touch now</span>
                <CompactList items={briefing?.doNotTouchNow || briefing?.do_not_touch_now} emptyCopy="No protected items returned." />
              </article>
              <article className="admin-panel">
                <span className="card-kicker">Risks</span>
                <CompactList items={briefing?.risks} emptyCopy="No risks returned." />
              </article>
              {(briefing?.goalProgress || briefing?.goal_progress) && (
                <article className="admin-panel">
                  <span className="card-kicker">Goal progress</span>
                  <DetailValue value={briefing.goalProgress || briefing.goal_progress} />
                </article>
              )}
              {displayOutcomes && (
                <article className="admin-panel">
                  <span className="card-kicker">Outcomes</span>
                  <DetailValue value={displayOutcomes} />
                </article>
              )}
            </section>

            <section className="admin-compact-grid">
              <section className="admin-list" aria-label="Top action queue">
                <article className="admin-panel admin-focus-summary">
                  <span className="card-kicker">Action queue</span>
                  <h2>Top 5 actions</h2>
                </article>
                {actionQueue.length === 0 && (
                  <article className="admin-list-card">
                    <span className="card-kicker">Empty</span>
                    <p>No pending action queue items returned.</p>
                  </article>
                )}
                {suppressedActions.length > 0 && (
                  <article className="admin-list-card">
                    <span className="card-kicker">Backend follow-up</span>
                    <p>Suppressed a stale completed renewal-header action returned by the backend; backend action resolution needs follow-up.</p>
                  </article>
                )}
                {actionQueue.map((item, index) => {
                  const severity = getField(item, ["severity", "level"], "Unscored")
                  const title = getField(item, ["title", "summary", "task"], "Untitled action")
                  const project = getField(item, ["project", "projectKey", "project_key", "projectName", "project_name"], "No project")
                  const source = getField(item, ["source"])
                  const reason = getField(item, ["reason", "sourceReason", "source_reason"])

                  return (
                    <article className="admin-list-card" key={`${title}-${index}`}>
                      <div className="admin-list-card__header">
                        <div>
                          <span className="card-kicker">{severity}</span>
                          <h2>{title}</h2>
                        </div>
                        <small>{project}</small>
                      </div>
                      {(source || reason) && <p>{[source, reason].filter(Boolean).join(" - ")}</p>}
                    </article>
                  )
                })}
              </section>

              <section className="admin-list" aria-label="Tracked projects">
                <article className="admin-panel admin-focus-summary">
                  <span className="card-kicker">Projects</span>
                  <h2>Top tracked rows</h2>
                  <CompactList items={tracking?.warnings} emptyCopy="No tracking warnings returned." />
                </article>
                {renderProjectRows()}
              </section>
            </section>
          </section>

          <section className="admin-workbench admin-focus-grid" aria-label="Record focus work event">
            <form className="secure-form admin-panel admin-focus-form" onSubmit={handleWorkEventSubmit}>
              <span className="card-kicker">Record work event</span>
              <label className="admin-form-full">
                Raw report
                <textarea
                  name="rawReport"
                  value={workEventForm.rawReport}
                  onChange={handleWorkEventChange}
                  rows="8"
                  required
                />
              </label>

              <div className="admin-form-pair admin-form-full">
                <label>
                  Source
                  <input name="source" value={workEventForm.source} onChange={handleWorkEventChange} />
                </label>
                <label>
                  Workspace
                  <input name="workspace" value={workEventForm.workspace} onChange={handleWorkEventChange} />
                </label>
              </div>

              <div className="admin-form-pair admin-form-full">
                <label>
                  Project key
                  <input name="projectKey" value={workEventForm.projectKey} onChange={handleWorkEventChange} />
                </label>
                <label>
                  Project name
                  <input name="projectName" value={workEventForm.projectName} onChange={handleWorkEventChange} />
                </label>
              </div>

              <div className="admin-form-pair admin-form-full">
                <label>
                  Project type
                  <input name="projectType" value={workEventForm.projectType} onChange={handleWorkEventChange} />
                </label>
                <label>
                  Repo
                  <input name="repo" value={workEventForm.repo} onChange={handleWorkEventChange} />
                </label>
              </div>

              <div className="admin-form-pair admin-form-full">
                <label>
                  Area
                  <input name="area" value={workEventForm.area} onChange={handleWorkEventChange} />
                </label>
                <label>
                  Goal
                  <input name="goal" value={workEventForm.goal} onChange={handleWorkEventChange} />
                </label>
              </div>

              <div className="admin-form-pair admin-form-full">
                <label>
                  Status
                  <input name="status" value={workEventForm.status} onChange={handleWorkEventChange} />
                </label>
                <label>
                  Result status
                  <input name="resultStatus" value={workEventForm.resultStatus} onChange={handleWorkEventChange} />
                </label>
              </div>

              <label className="admin-form-full">
                Next action
                <input name="nextAction" value={workEventForm.nextAction} onChange={handleWorkEventChange} />
              </label>

              <div className="admin-form-pair admin-form-full">
                <label>
                  Resolved
                  <textarea name="resolved" value={workEventForm.resolved} onChange={handleWorkEventChange} rows="3" />
                </label>
                <label>
                  Verified
                  <textarea name="verified" value={workEventForm.verified} onChange={handleWorkEventChange} rows="3" />
                </label>
                <label>
                  Failed
                  <textarea name="failed" value={workEventForm.failed} onChange={handleWorkEventChange} rows="3" />
                </label>
              </div>

              <div className="admin-checkbox-row admin-form-full">
                <label>
                  <input
                    name="branchCreated"
                    type="checkbox"
                    checked={workEventForm.branchCreated}
                    onChange={handleWorkEventChange}
                  />
                  Branch created
                </label>
                <label>
                  <input
                    name="deployPerformed"
                    type="checkbox"
                    checked={workEventForm.deployPerformed}
                    onChange={handleWorkEventChange}
                  />
                  Deploy performed
                </label>
              </div>

              <div className="admin-actions">
                <button className="button button--primary" type="submit" disabled={workEventSaving}>
                  {workEventSaving ? "Recording..." : "Record work event"}
                </button>
              </div>
              {workEventError && <p className="form-status form-status--error">{workEventError}</p>}
              {workEventSuccess && <p className="form-status form-status--success">{workEventSuccess}</p>}
            </form>

            <section className="admin-list" aria-label="Recent focus work events">
              <article className="admin-panel admin-focus-summary">
                <span className="card-kicker">Recent work events</span>
                <h2>Latest 5 reports</h2>
              </article>
              {renderWorkEvents()}
            </section>
          </section>

          <section className="page-stack admin-compact-section" aria-label="Observed activity">
            <article className="admin-panel admin-focus-summary">
              <span className="card-kicker">Observed activity</span>
              <h2>Declared focus vs observed activity</h2>
              <p>Compare planned work with recent GitHub and portfolio activity.</p>
              <div className="admin-actions">
                <button className="button button--secondary" type="button" onClick={handleGitHubSync} disabled={syncingGithub}>
                  {syncingGithub ? "Syncing..." : "Sync GitHub activity now"}
                </button>
              </div>
              {syncResult && (
                <p className="form-status">
                  GitHub sync checked {syncResult.reposScanned || 0} repos, added {syncResult.eventsInserted || 0} events, errors {(syncResult.errors || []).length}.
                </p>
              )}
              {syncError && <p className="form-status form-status--error">{syncError}</p>}
            </article>
            <div className="admin-compact-grid">
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

          <section className="admin-workbench admin-focus-grid">
            <form id="admin-focus-form" className="secure-form admin-panel admin-focus-form" onSubmit={handleSubmit}>
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
                <article className="admin-panel admin-empty-card">
                  <span className="card-kicker">Empty</span>
                  <h2>No snapshots yet</h2>
                  <p>No focus snapshots yet.</p>
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
