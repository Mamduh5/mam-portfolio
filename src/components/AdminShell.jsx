import { useEffect, useState } from "react"
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import { getAdminUser, logout } from "../services/auth"

const adminItems = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/messages", label: "Messages" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/security", label: "Security" },
  { to: "/admin/projects", label: "Projects" },
  { to: "/admin/profile", label: "Profile" },
  { to: "/admin/uploads", label: "Uploads" },
  { to: "/admin/focus", label: "Focus" }
]

function AdminShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const admin = getAdminUser()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const currentSection = adminItems.find(item => (
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  ))?.label || "Admin"

  const handleLogout = async () => {
    await logout()
    setDrawerOpen(false)
    navigate("/login", { replace: true })
  }

  useEffect(() => {
    if (!drawerOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setDrawerOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [drawerOpen])

  return (
    <div className={`admin-shell${drawerOpen ? " admin-shell--drawer-open" : ""}`}>
      <header className="console-status admin-session-bar" aria-label="Admin status">
        <span className="status-light" />
        <span>Session active</span>
        <span className="console-status__scope">Private workspace</span>
      </header>

      <header className="admin-mobile-bar">
        <button
          className="button button--secondary admin-menu-button"
          type="button"
          aria-controls="admin-navigation"
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen(true)}
        >
          Menu
        </button>
        <div>
          <span className="admin-kicker">Admin</span>
          <strong>{currentSection}</strong>
        </div>
      </header>

      <button
        className="admin-drawer-overlay"
        type="button"
        aria-label="Close admin navigation"
        tabIndex={drawerOpen ? 0 : -1}
        onClick={() => setDrawerOpen(false)}
      />

      <aside id="admin-navigation" className="admin-sidebar" aria-label="Admin navigation">
        <div>
          <span className="admin-kicker">Workspace</span>
          <h1>Admin</h1>
          <p>{admin?.username ? `Signed in as ${admin.username}` : "Private dashboard"}</p>
        </div>

        <nav className="admin-nav">
          {adminItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-nav__link${isActive ? " admin-nav__link--active" : ""}`}
              onClick={() => setDrawerOpen(false)}
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
        <Outlet />
      </main>
    </div>
  )
}

export default AdminShell
