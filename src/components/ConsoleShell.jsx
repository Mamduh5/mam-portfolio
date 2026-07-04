import { NavLink } from "react-router-dom"

const navItems = [
  { to: "/", label: "Cover" },
  { to: "/profile", label: "Author" },
  { to: "/projects", label: "Chapters" },
  { to: "/games", label: "Playbook" },
  { to: "/contact", label: "Letter" }
]

function ConsoleShell({ children }) {
  return (
    <div className="console-shell">
      <header className="console-topbar">
        <NavLink className="console-brand" to="/" aria-label="Mam Portfolio home">
          MAM
        </NavLink>

        <nav className="console-nav" aria-label="Portfolio table of contents">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `console-nav__link${isActive ? " console-nav__link--active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="console-status-pill" aria-label="Portfolio status">
          <span className="status-light" />
          <span>Public handbook</span>
        </div>
      </header>

      <main className="console-main">
        {children}
      </main>
    </div>
  )
}

export default ConsoleShell
