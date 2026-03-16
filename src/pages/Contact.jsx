import { useState } from "react"
import { api } from "../services/api"

function Contact() {

  const [form, setForm] = useState({
    name: "",
    email: "",
    message: ""
  })

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    api.post("/messages", form)
      .then(() => {
        alert("Message sent")
      })
      .catch(err => {
        console.error(err)
      })
  }

  return (
    <div>
      <h2>Contact</h2>

      <form onSubmit={handleSubmit}>

        <input
          name="name"
          placeholder="Name"
          onChange={handleChange}
        />

        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
        />

        <textarea
          name="message"
          placeholder="Message"
          onChange={handleChange}
        />

        <button type="submit">
          Send
        </button>

      </form>

    </div>
  )
}

export default Contact