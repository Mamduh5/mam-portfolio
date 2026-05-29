import { useEffect, useState } from "react"
import { api } from "../services/api"
import CommandHero from "../components/CommandHero"
import RouteChip from "../components/RouteChip"

function Profile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    api.get("/profile")
      .then(res => {
        setProfile(res.data)
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
      <CommandHero
        className="page-compact-hero"
        eyebrow={<RouteChip method="GET" path="/profile" />}
        title="Profile unavailable"
        description="The profile endpoint did not respond. Try again after the API is online."
      />
    )
  }

  return (
    <div className="page-stack">
      <CommandHero
        eyebrow={<RouteChip method="GET" path="/profile" />}
        title={profile.name || "Mam"}
        description={profile.title || profile.introduction || "Full-stack developer"}
      />

      <section className="profile-grid" aria-label="Profile information">
        <article className="profile-panel">
          <span className="card-kicker">About</span>
          <h2>Builder profile</h2>
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
