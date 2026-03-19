import { useState } from "react"
import { api } from "../services/api"

const initialForm = {
  name: "",
  email: "",
  message: "",
}

function Contact() {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState({ type: "", message: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm({
      ...form,
      [name]: value,
    })

    if (status.message) {
      setStatus({ type: "", message: "" })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus({ type: "error", message: "Fill in your name, email, and message." })
      return
    }

    setIsSubmitting(true)

    try {
      await api.post("/messages", {
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      })

      setForm(initialForm)
      setStatus({ type: "success", message: "Message sent successfully." })
    } catch (err) {
      setStatus({
        type: "error",
        message: err.response?.data?.message || "Message failed to send. Try again later.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="page-section">
      <div className="section-heading">
        <p className="section-label">Contact</p>
        <h2>Start a conversation</h2>
        <p className="lead-copy">
          Use the form below to send a message through the portfolio API.
        </p>
      </div>

      <form className="contact-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Name</span>
          <input
            type="text"
            name="name"
            placeholder="Your name"
            value={form.name}
            onChange={handleChange}
            autoComplete="name"
          />
        </label>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
          />
        </label>

        <label className="field">
          <span>Message</span>
          <textarea
            name="message"
            placeholder="Tell me what you want to build."
            value={form.message}
            onChange={handleChange}
            rows="6"
          />
        </label>

        {status.message ? (
          <p className={status.type === "error" ? "form-status is-error" : "form-status"}>
            {status.message}
          </p>
        ) : null}

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send message"}
        </button>
      </form>
    </section>
  )
}

export default Contact
