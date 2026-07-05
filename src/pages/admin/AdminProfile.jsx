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
    <div className="admin-desk">
      <section className="admin-page-bar">
        <div>
          <span className="card-kicker">Public profile</span>
          <h1>Profile</h1>
          <p>Edit the profile details shown to visitors.</p>
        </div>
        <div className="admin-actions">
          <button className="button button--primary" type="submit" form="admin-profile-form" disabled={saving || loading}>
            {saving ? "Saving..." : "Save profile"}
          </button>
        </div>
      </section>

      {loading && <div className="skeleton" />}

      {!loading && (
        <section className="admin-workbench admin-workbench--profile">
          <form id="admin-profile-form" className="secure-form admin-panel admin-profile-form" onSubmit={handleSubmit}>
            <div className="admin-inspector__header">
              <div>
                <span className="card-kicker">Editor</span>
                <h2>Profile fields</h2>
              </div>
              <button className="button button--primary" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save profile"}
              </button>
            </div>
            <fieldset>
              <legend>Identity</legend>
              <div className="admin-form-pair">
                <label>
                  Name
                  <input name="name" value={form.name} onChange={handleChange} required />
                </label>
                <label>
                  Title
                  <input name="title" value={form.title} onChange={handleChange} />
                </label>
              </div>
              <label>
                Bio / introduction
                <textarea name="bio" value={form.bio} onChange={handleChange} rows="5" />
              </label>
            </fieldset>
            <fieldset>
              <legend>Contact</legend>
              <div className="admin-form-pair">
                <label>
                  Email
                  <input name="email" type="email" value={form.email} onChange={handleChange} />
                </label>
                <label>
                  GitHub
                  <input name="github" value={form.github} onChange={handleChange} />
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
              </div>
            </fieldset>
            <fieldset>
              <legend>Media</legend>
              <label>
                Avatar URL
                <input name="avatarUrl" value={form.avatarUrl} onChange={handleChange} />
              </label>
            </fieldset>
            {error && <p className="form-status form-status--error">{error}</p>}
            {success && <p className="form-status form-status--success">{success}</p>}
          </form>

          <aside className="admin-panel admin-inspector">
            <span className="card-kicker">Preview</span>
            {form.avatarUrl && <img className="profile-preview-image" src={form.avatarUrl} alt={form.name || "Profile preview"} />}
            <h2>{form.name || "Mam"}</h2>
            <p>{form.title || "Title not set"}</p>
            <div className="ruled-rows">
              <div><span>Email</span><strong>{form.email || "Not published"}</strong></div>
              <div><span>GitHub</span><strong>{form.github || "Not published"}</strong></div>
              <div><span>Contact</span><strong>{form.phone || form.line || form.facebook || "Contact page"}</strong></div>
            </div>
          </aside>
        </section>
      )}
    </div>
  )
}

export default AdminProfile
