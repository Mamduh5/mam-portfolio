import { useEffect, useState } from "react"
import { fetchProfile, updateProfile } from "../../services/admin"

const emptyProfile = {
  name: "",
  title: "",
  email: "",
  github: "",
  bio: "",
  avatarUrl: "",
  phone: "",
  line: "",
  facebook: ""
}

const toForm = (profile = {}) => ({
  name: profile.name || "",
  title: profile.title || "",
  email: profile.email || "",
  github: profile.github || "",
  bio: profile.bio || profile.introduction || "",
  avatarUrl: profile.avatarUrl || profile.avatar_url || "",
  phone: profile.phone || "",
  line: profile.line || "",
  facebook: profile.facebook || ""
})

const toPayload = (form) => ({
  name: form.name.trim(),
  title: form.title.trim(),
  email: form.email.trim(),
  github: form.github.trim(),
  bio: form.bio.trim(),
  avatarUrl: form.avatarUrl.trim(),
  phone: form.phone.trim(),
  line: form.line.trim(),
  facebook: form.facebook.trim()
})

function AdminProfile() {
  const [form, setForm] = useState(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      setError("")

      try {
        const profile = await fetchProfile()
        setForm(toForm(profile || {}))
      } catch (err) {
        console.error(err)
        setError("Failed to load profile.")
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const updated = await updateProfile(toPayload(form))
      setForm(toForm(updated))
      setSuccess("Profile updated.")
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || "Failed to update profile.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-stack">
      <section className="command-hero admin-hero">
        <span className="static-chip">Public profile</span>
        <div className="command-hero__copy">
          <h1>Profile</h1>
          <p>Edit the profile details shown to visitors.</p>
        </div>
      </section>

      {loading && <div className="skeleton" />}

      {!loading && (
        <form className="secure-form admin-panel admin-profile-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            Title
            <input name="title" value={form.title} onChange={handleChange} />
          </label>
          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={handleChange} />
          </label>
          <label>
            GitHub
            <input name="github" value={form.github} onChange={handleChange} />
          </label>
          <label>
            Avatar URL
            <input name="avatarUrl" value={form.avatarUrl} onChange={handleChange} />
          </label>
          <label>
            Phone
            <input name="phone" value={form.phone} onChange={handleChange} />
          </label>
          <label>
            LINE
            <input name="line" value={form.line} onChange={handleChange} />
          </label>
          <label>
            Facebook
            <input name="facebook" value={form.facebook} onChange={handleChange} />
          </label>
          <label className="admin-form-full">
            Bio / introduction
            <textarea name="bio" value={form.bio} onChange={handleChange} rows="5" />
          </label>
          <div className="admin-actions admin-form-full">
            <button className="button button--primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
          {error && <p className="form-status form-status--error admin-form-full">{error}</p>}
          {success && <p className="form-status form-status--success admin-form-full">{success}</p>}
        </form>
      )}
    </div>
  )
}

export default AdminProfile
