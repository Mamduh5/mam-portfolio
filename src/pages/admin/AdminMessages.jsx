import { useEffect, useState } from "react"
import { deleteMessage, fetchAdminMessages, markMessageRead } from "../../services/admin"

function AdminMessages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionId, setActionId] = useState("")

  const loadMessages = async () => {
    setLoading(true)
    setError("")

    try {
      const data = await fetchAdminMessages()
      setMessages(Array.isArray(data) ? data : [])
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

  const handleMarkRead = async (messageId) => {
    setActionId(messageId)
    setError("")

    try {
      const updated = await markMessageRead(messageId)
      setMessages(messages.map(message => message._id === messageId ? updated : message))
    } catch (err) {
      console.error(err)
      setError("Failed to mark message as read.")
    } finally {
      setActionId("")
    }
  }

  const handleDelete = async (messageId) => {
    setActionId(messageId)
    setError("")

    try {
      await deleteMessage(messageId)
      setMessages(messages.filter(message => message._id !== messageId))
    } catch (err) {
      console.error(err)
      setError("Failed to delete message.")
    } finally {
      setActionId("")
    }
  }

  return (
    <div className="page-stack">
      <section className="command-hero admin-hero">
        <span className="static-chip">Private inbox</span>
        <div className="command-hero__copy">
          <h1>Messages</h1>
          <p>Owner-only inbox for contact form submissions. Mark messages as read or remove stale entries.</p>
        </div>
        <div className="landing-summary">
          <div>
            <span>Total</span>
            <strong>{messages.length}</strong>
          </div>
          <div>
            <span>Unread</span>
            <strong>{messages.filter(message => !message.read).length}</strong>
          </div>
        </div>
      </section>

      {error && <p className="form-status form-status--error">{error}</p>}
      {loading && <div className="skeleton" />}

      {!loading && messages.length === 0 && (
        <article className="bento-card bento-card--quiet">
          <span className="card-kicker">Inbox clear</span>
          <h2>No messages yet</h2>
          <p>New contact form submissions will appear here.</p>
        </article>
      )}

      {!loading && messages.length > 0 && (
        <section className="admin-list" aria-label="Contact messages">
          {messages.map(message => (
            <article className={`admin-list-card${message.read ? "" : " admin-list-card--unread"}`} key={message._id}>
              <div className="admin-list-card__header">
                <div>
                  <span className="card-kicker">{message.read ? "Read" : "Unread"}</span>
                  <h2>{message.name || "Unknown sender"}</h2>
                  <p>{message.email || "No email"}</p>
                </div>
                <small>{message.createdAt ? new Date(message.createdAt).toLocaleString() : "No date"}</small>
              </div>
              <p>{message.message}</p>
              <div className="admin-actions">
                {!message.read && (
                  <button className="button button--secondary" type="button" disabled={actionId === message._id} onClick={() => handleMarkRead(message._id)}>
                    Mark as read
                  </button>
                )}
                <button className="button button--secondary" type="button" disabled={actionId === message._id} onClick={() => handleDelete(message._id)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  )
}

export default AdminMessages
