import { NavLink } from "react-router-dom"

const navItems = [
  { to: "/", label: "Home", short: "H" },
  { to: "/projects", label: "Work", short: "W" },
  { to: "/games", label: "Games", short: "G" },
  { to: "/contact", label: "Link", short: "L" }
]

function ConsoleShell({ children }) {
  return (
    <div className="console-shell">
      <header className="console-topbar">
        <NavLink className="console-brand" to="/" aria-label="Mam Portfolio home">
          MAM
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

        <div className="console-status-pill" aria-label="Portfolio status">
          <span className="status-light" />
          <span>PUBLIC PORTFOLIO ONLINE</span>
        </div>
      </header>

      <main className="console-main">
        {children}
      </main>
    </div>
  )
}

export default ConsoleShell
