import { Link } from "react-router-dom"
import { useState } from "react"
import { getPreviewAlt, getPreviewImage, getProjectId, getProjectType } from "../utils/projectMedia"

function ProjectMissionCard({ project, selected = false, onSelect }) {
  const [imageFailed, setImageFailed] = useState(false)
  const projectType = getProjectType(project)
  const typeLabel = projectType === "game" ? "Game" : "Project"
  const projectId = getProjectId(project)
  const previewImage = getPreviewImage(project)
  const detailPath = projectType === "game" ? `/games/${projectId}` : `/projects/${projectId}`
  const actionLabel = projectType === "game" ? "View game" : "View project"

  return (
    <article className={`mission-card${selected ? " mission-card--selected" : ""}`}>
      <div className="mission-card__media">
        {previewImage && !imageFailed ? (
          <img src={previewImage} alt={getPreviewAlt(project)} onError={() => setImageFailed(true)} />
        ) : (
          <div className="paper-image-placeholder" aria-label={`${project.name || typeLabel} preview placeholder`}>
            <span>{typeLabel}</span>
          </div>
        )}
      </div>
      <div className="mission-card__topline">
        <span className="static-chip">{typeLabel}</span>
        {project.featured && <span className="badge">Featured</span>}
      </div>
      <h3>{project.name}</h3>
      <p>{project.description || "No project description yet."}</p>
      <div className="mission-card__actions">
        {projectId && (
          <Link className="text-button" to={detailPath}>
            {actionLabel}
          </Link>
        )}
        {onSelect && (
        <button className="text-button" type="button" onClick={() => onSelect(project)}>
          Select
        </button>
        )}
      </div>
    </article>
  )
}

export default ProjectMissionCard
