import { useEffect, useMemo, useState } from "react"
import { api } from "../services/api"
import CommandHero from "../components/CommandHero"
import ProjectMissionCard from "../components/ProjectMissionCard"
import RouteChip from "../components/RouteChip"

function Projects() {
  const [projects, setProjects] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get("/projects")
        const payload = Array.isArray(res.data) ? res.data : []
        setProjects(payload)
        setSelectedId(payload[0]?._id || null)
        setError(false)
      } catch (err) {
        console.error(err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  const selectedProject = useMemo(
    () => projects.find(project => project._id === selectedId) || projects[0],
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
        eyebrow={<RouteChip method="GET" path="/projects" />}
        title="Mission archive unavailable"
        description="The project endpoint did not respond. Keep the UI shell stable and retry when the API is online."
      />
    )
  }

  if (projects.length === 0) {
    return (
      <CommandHero
        eyebrow={<RouteChip method="GET" path="/projects" />}
        title="Work archive"
        description="Add your first project to activate the mission board."
      />
    )
  }

  return (
    <div className="page-stack">
      <CommandHero
        eyebrow={<RouteChip method="GET" path="/projects" />}
        title="Work archive"
        description="Featured mission board for selected portfolio builds."
        actions={<button className="button button--secondary" type="button">Inspect</button>}
      >
        <div className="featured-project">
          <span className="card-kicker">Featured mission</span>
          <h2>{selectedProject.name}</h2>
          <p>{selectedProject.description || "No mission briefing yet."}</p>
        </div>
      </CommandHero>

      <section className="mission-grid" aria-label="Project missions">
        {projects.map(project => (
          <ProjectMissionCard
            key={project._id}
            project={project}
            selected={selectedProject?._id === project._id}
            onSelect={(item) => setSelectedId(item._id)}
          />
        ))}
      </section>
    </div>
  )
}

export default Projects
