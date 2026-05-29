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
      <aside className="console-rail" aria-label="Portfolio navigation">
        <div className="console-rail__brand">MAM</div>
        <nav>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `rail-link${isActive ? " rail-link--active" : ""}`}
              aria-label={item.label}
            >
              <span>{item.short}</span>
              <small>{item.label}</small>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="console-main">
        <header className="console-status" aria-label="Portfolio status">
          <span className="status-light" />
          <span>PUBLIC PORTFOLIO ONLINE</span>
          <span className="console-status__endpoint">visit hook active</span>
        </header>
        {children}
      </main>
    </div>
  )
}

export default ConsoleShell
