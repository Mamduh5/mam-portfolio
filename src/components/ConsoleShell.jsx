import { NavLink } from "react-router-dom"

const navItems = [
  { to: "/", label: "Home" },
  { to: "/profile", label: "Profile" },
  { to: "/projects", label: "Work" },
  { to: "/games", label: "Games" },
  { to: "/contact", label: "Contact" }
]

function ConsoleShell({ children }) {
  return (
    <div className="console-shell">
      <header className="console-topbar">
        <NavLink className="console-brand" to="/" aria-label="Mam Portfolio home">
          Mam
        </NavLink>

        <nav className="console-nav" aria-label="Portfolio navigation">
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

        <div className="console-status-pill" aria-label="Portfolio status" />
      </header>

      <main className="console-main">
        {children}
      </main>
    </div>
  )
}

export default ConsoleShell
