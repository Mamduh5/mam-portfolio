import { Link } from "react-router-dom"
import { getAdminUser } from "../../services/auth"

const cards = [
  { title: "Messages", copy: "Review contact messages and remove stale entries.", to: "/admin/messages" },
  { title: "Projects", copy: "Manage public project and game records, including GitHub imports.", to: "/admin/projects" },
  { title: "Profile", copy: "Plan owner-only profile edits while keeping public reads available.", to: "/admin/profile" },
  { title: "Uploads", copy: "Upload standalone images and manage project assets.", to: "/admin/uploads" },
  { title: "Focus", copy: "Track active work, parked projects, and weekly attention without changing public portfolio routes.", to: "/admin/focus" }
]

function AdminOverview() {
  const admin = getAdminUser()

  return (
    <div className="page-stack">
      <section className="command-hero admin-hero">
        <span className="static-chip">Protected /auth/me verified</span>
        <div className="command-hero__copy">
          <h1>Owner dashboard</h1>
          <p>Private workspace for portfolio management, project updates, uploads, messages, and profile details.</p>
        </div>
        <div className="landing-summary">
          <div>
            <span>Auth status</span>
            <strong>{admin?.username ? `Signed in as ${admin.username}` : "Session active"}</strong>
          </div>
          <div>
            <span>Admin tools</span>
            <strong>Projects, uploads, messages, profile, focus</strong>
          </div>
        </div>
      </section>

      <section className="bento-grid bento-grid--two" aria-label="Admin dashboard areas">
        {cards.map(card => (
          <Link className="bento-card admin-card-link" key={card.to} to={card.to}>
            <span className="card-kicker">Owner module</span>
            <h2>{card.title}</h2>
            <p>{card.copy}</p>
          </Link>
        ))}
      </section>
    </div>
  )
}

export default AdminOverview
