import { Link } from "react-router-dom"
import CommandHero from "../components/CommandHero"

const skills = [
  "React interfaces",
  "Express APIs",
  "MongoDB data models",
  "Portfolio systems",
  "Game experiments",
  "Deployment workflows"
]

function Home() {
  return (
    <div className="page-stack">
      <CommandHero
        eyebrow={<span className="static-chip">Static landing / no API</span>}
        title="Mam Portfolio"
        description="Full-stack builder focused on clean React frontends, Express backends, practical game projects, and deployable portfolio systems."
        actions={(
          <>
            <Link className="button button--primary" to="/projects">View Projects</Link>
            <Link className="button button--secondary" to="/contact">Contact</Link>
          </>
        )}
      >
        <div className="landing-summary">
          <div>
            <span>Primary stack</span>
            <strong>React + Express + MongoDB</strong>
          </div>
          <div>
            <span>Build mode</span>
            <strong>Clean UI, working API, deploy-ready</strong>
          </div>
        </div>
      </CommandHero>

      <section className="bento-grid bento-grid--three" aria-label="Skills and info">
        <article className="bento-card">
          <span className="card-kicker">Skill signal</span>
          <h2>Frontend craft</h2>
          <p>Cyber-console UI, route structure, reusable components, loading states, and public-first presentation.</p>
        </article>
        <article className="bento-card">
          <span className="card-kicker">Backend logic</span>
          <h2>API systems</h2>
          <p>Express endpoints, MongoDB repositories, authentication planning, file upload flows, and admin-only surfaces.</p>
        </article>
        <article className="bento-card bento-card--quiet">
          <span className="card-kicker">No data dependency</span>
          <h2>Landing stays fast</h2>
          <p>This page is static and does not depend on profile or project API availability.</p>
        </article>
      </section>

      <section className="skill-cluster" aria-label="Technology skills">
        {skills.map(skill => (
          <span key={skill}>{skill}</span>
        ))}
      </section>
    </div>
  )
}

export default Home
