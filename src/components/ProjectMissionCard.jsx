function ProjectMissionCard({ project, selected = false, onSelect }) {
  const projectType = project.type || project.projectType || project.project_type
  const typeLabel = projectType === "game" ? "Game" : "Project"

  return (
    <article className={`mission-card${selected ? " mission-card--selected" : ""}`}>
      <div className="mission-card__topline">
        <span className="static-chip">{typeLabel}</span>
        {project.featured && <span className="badge">Featured</span>}
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
