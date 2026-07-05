import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { fetchProjects } from "../services/projects"
import CommandHero from "../components/CommandHero"
import ProjectMissionCard from "../components/ProjectMissionCard"
import { getProjectId } from "../utils/projectMedia"

function Projects() {
  const [projects, setProjects] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await fetchProjects()
        const payload = Array.isArray(data) ? data : []
        setProjects(payload)
        setSelectedId(getProjectId(payload[0]) || null)
        setError(false)
      } catch (err) {
        console.error(err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  const selectedProject = useMemo(
    () => projects.find(project => getProjectId(project) === selectedId) || projects[0],
    [projects, selectedId]
  )

  if (loading) {
    return (
      <div className="page-stack">
        <div className="skeleton skeleton--hero" />
        <div className="bento-grid bento-grid--two">
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <CommandHero
        className="page-compact-hero"
        eyebrow={<span className="static-chip">Work catalog</span>}
        title="Work unavailable"
        description="Projects could not be loaded right now. Try again in a moment."
      />
    )
  }

  if (projects.length === 0) {
    return (
      <div className="empty-state-grid">
        <CommandHero
          className="page-compact-hero"
          eyebrow={<span className="static-chip">Work catalog</span>}
          title="Work archive"
          description="Projects will appear here after they are published from the dashboard."
        />
        <article className="empty-state-card">
          <span className="card-kicker">Coming next</span>
          <h2>No public projects yet</h2>
          <p>Published project cards will appear here once they are ready to share.</p>
          <div className="empty-state-list">
            <span>Projects and games</span>
            <span>Managed updates</span>
            <span>Images, demos, repos, and stack notes</span>
          </div>
        </article>
      </div>
    )
  }

  return (
    <div className="page-stack">
      <CommandHero
        className="page-compact-hero"
        eyebrow={<span className="static-chip">Work catalog</span>}
        title="Work archive"
        description="Featured portfolio work and selected builds."
        actions={selectedProject ? (
          <Link className="button button--secondary" to={`/projects/${getProjectId(selectedProject)}`}>
            View selected
          </Link>
        ) : null}
      >
        <div className="featured-project">
          <span className="card-kicker">Featured work</span>
          <h2>{selectedProject.name}</h2>
          <p>{selectedProject.description || "No project description yet."}</p>
        </div>
      </CommandHero>

      <section className="mission-grid" aria-label="Project cards">
        {projects.map(project => (
          <ProjectMissionCard
            key={project._id}
            project={project}
            selected={getProjectId(selectedProject) === getProjectId(project)}
            onSelect={(item) => setSelectedId(getProjectId(item))}
          />
        ))}
      </section>
    </div>
  )
}

export default Projects
