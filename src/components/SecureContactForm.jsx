import { useRef, useState } from "react"
import { api } from "../services/api"
import TurnstileWidget from "./TurnstileWidget"

const initialForm = {
  name: "",
  email: "",
  message: ""
}

function SecureContactForm() {
  const turnstileRef = useRef(null)
  const [form, setForm] = useState(initialForm)
  const [turnstileToken, setTurnstileToken] = useState("")
  const [status, setStatus] = useState("idle")
  const [error, setError] = useState("")

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus("submitting")
    setError("")

    try {
      await api.post("/messages", {
        ...form,
        ...(turnstileToken ? { turnstileToken } : {})
      })
      setStatus("sent")
      setForm(initialForm)
      setTurnstileToken("")
      turnstileRef.current?.reset()
    } catch (err) {
      console.error("contact submit failed", err.response?.status || err.message)
      const response = err.response?.data || {}
      setStatus("error")
      setTurnstileToken("")
      turnstileRef.current?.reset()
      setError(response.error === "turnstile_failed"
        ? response.message || "Verification failed. Please try again."
        : "Message failed. Keep your text and try again.")
    }
  }

  return (
    <form className="secure-form" onSubmit={handleSubmit}>
      <label>
        Name
        <input
          name="name"
          placeholder="Your name"
          value={form.name}
          onChange={handleChange}
          required
        />
      </label>
      <label>
        Email
        <input
          name="email"
          placeholder="Your email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
        />
      </label>
      <label>
        Message
        <textarea
          name="message"
          placeholder="Write your message..."
          value={form.message}
          onChange={handleChange}
          rows="5"
          required
        />
      </label>
      <TurnstileWidget action="contact-message" onToken={setTurnstileToken} ref={turnstileRef} />
      <button className="button button--primary" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending..." : "Send message"}
      </button>
      {status === "sent" && <p className="form-status form-status--success">Message sent.</p>}
      {status === "error" && <p className="form-status form-status--error">{error}</p>}
    </form>
  )
}

export default SecureContactForm
