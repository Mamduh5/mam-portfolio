import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { getAdminUser, logout } from "../services/auth"

const adminItems = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/messages", label: "Messages" },
  { to: "/admin/projects", label: "Projects" },
  { to: "/admin/profile", label: "Profile" },
  { to: "/admin/uploads", label: "Uploads" }
]

function AdminShell() {
  const navigate = useNavigate()
  const admin = getAdminUser()

  const handleLogout = async () => {
    await logout()
    navigate("/login", { replace: true })
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar" aria-label="Owner dashboard navigation">
        <div>
          <span className="admin-kicker">Owner console</span>
          <h1>Mam Admin</h1>
          <p>{admin?.username ? `Signed in as ${admin.username}` : "Private dashboard"}</p>
        </div>

        <nav className="admin-nav">
          {adminItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-nav__link${isActive ? " admin-nav__link--active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button className="button button--secondary admin-logout" type="button" onClick={handleLogout}>
          Sign out
        </button>
      </aside>

      <main className="admin-main">
        <header className="console-status" aria-label="Admin status">
          <span className="status-light" />
          <span>OWNER SESSION ACTIVE</span>
          <span className="console-status__endpoint">private routes</span>
        </header>
        <Outlet />
      </main>
    </div>
  )
}

export default AdminShell
