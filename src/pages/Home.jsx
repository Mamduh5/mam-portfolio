import { useApiData } from "../hooks/useApiData"

function Home() {
  const { data: profile, isLoading, error } = useApiData("/profile", null)

  if (isLoading) {
    return <div className="status-panel">Loading profile...</div>
  }

  if (error) {
    return <div className="status-panel is-error">{error}</div>
  }

  if (!profile) {
    return <div className="status-panel">No profile data found.</div>
  }

  return (
    <section className="page-section">
      <div className="section-heading">
        <p className="section-label">Profile</p>
        <h2>{profile.name}</h2>
        <p className="lead-copy">{profile.title}</p>
      </div>

      <div className="info-grid">
        <article className="info-card">
          <p className="info-label">Email</p>
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </article>

        <article className="info-card">
          <p className="info-label">GitHub</p>
          <a href={profile.github} target="_blank" rel="noreferrer">
            {profile.github}
          </a>
        </article>
      </div>
    </section>
  )
}

export default Home
