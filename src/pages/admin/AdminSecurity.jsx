import { useCallback, useEffect, useMemo, useState } from "react"
import {
  createSecurityBlock,
  deleteSecurityBlock,
  fetchSecurityAttention,
  fetchSecurityBlocks,
  fetchSecurityEvents,
  fetchSecuritySettings,
  fetchSecuritySummary,
  updateSecurityAttention,
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

const formatAttentionDate = (value) => value ? formatDate(value) : "Not set"

const isEmptyValue = (value) => value === undefined || value === null || value === ""

const getField = (source, keys) => {
  for (const key of keys) {
    const value = key.split(".").reduce((current, part) => current?.[part], source)

    if (!isEmptyValue(value)) {
      return value
    }
  }

  return undefined
}

const displayValue = (value, fallback = "Not set") => isEmptyValue(value) ? fallback : String(value)

const humanize = (value, fallback = "Unknown") => {
  if (isEmptyValue(value)) {
    return fallback
  }

  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, character => character.toUpperCase())
}

const normalizeAttentionResponse = (data) => {
  if (Array.isArray(data)) {
    return data
  }

  const candidates = [
    data?.events,
    data?.attention,
    data?.attentionEvents,
    data?.attention_events,
    data?.items,
    data?.data,
    data?.results
  ]

  return candidates.find(Array.isArray) || []
}

const getAttentionId = (event) => getField(event, ["id", "eventId", "event_id", "attentionId", "attention_id"])

const getAttentionStatus = (event) => {
  const status = getField(event, ["attentionStatus", "attention_status"])
  return String(status || "open").toLowerCase()
}

const getAttentionSeverity = (event) => {
  const severity = getField(event, ["severity", "level", "attentionSeverity", "attention_severity"])
  const normalized = String(severity || "info").toLowerCase()
  return ["info", "warning", "critical"].includes(normalized) ? normalized : "info"
}

const getAttentionIpAddress = (event) => getField(event, [
  "ipAddress",
  "ip_address",
  "ip",
  "sourceIp",
  "source_ip"
])

const getAttentionIpHash = (event) => getField(event, [
  "ipHash",
  "ip_hash",
  "ipAddressHash",
  "ip_address_hash"
])

const getAttentionIp = (event) => getAttentionIpAddress(event) || getAttentionIpHash(event)

const getAttentionPath = (event) => getField(event, [
  "path",
  "requestPath",
  "request_path",
  "pathGroup",
  "path_group",
  "route",
  "url"
])

const getAttentionMethod = (event) => getField(event, ["method", "httpMethod", "http_method"])

const getAttentionHttpStatus = (event) => getField(event, ["httpStatus", "http_status", "statusCode", "status_code"])

const getAttentionCount = (event) => getField(event, [
  "count",
  "eventCount",
  "event_count",
  "requestCount",
  "request_count",
  "attemptCount",
  "attempt_count"
])

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
  const [attentionEvents, setAttentionEvents] = useState([])
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
  const [attentionActionId, setAttentionActionId] = useState("")
  const [attentionError, setAttentionError] = useState("")
  const [error, setError] = useState("")

  const loadSecurity = useCallback(async () => {
    setLoading(true)
    setError("")
    setAttentionError("")

    try {
      const params = { days }
      const [nextSummary, nextEvents, nextBlocks, nextSettings, nextAttentionResult] = await Promise.all([
        fetchSecuritySummary(params),
        fetchSecurityEvents(params),
        fetchSecurityBlocks(),
        fetchSecuritySettings(),
        fetchSecurityAttention(params)
          .then(data => ({ data }))
          .catch(err => ({ err }))
      ])

      setSummary(nextSummary)
      if (nextAttentionResult.err) {
        console.error(nextAttentionResult.err)
        setAttentionEvents([])
        setAttentionError(
          nextAttentionResult.err?.response?.status === 404
            ? "Attention endpoint unavailable."
            : "Security attention could not be loaded."
        )
      } else {
        setAttentionEvents(normalizeAttentionResponse(nextAttentionResult.data))
      }
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

  const handleUpdateAttention = async (eventId, attentionStatus) => {
    if (!eventId) {
      setError("Cannot update attention event without an event ID.")
      return
    }

    setSaving(true)
    setAttentionActionId(`${eventId}:${attentionStatus}`)
    setError("")

    try {
      await updateSecurityAttention(eventId, { attentionStatus })
      await loadSecurity()
    } catch (err) {
      console.error(err)
      setError(`Failed to mark attention event ${attentionStatus}.`)
    } finally {
      setSaving(false)
      setAttentionActionId("")
    }
  }

  const handleBlockAttentionIp = async (event) => {
    const eventId = getAttentionId(event)
    const ipAddress = getAttentionIpAddress(event)

    if (!ipAddress) {
      setError("Cannot block this attention event because no IP address was returned.")
      return
    }

    setSaving(true)
    setAttentionActionId(`${eventId || ipAddress}:blocked`)
    setError("")

    try {
      const eventType = getField(event, ["eventType", "event_type", "type", "kind", "category"])

      await createSecurityBlock({
        blockType: "ip",
        ipAddress,
        reason: `Blocked from security attention event: ${eventType || "unknown"}`,
        durationMinutes: 60
      })

      if (eventId) {
        await updateSecurityAttention(eventId, { attentionStatus: "blocked" })
      }

      await loadSecurity()
    } catch (err) {
      console.error(err)
      setError("Failed to block attention event IP.")
    } finally {
      setSaving(false)
      setAttentionActionId("")
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

          <section className="admin-security-attention" aria-label="Security attention needed">
            <div className="admin-security-attention__header">
              <div>
                <span className="card-kicker">Attention needed</span>
                <h2>Security events to review</h2>
                <p>Public spam, private API probing, login brute-force, repeated traffic, and notification delivery events that need an admin decision.</p>
              </div>
              <div className="admin-security-attention-actions">
                <button className="button button--secondary" type="button" onClick={loadSecurity} disabled={loading || saving}>
                  Refresh
                </button>
              </div>
            </div>

            {attentionError && (
              <article className="admin-security-attention-card admin-security-attention-card--info">
                <div className="admin-security-attention-card__header">
                  <div>
                    <span className="card-kicker">Unavailable</span>
                    <h3>{attentionError}</h3>
                  </div>
                  <span className="admin-security-pill admin-security-attention-status">Non-fatal</span>
                </div>
                <p>Existing summary, events, settings, and blocks remain available.</p>
              </article>
            )}

            <div className="admin-security-attention-grid">
              {attentionEvents.map((attentionEvent, index) => {
                const eventId = getAttentionId(attentionEvent)
                const eventType = getField(attentionEvent, ["eventType", "event_type", "type", "kind", "category"])
                const reason = getField(attentionEvent, ["reason", "message", "description", "summary"])
                const severity = getAttentionSeverity(attentionEvent)
                const attentionStatus = getAttentionStatus(attentionEvent)
                const ipAddress = getAttentionIpAddress(attentionEvent)
                const ipHash = getAttentionIpHash(attentionEvent)
                const ipValue = getAttentionIp(attentionEvent)
                const path = getAttentionPath(attentionEvent)
                const method = getAttentionMethod(attentionEvent)
                const httpStatus = getAttentionHttpStatus(attentionEvent)
                const count = getAttentionCount(attentionEvent)
                const windowStart = getField(attentionEvent, ["windowStart", "window_start", "firstSeenAt", "first_seen_at"])
                const windowEnd = getField(attentionEvent, ["windowEnd", "window_end", "lastSeenAt", "last_seen_at"])
                const lastSeenAt = getField(attentionEvent, ["lastSeenAt", "last_seen_at"])
                const userAgent = getField(attentionEvent, ["userAgent", "user_agent", "agent", "requestUserAgent", "request_user_agent"])
                const country = getField(attentionEvent, ["country", "countryCode", "country_code", "geo.country"])
                const city = getField(attentionEvent, ["city", "geo.city"])
                const colo = getField(attentionEvent, ["colo", "cfColo", "cf_colo", "geo.colo"])
                const asn = getField(attentionEvent, ["asn", "asNumber", "as_number", "geo.asn"])
                const notificationStatus = getField(attentionEvent, [
                  "notificationStatus",
                  "notification_status",
                  "notification.status",
                  "notificationDeliveryStatus",
                  "notification_delivery_status",
                  "deliveryStatus",
                  "delivery_status"
                ])
                const createdAt = getField(attentionEvent, ["createdAt", "created_at"])
                const updatedAt = getField(attentionEvent, ["updatedAt", "updated_at"])
                const key = eventId || `${eventType || "attention"}-${createdAt || updatedAt || index}`

                return (
                  <article className={`admin-security-attention-card admin-security-attention-card--${severity}`} key={key}>
                    <div className="admin-security-attention-card__header">
                      <div>
                        <span className="card-kicker">{humanize(severity)}</span>
                        <h3>{humanize(eventType, "Attention event")}</h3>
                      </div>
                      <span className={`admin-security-pill admin-security-attention-status admin-security-attention-status--${attentionStatus}`}>
                        {humanize(attentionStatus)}
                      </span>
                    </div>

                    {reason && <p>{displayValue(reason)}</p>}

                    <dl className="admin-security-attention-meta">
                      <div>
                        <dt>{ipAddress ? "IP" : "IP hash"}</dt>
                        <dd>{displayValue(ipValue, "Unknown")}</dd>
                      </div>
                      <div>
                        <dt>Path</dt>
                        <dd>{displayValue(path)}</dd>
                      </div>
                      <div>
                        <dt>Method / status</dt>
                        <dd>{[method, httpStatus].filter(value => !isEmptyValue(value)).join(" / ") || "Not set"}</dd>
                      </div>
                      <div>
                        <dt>Count</dt>
                        <dd>{displayValue(count)}</dd>
                      </div>
                      <div>
                        <dt>Window</dt>
                        <dd>{[formatAttentionDate(windowStart), formatAttentionDate(windowEnd)].join(" - ")}</dd>
                      </div>
                      <div>
                        <dt>Location</dt>
                        <dd>
                          {[country, city, colo, asn ? `ASN ${asn}` : ""].filter(Boolean).join(" / ") || "Unknown"}
                        </dd>
                      </div>
                      <div>
                        <dt>Notification</dt>
                        <dd>{displayValue(notificationStatus)}</dd>
                      </div>
                      <div>
                        <dt>User agent</dt>
                        <dd>{displayValue(userAgent)}</dd>
                      </div>
                      <div>
                        <dt>Last seen</dt>
                        <dd>{formatAttentionDate(lastSeenAt)}</dd>
                      </div>
                      <div>
                        <dt>Created / updated</dt>
                        <dd>{[formatAttentionDate(createdAt), formatAttentionDate(updatedAt)].join(" - ")}</dd>
                      </div>
                      {ipHash && ipAddress && (
                        <div>
                          <dt>IP hash</dt>
                          <dd>{displayValue(ipHash)}</dd>
                        </div>
                      )}
                    </dl>

                    <div className="admin-security-attention-actions">
                      <button
                        className="button button--secondary"
                        type="button"
                        disabled={saving || !eventId || attentionActionId === `${eventId}:reviewed`}
                        onClick={() => handleUpdateAttention(eventId, "reviewed")}
                      >
                        {attentionActionId === `${eventId}:reviewed` ? "Saving..." : "Mark reviewed"}
                      </button>
                      <button
                        className="button button--secondary"
                        type="button"
                        disabled={saving || !eventId || attentionActionId === `${eventId}:ignored`}
                        onClick={() => handleUpdateAttention(eventId, "ignored")}
                      >
                        {attentionActionId === `${eventId}:ignored` ? "Saving..." : "Ignore"}
                      </button>
                      <button
                        className="button button--primary"
                        type="button"
                        disabled={saving || !ipAddress || attentionActionId === `${eventId || ipAddress}:blocked`}
                        onClick={() => handleBlockAttentionIp(attentionEvent)}
                      >
                        {attentionActionId === `${eventId || ipAddress}:blocked` ? "Saving..." : "Block IP"}
                      </button>
                    </div>
                  </article>
                )
              })}

              {attentionEvents.length === 0 && (
                <article className="admin-security-attention-card">
                  <div className="admin-security-attention-card__header">
                    <div>
                      <span className="card-kicker">Clear</span>
                      <h3>No attention events</h3>
                    </div>
                    <span className="admin-security-pill admin-security-attention-status admin-security-attention-status--reviewed">Reviewed</span>
                  </div>
                  <p>No attention needed.</p>
                </article>
              )}
            </div>
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
