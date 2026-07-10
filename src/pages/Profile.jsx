import { useEffect, useState } from "react"
import { api } from "../services/api"
import PublicHero from "../components/PublicHero"
import { getProfileAvatarUrl } from "../utils/projectMedia"

function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)

  useEffect(() => {
    api.get("/profile")
      .then(res => {
        setProfile(res.data)
        setAvatarFailed(false)
        setError(false)
      })
      .catch(err => {
        console.error(err)
        setError(true)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="skeleton skeleton--hero" />
  }

  if (error || !profile) {
    return (
      <PublicHero
        className="page-compact-hero"
        eyebrow={<span className="static-chip">Profile</span>}
        title="Profile unavailable"
        description="Profile details could not be loaded right now. Try again in a moment."
      />
    )
  }

  const avatarUrl = getProfileAvatarUrl(profile)

  return (
    <div className="page-stack">
      <PublicHero
        eyebrow={<span className="static-chip">Profile</span>}
        title={profile.name || "Mam"}
        description={profile.title || profile.introduction || "Full-stack developer"}
      />

      <section className="profile-grid" aria-label="Profile information">
        <article className="profile-panel">
          <span className="card-kicker">About</span>
          {avatarUrl && !avatarFailed && (
            <img
              className="profile-avatar"
              src={avatarUrl}
              alt={profile.name ? `${profile.name} profile` : "Profile"}
              onError={() => setAvatarFailed(true)}
            />
          )}
          <p>{profile.introduction || "Public profile details will appear here after they are added in the admin dashboard."}</p>
        </article>

        <aside className="profile-meta">
          <div>
            <span>Email</span>
            <p>{profile.email || "Not published"}</p>
          </div>
          <div>
            <span>GitHub</span>
            <p>{profile.github || "Not published"}</p>
          </div>
          <div>
            <span>Contact</span>
            <p>{profile.phone || profile.line || profile.facebook || "Use the contact page"}</p>
          </div>
        </aside>
      </section>
    </div>
  )
}

export default Profile
