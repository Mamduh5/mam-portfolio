import { Link } from "react-router-dom"
import { getAdminUser } from "../../services/auth"

const cards = [
  { title: "Messages", copy: "Review contact messages and remove stale entries.", to: "/admin/messages" },
  { title: "Projects", copy: "Manage public project and game records, including GitHub imports.", to: "/admin/projects" },
  { title: "Profile", copy: "Edit the public profile details shown to visitors.", to: "/admin/profile" },
  { title: "Uploads", copy: "Upload standalone images and manage project assets.", to: "/admin/uploads" },
  { title: "Focus", copy: "Track active work, parked projects, and weekly attention.", to: "/admin/focus" }
]

function AdminOverview() {
  const admin = getAdminUser()

  return (
    <div className="admin-desk">
      <section className="admin-page-bar">
        <div>
          <span className="card-kicker">Private workspace</span>
          <h1>Dashboard</h1>
          <p>Private workspace for portfolio management, project updates, uploads, messages, and profile details.</p>
        </div>
      </section>

      <section className="admin-metric-grid" aria-label="Workspace status">
        <article className="admin-panel">
          <span className="card-kicker">Session</span>
          <h2>{admin?.username ? admin.username : "Active"}</h2>
          <p>{admin?.username ? "Signed in admin user." : "Private dashboard session is active."}</p>
        </article>
        <article className="admin-panel">
          <span className="card-kicker">Admin tools</span>
          <h2>{cards.length}</h2>
          <p>Available workspace modules.</p>
        </article>
      </section>

      <section className="admin-compact-grid" aria-label="Admin dashboard areas">
        {cards.map(card => (
          <Link className="admin-panel admin-card-link" key={card.to} to={card.to}>
            <span className="card-kicker">Module</span>
            <h2>{card.title}</h2>
            <p>{card.copy}</p>
          </Link>
        ))}
      </section>
    </div>
  )
}

export default AdminOverview
