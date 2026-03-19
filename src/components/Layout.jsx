import { NavLink, Outlet } from "react-router-dom"

const navItems = [
  { to: "/", label: "Home", end: true },
  { to: "/projects", label: "Projects" },
  { to: "/games", label: "Games" },
  { to: "/contact", label: "Contact" },
]

function Layout() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="eyebrow">Frontend Developer | Game Developer</div>
        <div className="hero-copy">
          <p className="hero-kicker">Mam Portfolio</p>
          <h1>Building clean interfaces and playful interactive work.</h1>
          <p className="hero-summary">
            This portfolio pulls profile and project data from an API and presents it in a
            lighter, more structured shell.
          </p>
        </div>

        <nav className="site-nav" aria-label="Primary navigation">
          {navItems.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => (isActive ? "nav-link is-active" : "nav-link")}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="page-main">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
