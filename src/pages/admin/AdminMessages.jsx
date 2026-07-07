import { useEffect, useMemo, useState } from "react"
import {
  archiveMessage,
  deleteMessage,
  fetchAdminMessages,
  markMessageRead,
  markMessageReplied,
  unarchiveMessage,
  updateAdminMessage
} from "../../services/admin"

const filters = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "replied", label: "Replied" },
  { value: "archived", label: "Archived" },
  { value: "high", label: "High priority" }
]

const formatDate = (value) => value ? new Date(value).toLocaleString() : "No date"

const getMessageId = (message) => message?._id || message?.id || ""

const getStatus = (message) => {
  if (message?.status) {
    return message.status
  }

  return message?.read ? "read" : "new"
}

const getPriority = (message) => message?.priority || "normal"

const getOwnerNote = (message) => message?.ownerNote ?? message?.owner_note ?? message?.internalNote ?? message?.internal_note ?? ""

const getNotificationStatus = (message) => {
  return message?.notificationStatus || message?.notification_status || message?.latestNotificationStatus || message?.latest_notification_status || ""
}

const normalizeMessages = (data) => {
  if (Array.isArray(data)) {
    return data
  }

  const candidates = [data?.messages, data?.items, data?.data, data?.results]
  return candidates.find(Array.isArray) || []
}

const previewText = (value, fallback = "No message text") => {
  const text = String(value || "").replace(/\s+/g, " ").trim()
  return text ? text.slice(0, 180) : fallback
}

const matchesSearch = (message, search) => {
  const query = search.trim().toLowerCase()

  if (!query) {
    return true
  }

  return [
    message.name,
    message.email,
    message.subject,
    message.message,
    getOwnerNote(message),
    getStatus(message),
    getPriority(message)
  ].some(value => String(value || "").toLowerCase().includes(query))
}

function AdminMessages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [copyStatus, setCopyStatus] = useState("")
  const [actionId, setActionId] = useState("")
  const [selectedMessageId, setSelectedMessageId] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [noteDraft, setNoteDraft] = useState("")

  const selectedMessage = messages.find(message => getMessageId(message) === selectedMessageId) || null

  const counts = useMemo(() => {
    return messages.reduce((current, message) => {
      const status = getStatus(message)
      const priority = getPriority(message)

      return {
        total: current.total + 1,
        new: current.new + (status === "new" ? 1 : 0),
        high: current.high + (priority === "high" ? 1 : 0)
      }
    }, { total: 0, new: 0, high: 0 })
  }, [messages])

  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      const status = getStatus(message)
      const priority = getPriority(message)
      const filterMatch = activeFilter === "all" ||
        status === activeFilter ||
        (activeFilter === "high" && priority === "high")

      return filterMatch && matchesSearch(message, search)
    })
  }, [activeFilter, messages, search])

  const loadMessages = async () => {
    setLoading(true)
    setError("")

    try {
      const data = await fetchAdminMessages()
      const nextMessages = normalizeMessages(data)
      setMessages(nextMessages)
      setSelectedMessageId(current => {
        const currentStillExists = nextMessages.some(message => getMessageId(message) === current)
        return currentStillExists ? current : getMessageId(nextMessages[0]) || ""
      })
    } catch (err) {
      console.error(err)
      setError("Failed to load messages.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMessages()
  }, [])

  useEffect(() => {
    setNoteDraft(selectedMessage ? getOwnerNote(selectedMessage) : "")
    setCopyStatus("")
  }, [selectedMessage])

  const replaceMessage = (updated) => {
    setMessages(current => current.map(message => getMessageId(message) === getMessageId(updated) ? updated : message))
  }

  const runMessageAction = async (messageId, label, action) => {
    setActionId(`${messageId}:${label}`)
    setError("")

    try {
      const updated = await action()
      replaceMessage(updated)
      setSelectedMessageId(getMessageId(updated))
    } catch (err) {
      console.error(err)
      setError(`Failed to ${label.replace(/-/g, " ")}.`)
    } finally {
      setActionId("")
    }
  }

  const handleDelete = async (messageId) => {
    setActionId(`${messageId}:delete`)
    setError("")

    try {
      await deleteMessage(messageId)
      const nextMessages = messages.filter(message => getMessageId(message) !== messageId)
      setMessages(nextMessages)
      if (selectedMessageId === messageId) {
        setSelectedMessageId(getMessageId(nextMessages[0]) || "")
      }
    } catch (err) {
      console.error(err)
      setError("Failed to delete message.")
    } finally {
      setActionId("")
    }
  }

  const handleSaveNote = async () => {
    if (!selectedMessage) {
      return
    }

    const messageId = getMessageId(selectedMessage)
    await runMessageAction(messageId, "save-note", () => updateAdminMessage(messageId, { ownerNote: noteDraft }))
  }

  const handleTogglePriority = async () => {
    if (!selectedMessage) {
      return
    }

    const messageId = getMessageId(selectedMessage)
    const nextPriority = getPriority(selectedMessage) === "high" ? "normal" : "high"
    await runMessageAction(messageId, "toggle-priority", () => updateAdminMessage(messageId, { priority: nextPriority }))
  }

  const handleCopyEmail = async () => {
    const email = selectedMessage?.email || ""

    if (!email) {
      setCopyStatus("No email to copy.")
      return
    }

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard unavailable")
      }

      await navigator.clipboard.writeText(email)
      setCopyStatus("Email copied.")
    } catch {
      setCopyStatus("Copy unavailable. Select and copy the email manually.")
    }
  }

  return (
    <div className="admin-desk">
      <section className="admin-page-bar">
        <div>
          <span className="card-kicker">Private inbox</span>
          <h1>Messages</h1>
          <p>Owner-only contact workflow for reading, replying, prioritizing, archiving, and tracking notification delivery.</p>
        </div>
        <div className="admin-summary-grid">
          <div>
            <span>Total</span>
            <strong>{counts.total}</strong>
          </div>
          <div>
            <span>New</span>
            <strong>{counts.new}</strong>
          </div>
          <div>
            <span>High</span>
            <strong>{counts.high}</strong>
          </div>
        </div>
        <div className="admin-actions">
          <button className="button button--secondary" type="button" onClick={loadMessages} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </section>

      {error && <p className="form-status form-status--error">{error}</p>}
      {loading && <div className="skeleton" />}

      {!loading && (
        <section className="admin-message-workflow" aria-label="Contact message workflow">
          <div className="admin-message-filters">
            <div className="admin-message-filter-buttons" role="group" aria-label="Message filters">
              {filters.map(filter => (
                <button
                  className={`button ${activeFilter === filter.value ? "button--primary" : "button--secondary"}`}
                  type="button"
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <label>
              Search
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, email, message, note"
              />
            </label>
          </div>

          {messages.length === 0 && (
            <article className="admin-panel admin-empty-card">
              <span className="card-kicker">Inbox clear</span>
              <h2>No messages yet</h2>
              <p>New contact form submissions will appear here.</p>
            </article>
          )}

          {messages.length > 0 && (
            <div className="admin-workbench admin-workbench--messages" aria-label="Contact messages">
              <div className="admin-message-list">
                {filteredMessages.map(message => {
                  const messageId = getMessageId(message)
                  const status = getStatus(message)
                  const priority = getPriority(message)
                  const notificationStatus = getNotificationStatus(message)

                  return (
                    <button
                      className={`admin-message-card admin-message-card--${status}${priority === "high" ? " admin-message-card--high" : ""}${selectedMessageId === messageId ? " admin-message-card--selected" : ""}`}
                      type="button"
                      key={messageId}
                      onClick={() => setSelectedMessageId(messageId)}
                    >
                      <div className="admin-message-card__header">
                        <div>
                          <span className="card-kicker">{status}</span>
                          <h2>{message.name || "Unknown sender"}</h2>
                          <p>{message.email || "No email"}</p>
                        </div>
                        <small>{formatDate(message.createdAt || message.created_at)}</small>
                      </div>
                      {message.subject && <strong>{message.subject}</strong>}
                      <p>{previewText(message.message)}</p>
                      <div className="admin-message-card__meta">
                        <span>{priority === "high" ? "High priority" : "Normal priority"}</span>
                        <span className="admin-notification-status">Notify: {notificationStatus || "Unknown"}</span>
                      </div>
                    </button>
                  )
                })}

                {filteredMessages.length === 0 && (
                  <article className="admin-panel admin-empty-card">
                    <span className="card-kicker">No matches</span>
                    <h2>No messages match this view</h2>
                    <p>Change the filter or search term.</p>
                  </article>
                )}
              </div>

              <aside className="admin-panel admin-message-detail">
                {selectedMessage ? (
                  <>
                    <div className="admin-inspector__header">
                      <div>
                        <span className="card-kicker">{getStatus(selectedMessage)}</span>
                        <h2>{selectedMessage.name || "Unknown sender"}</h2>
                        <p>{selectedMessage.email || "No email"}</p>
                      </div>
                      <small>{formatDate(selectedMessage.createdAt || selectedMessage.created_at)}</small>
                    </div>

                    <div className="admin-message-detail__meta">
                      <span>Status: {getStatus(selectedMessage)}</span>
                      <span>Priority: {getPriority(selectedMessage)}</span>
                      <span className="admin-notification-status">Notify: {getNotificationStatus(selectedMessage) || "Unknown"}</span>
                    </div>

                    <div className="message-detail-paper">
                      {selectedMessage.subject && <strong>{selectedMessage.subject}</strong>}
                      <p>{selectedMessage.message || "No message text"}</p>
                    </div>

                    <label className="admin-message-note">
                      Internal note
                      <textarea
                        value={noteDraft}
                        onChange={(event) => setNoteDraft(event.target.value)}
                        rows="5"
                        maxLength="2000"
                        placeholder="Owner-only notes"
                      />
                    </label>

                    <div className="admin-message-actions">
                      {getStatus(selectedMessage) !== "read" && (
                        <button
                          className="button button--secondary"
                          type="button"
                          disabled={actionId === `${getMessageId(selectedMessage)}:mark-read`}
                          onClick={() => runMessageAction(getMessageId(selectedMessage), "mark-read", () => markMessageRead(getMessageId(selectedMessage)))}
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        className="button button--secondary"
                        type="button"
                        disabled={actionId === `${getMessageId(selectedMessage)}:mark-replied`}
                        onClick={() => runMessageAction(getMessageId(selectedMessage), "mark-replied", () => markMessageReplied(getMessageId(selectedMessage)))}
                      >
                        Mark replied
                      </button>
                      {getStatus(selectedMessage) === "archived" ? (
                        <button
                          className="button button--secondary"
                          type="button"
                          disabled={actionId === `${getMessageId(selectedMessage)}:restore`}
                          onClick={() => runMessageAction(getMessageId(selectedMessage), "restore", () => unarchiveMessage(getMessageId(selectedMessage)))}
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          className="button button--secondary"
                          type="button"
                          disabled={actionId === `${getMessageId(selectedMessage)}:archive`}
                          onClick={() => runMessageAction(getMessageId(selectedMessage), "archive", () => archiveMessage(getMessageId(selectedMessage)))}
                        >
                          Archive
                        </button>
                      )}
                      <button
                        className="button button--secondary"
                        type="button"
                        disabled={actionId === `${getMessageId(selectedMessage)}:toggle-priority`}
                        onClick={handleTogglePriority}
                      >
                        {getPriority(selectedMessage) === "high" ? "Normal priority" : "High priority"}
                      </button>
                      <button
                        className="button button--primary"
                        type="button"
                        disabled={actionId === `${getMessageId(selectedMessage)}:save-note`}
                        onClick={handleSaveNote}
                      >
                        Save note
                      </button>
                      <button className="button button--secondary" type="button" onClick={handleCopyEmail}>
                        Copy email
                      </button>
                      <a className="button button--secondary" href={`mailto:${selectedMessage.email || ""}`}>
                        Mailto reply
                      </a>
                      <button
                        className="button button--secondary"
                        type="button"
                        disabled={actionId === `${getMessageId(selectedMessage)}:delete`}
                        onClick={() => handleDelete(getMessageId(selectedMessage))}
                      >
                        Delete
                      </button>
                    </div>

                    {copyStatus && <p className="form-status">{copyStatus}</p>}
                  </>
                ) : (
                  <p>Select a message to read it.</p>
                )}
              </aside>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default AdminMessages
