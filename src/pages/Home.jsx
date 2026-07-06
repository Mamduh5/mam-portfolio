import { Link } from "react-router-dom"
import PublicHero from "../components/PublicHero"

const skills = [
  "React interfaces",
  "Node services",
  "MongoDB data models",
  "Portfolio systems",
  "Game experiments",
  "Deployment workflows"
]

function Home() {
  return (
    <div className="landing-page">
      <section className="landing-hero-grid">
        <PublicHero
          eyebrow={<span className="static-chip">Developer portfolio</span>}
          title="Hi, I'm Mam."
          description="Full-stack builder focused on clean React frontends, Node services, practical game projects, and deployable portfolio systems."
          actions={(
            <>
              <Link className="button button--primary" to="/projects">View work</Link>
              <Link className="button button--secondary" to="/contact">Get in touch</Link>
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
              <strong>Clean UI, reliable data, deploy-ready</strong>
            </div>
          </div>
        </PublicHero>

        <aside className="landing-status-stack" aria-label="Portfolio capability summary">
          <article className="landing-side-card landing-side-card--feature">
            <span className="card-kicker">Frontend craft</span>
            <h2>Frontend craft</h2>
            <p>React page structure, reusable components, responsive states, and public-first presentation.</p>
          </article>
          <article className="landing-side-card">
            <span className="card-kicker">Server-side logic</span>
            <h2>Service systems</h2>
            <p>Express services, MongoDB repositories, auth, uploads, admin tools, and deployment workflows.</p>
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
          <span className="card-kicker">Fast first page</span>
          <h2>Landing stays fast</h2>
          <p>This page stays lightweight and does not depend on project data being available.</p>
        </article>
      </section>
    </div>
  )
}

export default Home
