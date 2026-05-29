import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../services/api"
import CommandHero from "../components/CommandHero"
import RouteChip from "../components/RouteChip"

function Home() {
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
    return (
      <div className="page-stack">
        <div className="skeleton skeleton--hero" />
        <div className="bento-grid bento-grid--two">
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <CommandHero
        eyebrow={<RouteChip method="GET" path="/profile" />}
        title="Profile signal unavailable"
        description="The portfolio shell is online, but the profile endpoint did not respond. Check the API connection and retry."
      />
    )
  }

  return (
    <div className="page-stack">
      <CommandHero
        eyebrow={<RouteChip method="GET" path="/profile" />}
        title={profile.name || "Mam Portfolio"}
        description={profile.title || "Full-stack builder"}
        actions={(
          <>
            <Link className="button button--primary" to="/projects">View Projects</Link>
            {profile.github && (
              <a className="button button--secondary" href={profile.github} target="_blank" rel="noreferrer">
                Open GitHub
              </a>
            )}
          </>
        )}
      >
        <div className="identity-grid">
          <div>
            <span>Email</span>
            <strong>{profile.email || "Not published"}</strong>
          </div>
          <div>
            <span>Stack signal</span>
            <strong>React + Express</strong>
          </div>
        </div>
      </CommandHero>

      <section className="bento-grid bento-grid--three" aria-label="Profile support cards">
        <article className="bento-card">
          <span className="card-kicker">Current signal</span>
          <h2>Available for build work</h2>
          <p>Public portfolio stays focused on identity, routes, and project proof.</p>
        </article>
        <article className="bento-card">
          <span className="card-kicker">Route map</span>
          <h2>Projects / Games / Contact</h2>
          <p>Each page uses one dominant command panel with quieter supporting cards.</p>
        </article>
        <article className="bento-card bento-card--quiet">
          <span className="card-kicker">Telemetry</span>
          <h2>Visit hook active</h2>
          <p>Admin signals stay secondary so the public experience remains clean.</p>
        </article>
      </section>
    </div>
  )
}

export default Home
