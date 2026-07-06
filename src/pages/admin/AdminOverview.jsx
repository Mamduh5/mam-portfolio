import { Link } from "react-router-dom"
import {
  fetchActivityEvents,
  fetchAdminMessages,
  fetchFocusCurrent,
  fetchProjects,
  fetchSecurityBlocks,
  fetchSecurityEvents,
  fetchSecuritySummary,
  fetchVisitAnalyticsGeo,
  fetchVisitAnalyticsPaths,
  fetchVisitAnalyticsSummary
} from "../../services/admin"
import { useCallback, useEffect, useMemo, useState } from "react"

const initialData = {
  visitSummary: null,
  visitGeo: { locations: [] },
  visitPaths: { paths: [] },
  securitySummary: null,
  securityEvents: { events: [] },
  securityBlocks: [],
  messages: [],
  projects: [],
  focus: null,
  activity: []
}

const formatNumber = (value) => new Intl.NumberFormat().format(Number(value) || 0)

const formatDate = (value) => value ? new Date(value).toLocaleString() : "No date"

const truncate = (value = "", length = 120) => {
  const text = String(value || "").trim()

  return text.length > length ? `${text.slice(0, length - 1)}...` : text
}

const getPointStyle = (location) => {
  const latitude = Number(location.latitude)
  const longitude = Number(location.longitude)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null
  }

  return {
    left: `${Math.min(Math.max(((longitude + 180) / 360) * 100, 2), 98)}%`,
    top: `${Math.min(Math.max(((90 - latitude) / 180) * 100, 6), 94)}%`
  }
}

const getProjectPreview = (project) => {
  return project.preview_image || project.imageUrl || project.previewImage || project.uploadUrl || ""
}

const getProjectHealth = (projects = []) => {
  const missingPreview = projects.filter(project => !getProjectPreview(project))
  const games = projects.filter(project => project.type === "game" || project.project_type === "game")
  const hidden = projects.filter(project => project.publicVisible === false || project.public_visible === false)
  const published = projects.filter(project => (project.status || "").toLowerCase() === "published")
  const draft = projects.filter(project => ["draft", "experiment"].includes((project.status || "").toLowerCase()))

  return {
    total: projects.length,
    games: games.length,
    hidden: hidden.length,
    published: published.length,
    draft: draft.length,
    missingPreview
  }
}

const buildAttentionItem = ({ securitySummary, securityEvents, securityBlocks, messages, projects, focus }) => {
  const activeBlocks = securityBlocks.filter(block => block.active)
  const recentBlockedLogin = (securityEvents.events || []).find(event => event.eventType === "login_blocked")
  const unreadMessages = messages.filter(message => !message.read)
  const projectHealth = getProjectHealth(projects)
  const failedLogins = Number(securitySummary?.loginFailed || 0)
  const focusMissing = !focus?.activeProject && !focus?.activeProjectId && !String(focus?.weeklyMission || "").trim()

  if (activeBlocks.length || recentBlockedLogin) {
    return {
      tone: "critical",
      kicker: "Security",
      title: activeBlocks.length ? "Active login block needs review" : "Blocked login attempt detected",
      copy: activeBlocks.length
        ? `${activeBlocks.length} temporary block${activeBlocks.length === 1 ? "" : "s"} currently active.`
        : "A login attempt was stopped by the security monitor.",
      to: "/admin/security",
      action: "Review security"
    }
  }

  if (failedLogins >= 5) {
    return {
      tone: "warning",
      kicker: "Security",
      title: "Failed login volume is elevated",
      copy: `${failedLogins} failed login attempts in the selected window.`,
      to: "/admin/security",
      action: "Inspect attempts"
    }
  }

  if (unreadMessages.length) {
    return {
      tone: "warning",
      kicker: "Inbox",
      title: "Unread messages are waiting",
      copy: `${unreadMessages.length} unread message${unreadMessages.length === 1 ? "" : "s"} in the contact inbox.`,
      to: "/admin/messages",
      action: "Open messages"
    }
  }

  if (projectHealth.missingPreview.length) {
    return {
      tone: "warning",
      kicker: "Projects",
      title: "Projects missing preview images",
      copy: `${projectHealth.missingPreview.length} project${projectHealth.missingPreview.length === 1 ? "" : "s"} need a preview image.`,
      to: "/admin/projects",
      action: "Fix projects"
    }
  }

  if (focusMissing) {
    return {
      tone: "warning",
      kicker: "Focus",
      title: "Focus plan is empty",
      copy: "Set an active project or weekly mission so the workspace has a clear direction.",
      to: "/admin/focus",
      action: "Set focus"
    }
  }

  return {
    tone: "healthy",
    kicker: "Healthy",
    title: "No urgent admin work",
    copy: "Traffic, security, content, and focus signals have no high-priority flags.",
    to: "/admin/analytics",
    action: "View analytics"
  }
}

function AdminOverview() {
  const [data, setData] = useState(initialData)
  const [errors, setErrors] = useState([])
  const [loading, setLoading] = useState(true)

  const loadDashboard = useCallback(async () => {
    await Promise.resolve()
    setLoading(true)

    const requests = [
      ["visitSummary", fetchVisitAnalyticsSummary({ days: 7 })],
      ["visitGeo", fetchVisitAnalyticsGeo({ days: 7 })],
      ["visitPaths", fetchVisitAnalyticsPaths({ days: 7 })],
      ["securitySummary", fetchSecuritySummary({ days: 7 })],
      ["securityEvents", fetchSecurityEvents({ days: 7 })],
      ["securityBlocks", fetchSecurityBlocks()],
      ["messages", fetchAdminMessages()],
      ["projects", fetchProjects()],
      ["focus", fetchFocusCurrent()],
      ["activity", fetchActivityEvents({ limit: 8 })]
    ]

    const results = await Promise.allSettled(requests.map(([, request]) => request))
    const nextData = { ...initialData }
    const nextErrors = []

    results.forEach((result, index) => {
      const key = requests[index][0]

      if (result.status === "fulfilled") {
        nextData[key] = result.value
        return
      }

      nextErrors.push(key)
    })

    setData(nextData)
    setErrors(nextErrors)
    setLoading(false)
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(loadDashboard, 0)

    return () => window.clearTimeout(timeout)
  }, [loadDashboard])

  const messages = Array.isArray(data.messages) ? data.messages : []
  const projects = Array.isArray(data.projects) ? data.projects : []
  const securityEvents = data.securityEvents?.events || []
  const securityBlocks = Array.isArray(data.securityBlocks) ? data.securityBlocks : []
  const activeBlocks = securityBlocks.filter(block => block.active)
  const unreadMessages = messages.filter(message => !message.read)
  const projectHealth = getProjectHealth(projects)
  const focus = data.focus || {}
  const attention = buildAttentionItem({
    securitySummary: data.securitySummary,
    securityEvents: data.securityEvents || { events: [] },
    securityBlocks,
    messages,
    projects,
    focus
  })

  const mapLocations = useMemo(() => {
    return (data.visitGeo?.locations || [])
      .map(location => ({ ...location, pointStyle: getPointStyle(location) }))
      .filter(location => location.pointStyle)
      .slice(0, 12)
  }, [data.visitGeo])

  const topLocations = data.visitGeo?.locations || []
  const topPaths = data.visitPaths?.paths || []
  const activity = Array.isArray(data.activity) ? data.activity : []
  const attentionItems = Array.isArray(focus.attentionItems) ? focus.attentionItems : []
  const activeProjectName = focus.activeProject?.name || focus.activeProject?.title || "No active project"

  return (
    <div className="admin-desk">
      <section className="admin-page-bar">
        <div>
          <span className="card-kicker">Control room</span>
          <h1>Dashboard</h1>
          <p>Operational view of portfolio traffic, login security, messages, project health, focus, and activity.</p>
        </div>
        <div className="admin-actions">
          <button className="button button--secondary" type="button" onClick={loadDashboard} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </section>

      {loading && <div className="skeleton" />}

      {!loading && errors.length > 0 && (
        <p className="form-status form-status--error">
          Some dashboard data could not load: {errors.join(", ")}.
        </p>
      )}

      {!loading && (
        <>
          <section className="admin-metric-grid" aria-label="Site pulse">
            <article className="admin-panel">
              <span className="card-kicker">Page views</span>
              <h2>{formatNumber(data.visitSummary?.totalVisits)}</h2>
              <p>{formatNumber(data.visitSummary?.uniqueVisitors)} visitors in the last 7 days.</p>
            </article>
            <article className="admin-panel">
              <span className="card-kicker">Failed logins</span>
              <h2>{formatNumber(data.securitySummary?.loginFailed)}</h2>
              <p>{formatNumber(data.securitySummary?.loginBlocked)} blocked attempts.</p>
            </article>
            <article className="admin-panel">
              <span className="card-kicker">Active blocks</span>
              <h2>{formatNumber(activeBlocks.length || data.securitySummary?.activeBlocks)}</h2>
              <p>Temporary login blocks in effect.</p>
            </article>
            <article className="admin-panel">
              <span className="card-kicker">Messages</span>
              <h2>{formatNumber(unreadMessages.length)}</h2>
              <p>{formatNumber(messages.length)} total inbox messages.</p>
            </article>
            <article className="admin-panel">
              <span className="card-kicker">Projects</span>
              <h2>{formatNumber(projectHealth.total)}</h2>
              <p>{formatNumber(projectHealth.missingPreview.length)} missing preview images.</p>
            </article>
            <article className="admin-panel">
              <span className="card-kicker">Focus</span>
              <h2>{focus.activeProject ? "Set" : "Open"}</h2>
              <p>{truncate(focus.weeklyMission || "No weekly mission.", 70)}</p>
            </article>
          </section>

          <section className={`admin-panel admin-attention admin-attention--${attention.tone}`} aria-label="Needs attention">
            <div>
              <span className="card-kicker">{attention.kicker}</span>
              <h2>{attention.title}</h2>
              <p>{attention.copy}</p>
            </div>
            <Link className="button button--primary" to={attention.to}>{attention.action}</Link>
          </section>

          <section className="admin-control-grid" aria-label="Security and traffic snapshots">
            <article className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <span className="card-kicker">Security</span>
                  <h2>Security snapshot</h2>
                </div>
                <Link className="button button--secondary" to="/admin/security">Open</Link>
              </div>
              <div className="admin-status-row">
                <span>{formatNumber(data.securitySummary?.loginFailed)} failed</span>
                <span>{formatNumber(data.securitySummary?.loginBlocked)} blocked</span>
                <span>{formatNumber(activeBlocks.length)} active blocks</span>
              </div>
              <div className="admin-ruled-list">
                {securityEvents.slice(0, 5).map(event => (
                  <div key={event.id}>
                    <strong>{event.eventType}</strong>
                    <span>{event.username || "Unknown"} · {event.ipAddress || "No IP"} · {formatDate(event.createdAt)}</span>
                  </div>
                ))}
                {securityEvents.length === 0 && <p>No recent security events.</p>}
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <span className="card-kicker">Traffic</span>
                  <h2>Traffic snapshot</h2>
                </div>
                <Link className="button button--secondary" to="/admin/analytics">Open</Link>
              </div>
              <div className="analytics-map analytics-map--compact" aria-label="Traffic geography">
                {mapLocations.map((location, index) => (
                  <span
                    className="analytics-map__point"
                    key={`${location.country}-${location.region}-${location.city}-${index}`}
                    style={location.pointStyle}
                    title={`${location.city || "Unknown city"}, ${location.country || "Unknown country"}: ${location.visits} visits`}
                  />
                ))}
              </div>
              <div className="admin-split-list">
                <div>
                  <span className="card-kicker">Top places</span>
                  {topLocations.slice(0, 4).map((location, index) => (
                    <p key={`${location.country}-${location.city}-${index}`}>
                      <strong>{location.city || location.region || "Unknown"}</strong> {location.country || "No country"} · {formatNumber(location.visits)}
                    </p>
                  ))}
                  {topLocations.length === 0 && <p>No geography data yet.</p>}
                </div>
                <div>
                  <span className="card-kicker">Top paths</span>
                  {topPaths.slice(0, 4).map(path => (
                    <p key={path.path}><strong>{path.path}</strong> · {formatNumber(path.visits)}</p>
                  ))}
                  {topPaths.length === 0 && <p>No path data yet.</p>}
                </div>
              </div>
            </article>
          </section>

          <section className="admin-control-grid" aria-label="Messages and project health">
            <article className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <span className="card-kicker">Inbox</span>
                  <h2>Messages preview</h2>
                </div>
                <Link className="button button--secondary" to="/admin/messages">Open</Link>
              </div>
              <div className="admin-ruled-list">
                {messages.slice(0, 5).map(message => (
                  <div key={message._id || message.id}>
                    <strong>{message.name || "Unknown sender"}{message.read ? "" : " · unread"}</strong>
                    <span>{message.email || "No email"} · {formatDate(message.createdAt)}</span>
                    <p>{truncate(message.message, 100)}</p>
                  </div>
                ))}
                {messages.length === 0 && <p>No messages yet.</p>}
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <span className="card-kicker">Catalog</span>
                  <h2>Project health</h2>
                </div>
                <Link className="button button--secondary" to="/admin/projects">Open</Link>
              </div>
              <div className="admin-status-row">
                <span>{formatNumber(projectHealth.total)} total</span>
                <span>{formatNumber(projectHealth.games)} games</span>
                <span>{formatNumber(projectHealth.published)} published</span>
                <span>{formatNumber(projectHealth.draft)} draft/experiment</span>
                <span>{formatNumber(projectHealth.hidden)} hidden</span>
              </div>
              <div className="admin-ruled-list">
                {projectHealth.missingPreview.slice(0, 5).map(project => (
                  <div key={project.id || project._id}>
                    <strong>{project.name || "Untitled project"}</strong>
                    <span>{project.type || project.project_type || "project"} · missing preview image</span>
                  </div>
                ))}
                {projectHealth.missingPreview.length === 0 && <p>All projects have preview images.</p>}
              </div>
            </article>
          </section>

          <section className="admin-control-grid" aria-label="Focus and activity">
            <article className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <span className="card-kicker">Focus</span>
                  <h2>Focus snapshot</h2>
                </div>
                <Link className="button button--secondary" to="/admin/focus">Open</Link>
              </div>
              <div className="admin-ruled-list">
                <div>
                  <strong>{activeProjectName}</strong>
                  <span>Active project</span>
                </div>
                <div>
                  <strong>{focus.weeklyMission ? truncate(focus.weeklyMission, 120) : "No weekly mission"}</strong>
                  <span>Weekly mission</span>
                </div>
                <div>
                  <strong>{formatNumber(attentionItems.length)}</strong>
                  <span>Attention items</span>
                </div>
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <span className="card-kicker">Timeline</span>
                  <h2>Recent activity</h2>
                </div>
              </div>
              <div className="admin-ruled-list">
                {activity.slice(0, 6).map(event => (
                  <div key={event.id}>
                    <strong>{event.title || event.eventType || "Activity"}</strong>
                    <span>{event.source || "portfolio"} · {event.repoFullName || event.entityType || "workspace"} · {formatDate(event.occurredAt || event.createdAt)}</span>
                  </div>
                ))}
                {activity.length === 0 && <p>No recent activity events.</p>}
              </div>
            </article>
          </section>
        </>
      )}
    </div>
  )
}

export default AdminOverview
