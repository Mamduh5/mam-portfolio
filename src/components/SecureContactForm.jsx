import { useState } from "react"
import { api } from "../services/api"
import RouteChip from "./RouteChip"

const initialForm = {
  name: "",
  email: "",
  message: ""
}

function SecureContactForm() {
  const [form, setForm] = useState(initialForm)
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
      await api.post("/messages", form)
      setStatus("sent")
      setForm(initialForm)
    } catch (err) {
      console.error(err)
      setStatus("error")
      setError("Signal failed — keep form data and retry.")
    }
  }

  return (
    <form className="secure-form" onSubmit={handleSubmit}>
      <RouteChip method="POST" path="/messages" />
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
          placeholder="you@example.com"
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
          placeholder="Send a mission brief..."
          value={form.message}
          onChange={handleChange}
          rows="5"
          required
        />
      </label>
      <button className="button button--primary" type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Transmitting..." : "Transmit"}
      </button>
      {status === "sent" && <p className="form-status form-status--success">Transmission sent.</p>}
      {status === "error" && <p className="form-status form-status--error">{error}</p>}
    </form>
  )
}

export default SecureContactForm
