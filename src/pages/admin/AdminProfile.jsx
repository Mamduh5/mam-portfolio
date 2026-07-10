import { useEffect, useState } from "react"
import { fetchProfile, updateProfile, uploadImage } from "../../services/admin"
import { getProfileAvatarUrl, getUploadResultUrl } from "../../utils/projectMedia"

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
  avatarUrl: getProfileAvatarUrl(profile),
  phone: profile.phone || "",
  line: profile.line || "",
  facebook: profile.facebook || ""
})

const toPayload = (form) => {
  const avatarUrl = form.avatarUrl.trim()

  return {
    name: form.name.trim(),
    title: form.title.trim(),
    email: form.email.trim(),
    github: form.github.trim(),
    bio: form.bio.trim(),
    introduction: form.bio.trim(),
    avatarUrl,
    avatar_url: avatarUrl,
    imageUrl: avatarUrl,
    image_url: avatarUrl,
    phone: form.phone.trim(),
    line: form.line.trim(),
    facebook: form.facebook.trim()
  }
}

const isValidImageUrl = (value) => {
  const trimmed = value.trim()
  if (!trimmed) return true

  try {
    const url = new URL(trimmed, globalThis.location?.origin || "http://localhost")
    return ["http:", "https:"].includes(url.protocol) || trimmed.startsWith("/")
  } catch {
    return false
  }
}

function AdminProfile() {
  const [form, setForm] = useState(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState("")
  const [avatarImageFailed, setAvatarImageFailed] = useState(false)
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
    const { name, value } = event.target

    setForm({
      ...form,
      [name]: value
    })

    if (name === "avatarUrl") {
      setAvatarImageFailed(false)
      setAvatarError(value.trim() && !isValidImageUrl(value)
        ? "Enter a valid http(s) image URL or a site-relative image path."
        : "")
    }
  }

  const handleAvatarUpload = async () => {
    setAvatarError("")
    setError("")
    setSuccess("")

    if (!avatarFile) {
      setAvatarError("Choose an image file before uploading.")
      return
    }

    setAvatarUploading(true)

    try {
      const result = await uploadImage(avatarFile, {
        entityType: "profile",
        assetRole: "avatar",
        altText: form.name ? `${form.name} profile image` : "Profile image"
      })
      const avatarUrl = getUploadResultUrl(result)

      if (!avatarUrl) {
        setAvatarError("Upload completed, but the response did not include a reusable public image URL.")
        return
      }

      setForm(current => ({
        ...current,
        avatarUrl
      }))
      setAvatarImageFailed(false)
      setSuccess("Profile image uploaded. Save profile to publish it.")
    } catch (err) {
      console.error(err)
      setAvatarError(err.response?.data?.error || "Failed to upload profile image.")
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")

    if (!isValidImageUrl(form.avatarUrl)) {
      setSaving(false)
      setAvatarError("Enter a valid http(s) image URL or a site-relative image path.")
      return
    }

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
                Upload avatar image
                <input type="file" accept="image/*" onChange={(event) => setAvatarFile(event.target.files?.[0] || null)} />
              </label>
              <div className="admin-profile-media-actions">
                <button className="button button--secondary" type="button" onClick={handleAvatarUpload} disabled={avatarUploading}>
                  {avatarUploading ? "Uploading..." : "Upload avatar"}
                </button>
              </div>
              <label>
                Avatar URL
                <input name="avatarUrl" value={form.avatarUrl} onChange={handleChange} />
              </label>
              {avatarError && <p className="form-status form-status--error">{avatarError}</p>}
            </fieldset>
            {error && <p className="form-status form-status--error">{error}</p>}
            {success && <p className="form-status form-status--success">{success}</p>}
          </form>

          <aside className="admin-panel admin-inspector">
            <span className="card-kicker">Preview</span>
            {form.avatarUrl && !avatarImageFailed && !avatarError && (
              <img
                className="admin-profile-preview-image"
                src={form.avatarUrl}
                alt={form.name || "Profile preview"}
                onLoad={() => setAvatarImageFailed(false)}
                onError={() => setAvatarImageFailed(true)}
              />
            )}
            {avatarImageFailed && <p className="form-status form-status--error">The profile image URL could not be loaded.</p>}
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
