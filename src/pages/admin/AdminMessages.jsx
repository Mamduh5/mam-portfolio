import { useEffect, useState } from "react"
import { deleteMessage, fetchAdminMessages, markMessageRead } from "../../services/admin"

function AdminMessages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionId, setActionId] = useState("")
  const [selectedMessageId, setSelectedMessageId] = useState("")

  const loadMessages = async () => {
    setLoading(true)
    setError("")

    try {
      const data = await fetchAdminMessages()
      const nextMessages = Array.isArray(data) ? data : []
      setMessages(nextMessages)
      setSelectedMessageId(current => current || nextMessages[0]?._id || "")
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
      const nextMessages = messages.filter(message => message._id !== messageId)
      setMessages(nextMessages)
      if (selectedMessageId === messageId) {
        setSelectedMessageId(nextMessages[0]?._id || "")
      }
    } catch (err) {
      console.error(err)
      setError("Failed to delete message.")
    } finally {
      setActionId("")
    }
  }

  const selectedMessage = messages.find(message => message._id === selectedMessageId) || null

  return (
    <div className="admin-desk">
      <section className="admin-page-bar">
        <div>
          <span className="card-kicker">Private inbox</span>
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
        <section className="admin-workbench admin-workbench--messages" aria-label="Contact messages">
          <div className="admin-main-pane">
            {messages.map(message => (
              <button
                className={`admin-ruled-row admin-message-row${message.read ? "" : " admin-list-card--unread"}${selectedMessageId === message._id ? " admin-ruled-row--selected" : ""}`}
                type="button"
                key={message._id}
                onClick={() => setSelectedMessageId(message._id)}
              >
                <div>
                  <span className="card-kicker">{message.read ? "Read" : "Unread"}</span>
                  <h2>{message.name || "Unknown sender"}</h2>
                  <p>{message.email || "No email"}</p>
                </div>
                <small>{message.createdAt ? new Date(message.createdAt).toLocaleString() : "No date"}</small>
              </button>
            ))}
          </div>

          <aside className="admin-panel admin-inspector">
            {selectedMessage ? (
              <>
                <div className="admin-inspector__header">
                  <div>
                    <span className="card-kicker">{selectedMessage.read ? "Read" : "Unread"}</span>
                    <h2>{selectedMessage.name || "Unknown sender"}</h2>
                    <p>{selectedMessage.email || "No email"}</p>
                  </div>
                  <small>{selectedMessage.createdAt ? new Date(selectedMessage.createdAt).toLocaleString() : "No date"}</small>
                </div>
                <div className="message-detail-paper">
                  <p>{selectedMessage.message}</p>
                </div>
                <div className="admin-actions">
                  {!selectedMessage.read && (
                    <button className="button button--secondary" type="button" disabled={actionId === selectedMessage._id} onClick={() => handleMarkRead(selectedMessage._id)}>
                      Mark as read
                    </button>
                  )}
                  <a className="button button--secondary" href={`mailto:${selectedMessage.email || ""}`}>
                    Reply
                  </a>
                  <button className="button button--secondary" type="button" disabled={actionId === selectedMessage._id} onClick={() => handleDelete(selectedMessage._id)}>
                    Delete
                  </button>
                </div>
              </>
            ) : (
              <p>Select a message to read it.</p>
            )}
          </aside>
        </section>
      )}
    </div>
  )
}

export default AdminMessages
