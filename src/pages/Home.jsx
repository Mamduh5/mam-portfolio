import { Link } from "react-router-dom"
import CommandHero from "../components/CommandHero"

const skills = [
  "React interfaces",
  "Express APIs",
  "MongoDB models",
  "Portfolio systems",
  "Game experiments",
  "Deployment notes"
]

function Home() {
  return (
    <div className="landing-page">
      <section className="landing-hero-grid">
        <CommandHero
          eyebrow={<span className="static-chip">Cover page / no API</span>}
          title="Mam Portfolio"
          description="A black-and-white handbook of practical builds, backend notes, frontend craft, game experiments, and deployment work. Read it like a working notebook, not a project wall."
          actions={(
            <>
              <Link className="button button--primary" to="/projects">Read Chapters</Link>
              <Link className="button button--secondary" to="/contact">Write a Note</Link>
            </>
          )}
        >
          <div className="landing-summary">
            <div>
              <span>Main stack</span>
              <strong>React + Express + MongoDB</strong>
            </div>
            <div>
              <span>Book format</span>
              <strong>Short chapters, proof of work, clear routes</strong>
            </div>
          </div>
        </CommandHero>

        <aside className="landing-status-stack" aria-label="Portfolio capability summary">
          <article className="landing-side-card landing-side-card--feature">
            <span className="card-kicker">Chapter one</span>
            <h2>Frontend craft</h2>
            <p>Readable interfaces, route structure, reusable components, responsive states, and public-first presentation.</p>
          </article>
          <article className="landing-side-card">
            <span className="card-kicker">Chapter two</span>
            <h2>Backend logic</h2>
            <p>Express endpoints, MongoDB repositories, auth, uploads, admin-only tools, and deployment workflows.</p>
          </article>
        </aside>
      </section>

      <section className="landing-lower-grid" aria-label="Landing support information">
        <div className="skill-cluster" aria-label="Technology skills">
          {skills.map(skill => (
            <span key={skill}>{skill}</span>
          ))}
        </div>

        <article className="landing-side-card landing-side-card--quiet">
          <span className="card-kicker">No data dependency</span>
          <h2>Fast cover page</h2>
          <p>The cover stays static, so the portfolio can open cleanly even when API pages are offline.</p>
        </article>
      </section>
    </div>
  )
}

export default Home
