import RouteChip from "./RouteChip"

function ProjectMissionCard({ project, selected = false, onSelect }) {
  const projectType = project.type || project.projectType || project.project_type

  return (
    <article className={`mission-card${selected ? " mission-card--selected" : ""}`}>
      <div className="mission-card__topline">
        <RouteChip method="GET" path={projectType === "game" ? "/projects?type=game" : "/projects"} />
        {projectType && <span className="badge">{projectType}</span>}
      </div>
      <h3>{project.name}</h3>
      <p>{project.description || "No project description yet."}</p>
      {onSelect && (
        <button className="text-button" type="button" onClick={() => onSelect(project)}>
          View project
        </button>
      )}
    </article>
  )
}

export default ProjectMissionCard
