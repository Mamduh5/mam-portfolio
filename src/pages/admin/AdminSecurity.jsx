import { useCallback, useEffect, useMemo, useState } from "react"
import {
  createSecurityBlock,
  deleteSecurityBlock,
  fetchSecurityBlocks,
  fetchSecurityEvents,
  fetchSecuritySettings,
  fetchSecuritySummary,
  updateSecuritySettings
} from "../../services/admin"

const dayOptions = [7, 30, 90]

const settingLabels = {
  login_tracking_enabled: "Login tracking",
  captcha_enabled: "CAPTCHA",
  captcha_after_failed_attempts: "CAPTCHA after failures",
  block_after_failed_attempts: "Block after failures",
  failed_attempt_window_minutes: "Failure window minutes",
  block_duration_minutes: "Block duration minutes",
  max_block_duration_minutes: "Max block duration minutes"
}

const formatNumber = (value) => new Intl.NumberFormat().format(Number(value) || 0)

const formatDate = (value) => value ? new Date(value).toLocaleString() : "No date"

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

function AdminSecurity() {
  const [days, setDays] = useState(7)
  const [summary, setSummary] = useState(null)
  const [events, setEvents] = useState([])
  const [blocks, setBlocks] = useState([])
  const [settings, setSettings] = useState(null)
  const [settingsDraft, setSettingsDraft] = useState({})
  const [blockForm, setBlockForm] = useState({
    blockType: "ip",
    username: "",
    ipAddress: "",
    reason: "manual_admin_block",
    durationMinutes: 15
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const loadSecurity = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const params = { days }
      const [nextSummary, nextEvents, nextBlocks, nextSettings] = await Promise.all([
        fetchSecuritySummary(params),
        fetchSecurityEvents(params),
        fetchSecurityBlocks(),
        fetchSecuritySettings()
      ])

      setSummary(nextSummary)
      setEvents(nextEvents.events || [])
      setBlocks(Array.isArray(nextBlocks) ? nextBlocks : [])
      setSettings(nextSettings)
      setSettingsDraft(nextSettings)
    } catch (err) {
      console.error(err)
      setError("Failed to load security monitoring.")
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    loadSecurity()
  }, [loadSecurity])

  const mapLocations = useMemo(() => {
    return (summary?.locations || [])
      .map(location => ({ ...location, pointStyle: getPointStyle(location) }))
      .filter(location => location.pointStyle)
      .slice(0, 20)
  }, [summary])

  const failedEvents = events.filter(event => event.eventType === "login_failed")
  const activeBlocks = blocks.filter(block => block.active)

  const handleSettingChange = (key, value) => {
    setSettingsDraft(current => ({
      ...current,
      [key]: value
    }))
  }

  const handleSaveSettings = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError("")

    try {
      const updated = await updateSecuritySettings(settingsDraft)
      setSettings(updated)
      setSettingsDraft(updated)
    } catch (err) {
      console.error(err)
      setError("Failed to save security settings.")
    } finally {
      setSaving(false)
    }
  }

  const handleCreateBlock = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError("")

    try {
      await createSecurityBlock(blockForm)
      setBlockForm({
        blockType: "ip",
        username: "",
        ipAddress: "",
        reason: "manual_admin_block",
        durationMinutes: 15
      })
      setBlocks(await fetchSecurityBlocks())
    } catch (err) {
      console.error(err)
      setError("Failed to create block.")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteBlock = async (blockId) => {
    setSaving(true)
    setError("")

    try {
      await deleteSecurityBlock(blockId)
      setBlocks(blocks.filter(block => block.id !== blockId))
    } catch (err) {
      console.error(err)
      setError("Failed to remove block.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-desk">
      <section className="admin-page-bar">
        <div>
          <span className="card-kicker">Login monitoring</span>
          <h1>Security</h1>
          <p>Private admin login monitoring for attempts, failures, blocks, locations, and thresholds.</p>
        </div>
        <div className="admin-actions">
          <select className="admin-select" value={days} onChange={(event) => setDays(Number(event.target.value))}>
            {dayOptions.map(option => (
              <option key={option} value={option}>Last {option} days</option>
            ))}
          </select>
          <button className="button button--secondary" type="button" onClick={loadSecurity} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </section>

      {error && <p className="form-status form-status--error">{error}</p>}
      {loading && <div className="skeleton" />}

      {!loading && (
        <>
          <section className="admin-metric-grid" aria-label="Security summary">
            <article className="admin-panel">
              <span className="card-kicker">Success</span>
              <h2>{formatNumber(summary?.loginSuccess)}</h2>
              <p>Successful admin logins.</p>
            </article>
            <article className="admin-panel">
              <span className="card-kicker">Failed</span>
              <h2>{formatNumber(summary?.loginFailed)}</h2>
              <p>Invalid credential attempts.</p>
            </article>
            <article className="admin-panel">
              <span className="card-kicker">Blocked</span>
              <h2>{formatNumber(summary?.loginBlocked)}</h2>
              <p>Attempts stopped by active blocks.</p>
            </article>
            <article className="admin-panel">
              <span className="card-kicker">Active blocks</span>
              <h2>{formatNumber(summary?.activeBlocks)}</h2>
              <p>Temporary blocks still in effect.</p>
            </article>
          </section>

          <section className="admin-analytics-grid" aria-label="Security geography">
            <article className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <span className="card-kicker">Map</span>
                  <h2>Login geography</h2>
                </div>
                <strong>{formatNumber(summary?.countries)} countries</strong>
              </div>
              <div className="admin-analytics-map" aria-label="Approximate login event map">
                {mapLocations.map((location, index) => (
                  <span
                    className="admin-analytics-map__point"
                    key={`${location.country}-${location.region}-${location.city}-${index}`}
                    style={location.pointStyle}
                    title={`${location.city || "Unknown city"}, ${location.country || "Unknown country"}: ${location.events} events`}
                  />
                ))}
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <span className="card-kicker">Settings</span>
                  <h2>Thresholds</h2>
                </div>
              </div>
              {settings && (
                <form className="secure-form security-settings-form" onSubmit={handleSaveSettings}>
                  <label className="admin-checkbox">
                    <input
                      type="checkbox"
                      checked={Boolean(settingsDraft.login_tracking_enabled)}
                      onChange={(event) => handleSettingChange("login_tracking_enabled", event.target.checked)}
                    />
                    {settingLabels.login_tracking_enabled}
                  </label>
                  <label className="admin-checkbox">
                    <input
                      type="checkbox"
                      checked={Boolean(settingsDraft.captcha_enabled)}
                      onChange={(event) => handleSettingChange("captcha_enabled", event.target.checked)}
                    />
                    {settingLabels.captcha_enabled}
                  </label>
                  {Object.keys(settingLabels).filter(key => !key.endsWith("_enabled")).map(key => (
                    <label key={key}>
                      {settingLabels[key]}
                      <input
                        type="number"
                        min="1"
                        value={settingsDraft[key] ?? ""}
                        onChange={(event) => handleSettingChange(key, Number(event.target.value))}
                      />
                    </label>
                  ))}
                  <button className="button button--primary" type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save settings"}
                  </button>
                </form>
              )}
            </article>
          </section>

          <section className="admin-analytics-grid" aria-label="Login events">
            <article className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <span className="card-kicker">Attempts</span>
                  <h2>Recent login attempts</h2>
                </div>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>User</th>
                      <th>IP</th>
                      <th>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.slice(0, 20).map(event => (
                      <tr key={event.id}>
                        <td>
                          <strong>{event.eventType}</strong>
                          <span>{event.reason || "No reason"}</span>
                        </td>
                        <td>{event.username || "Unknown"}</td>
                        <td>{event.ipAddress || "No IP"}</td>
                        <td>{formatDate(event.createdAt)}</td>
                      </tr>
                    ))}
                    {events.length === 0 && (
                      <tr>
                        <td colSpan="4">No login events yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <span className="card-kicker">Failures</span>
                  <h2>Failed logins</h2>
                </div>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Location</th>
                      <th>IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failedEvents.slice(0, 12).map(event => (
                      <tr key={event.id}>
                        <td><strong>{event.username || "Unknown"}</strong></td>
                        <td>
                          <strong>{event.city || event.region || "Unknown"}</strong>
                          <span>{event.country || "No country"}</span>
                        </td>
                        <td>{event.ipAddress || "No IP"}</td>
                      </tr>
                    ))}
                    {failedEvents.length === 0 && (
                      <tr>
                        <td colSpan="3">No failed logins yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>
          </section>

          <section className="admin-analytics-grid" aria-label="Security blocks">
            <article className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <span className="card-kicker">Blocks</span>
                  <h2>Blocked IPs and users</h2>
                </div>
                <strong>{activeBlocks.length} active</strong>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Target</th>
                      <th>Reason</th>
                      <th>Until</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blocks.map(block => (
                      <tr key={block.id}>
                        <td>
                          <strong>{block.blockType}</strong>
                          <span>{[block.username, block.ipAddress].filter(Boolean).join(" / ") || "No target"}</span>
                        </td>
                        <td>{block.reason || "No reason"}</td>
                        <td>{formatDate(block.blockedUntil)}</td>
                        <td>
                          <button className="button button--secondary" type="button" disabled={saving} onClick={() => handleDeleteBlock(block.id)}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    {blocks.length === 0 && (
                      <tr>
                        <td colSpan="4">No blocks yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <span className="card-kicker">Manual block</span>
                  <h2>Add block</h2>
                </div>
              </div>
              <form className="secure-form" onSubmit={handleCreateBlock}>
                <label>
                  Type
                  <select
                    value={blockForm.blockType}
                    onChange={(event) => setBlockForm(current => ({ ...current, blockType: event.target.value }))}
                  >
                    <option value="ip">IP</option>
                    <option value="username_ip">Username + IP</option>
                  </select>
                </label>
                {blockForm.blockType === "username_ip" && (
                  <label>
                    Username
                    <input
                      value={blockForm.username}
                      onChange={(event) => setBlockForm(current => ({ ...current, username: event.target.value }))}
                    />
                  </label>
                )}
                <label>
                  IP address
                  <input
                    value={blockForm.ipAddress}
                    onChange={(event) => setBlockForm(current => ({ ...current, ipAddress: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  Reason
                  <input
                    value={blockForm.reason}
                    onChange={(event) => setBlockForm(current => ({ ...current, reason: event.target.value }))}
                  />
                </label>
                <label>
                  Duration minutes
                  <input
                    type="number"
                    min="1"
                    value={blockForm.durationMinutes}
                    onChange={(event) => setBlockForm(current => ({ ...current, durationMinutes: Number(event.target.value) }))}
                  />
                </label>
                <button className="button button--primary" type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Create block"}
                </button>
              </form>
            </article>
          </section>
        </>
      )}
    </div>
  )
}

export default AdminSecurity
