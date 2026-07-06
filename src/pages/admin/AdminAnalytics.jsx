import { useCallback, useEffect, useMemo, useState } from "react"
import {
  fetchVisitAnalyticsAgents,
  fetchVisitAnalyticsGeo,
  fetchVisitAnalyticsPaths,
  fetchVisitAnalyticsSummary
} from "../../services/admin"

const dayOptions = [7, 30, 90]

const emptyData = {
  summary: null,
  geo: { locations: [] },
  paths: { paths: [] },
  agents: { agents: [] }
}

const formatNumber = (value) => new Intl.NumberFormat().format(Number(value) || 0)

const formatDate = (value) => {
  if (!value) {
    return "No date"
  }

  return new Date(value).toLocaleString()
}

const getBrowserName = (userAgent = "") => {
  if (!userAgent) return "Unknown"
  if (userAgent.includes("Edg/")) return "Edge"
  if (userAgent.includes("Chrome/") || userAgent.includes("CriOS/")) return "Chrome"
  if (userAgent.includes("Firefox/") || userAgent.includes("FxiOS/")) return "Firefox"
  if (userAgent.includes("Safari/")) return "Safari"

  return "Other"
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

function AdminAnalytics() {
  const [days, setDays] = useState(7)
  const [data, setData] = useState(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadAnalytics = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const params = { days }
      const [summary, geo, paths, agents] = await Promise.all([
        fetchVisitAnalyticsSummary(params),
        fetchVisitAnalyticsGeo(params),
        fetchVisitAnalyticsPaths(params),
        fetchVisitAnalyticsAgents(params)
      ])

      setData({ summary, geo, paths, agents })
    } catch (err) {
      console.error(err)
      setError("Failed to load analytics.")
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  const mapLocations = useMemo(() => {
    return (data.geo.locations || [])
      .map(location => ({ ...location, pointStyle: getPointStyle(location) }))
      .filter(location => location.pointStyle)
      .slice(0, 20)
  }, [data.geo.locations])

  const summary = data.summary || {}
  const locations = data.geo.locations || []
  const paths = data.paths.paths || []
  const agents = data.agents.agents || []

  return (
    <div className="admin-desk">
      <section className="admin-page-bar">
        <div>
          <span className="card-kicker">Traffic intelligence</span>
          <h1>Analytics</h1>
          <p>Private visit analytics from D1, grouped for traffic, geography, paths, and user agents.</p>
        </div>
        <div className="admin-actions">
          <select className="admin-select" value={days} onChange={(event) => setDays(Number(event.target.value))}>
            {dayOptions.map(option => (
              <option key={option} value={option}>Last {option} days</option>
            ))}
          </select>
          <button className="button button--secondary" type="button" onClick={loadAnalytics} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </section>

      {error && <p className="form-status form-status--error">{error}</p>}
      {loading && <div className="skeleton" />}

      {!loading && (
        <>
          <section className="admin-metric-grid" aria-label="Visit summary">
            <article className="admin-panel">
              <span className="card-kicker">Visits</span>
              <h2>{formatNumber(summary.totalVisits)}</h2>
              <p>Total stored visits.</p>
            </article>
            <article className="admin-panel">
              <span className="card-kicker">Visitors</span>
              <h2>{formatNumber(summary.uniqueVisitors)}</h2>
              <p>Unique IP addresses.</p>
            </article>
            <article className="admin-panel">
              <span className="card-kicker">Paths</span>
              <h2>{formatNumber(summary.uniquePaths)}</h2>
              <p>Distinct visited routes.</p>
            </article>
            <article className="admin-panel">
              <span className="card-kicker">Geo coverage</span>
              <h2>{formatNumber(summary.knownGeoVisits)}</h2>
              <p>Visits with Cloudflare location metadata.</p>
            </article>
          </section>

          <section className="admin-analytics-grid" aria-label="Visit geography">
            <article className="admin-panel admin-geo-map">
              <div className="admin-panel-heading">
                <div>
                  <span className="card-kicker">Map</span>
                  <h2>Visitor geography</h2>
                </div>
                <strong>{formatNumber(summary.countries)} countries</strong>
              </div>
              <div className="analytics-map" aria-label="Approximate visitor map">
                {mapLocations.map((location, index) => (
                  <span
                    className="analytics-map__point"
                    key={`${location.country}-${location.region}-${location.city}-${index}`}
                    style={location.pointStyle}
                    title={`${location.city || "Unknown city"}, ${location.country || "Unknown country"}: ${location.visits} visits`}
                  />
                ))}
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <span className="card-kicker">Locations</span>
                  <h2>Country and city</h2>
                </div>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Visits</th>
                      <th>Visitors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locations.slice(0, 12).map((location, index) => (
                      <tr key={`${location.country}-${location.region}-${location.city}-${index}`}>
                        <td>
                          <strong>{location.city || location.region || "Unknown"}</strong>
                          <span>{location.country || "No country"}</span>
                        </td>
                        <td>{formatNumber(location.visits)}</td>
                        <td>{formatNumber(location.uniqueVisitors)}</td>
                      </tr>
                    ))}
                    {locations.length === 0 && (
                      <tr>
                        <td colSpan="3">No geography data yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          </section>

          <section className="admin-analytics-grid" aria-label="Visit details">
            <article className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <span className="card-kicker">Routes</span>
                  <h2>Top paths</h2>
                </div>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Path</th>
                      <th>Visits</th>
                      <th>Last visit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paths.slice(0, 12).map(path => (
                      <tr key={path.path}>
                        <td><strong>{path.path}</strong></td>
                        <td>{formatNumber(path.visits)}</td>
                        <td>{formatDate(path.lastVisitAt)}</td>
                      </tr>
                    ))}
                    {paths.length === 0 && (
                      <tr>
                        <td colSpan="3">No path data yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <span className="card-kicker">Clients</span>
                  <h2>User agents</h2>
                </div>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Browser</th>
                      <th>Visits</th>
                      <th>User agent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.slice(0, 12).map((agent, index) => (
                      <tr key={`${agent.userAgent || "unknown"}-${index}`}>
                        <td><strong>{getBrowserName(agent.userAgent)}</strong></td>
                        <td>{formatNumber(agent.visits)}</td>
                        <td><span className="admin-table__truncate">{agent.userAgent || "Unknown"}</span></td>
                      </tr>
                    ))}
                    {agents.length === 0 && (
                      <tr>
                        <td colSpan="3">No user-agent data yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        </>
      )}
    </div>
  )
}

export default AdminAnalytics
