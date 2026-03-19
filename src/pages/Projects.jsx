import ProjectList from "../components/ProjectList"
import { useApiData } from "../hooks/useApiData"

function Projects() {
  const { data: projects = [], isLoading, error } = useApiData("/projects", [])

  if (isLoading) {
    return <div className="status-panel">Loading projects...</div>
  }

  if (error) {
    return <div className="status-panel is-error">{error}</div>
  }

  return (
    <ProjectList
      title="Projects"
      items={projects}
      emptyMessage="No projects have been added yet."
    />
  )
}

export default Projects
