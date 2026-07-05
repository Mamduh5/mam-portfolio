import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { fetchProject } from "../services/projects"
import {
  formatDate,
  getAssetAlt,
  getAssetUrl,
  getDemoUrl,
  getGalleryAssets,
  getGitHubFullName,
  getGitHubLanguage,
  getGitHubPushedAt,
  getPreviewAlt,
  getPreviewImage,
  getProjectStatus,
  getProjectType,
  getRepoUrl,
  getTechStackItems
} from "../utils/projectMedia"

const normalizeProject = (data) => data?.project || data?.item || data?.data || data

function ProjectDetail({ mode = "project" }) {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [previewFailed, setPreviewFailed] = useState(false)
  const [failedGalleryImages, setFailedGalleryImages] = useState({})

  useEffect(() => {
    let active = true

    const loadProject = async () => {
      setLoading(true)
      setError(false)
      setPreviewFailed(false)
      setFailedGalleryImages({})

      try {
        const data = await fetchProject(id)
        if (active) {
          setProject(normalizeProject(data))
        }
      } catch (err) {
        console.error(err)
        if (active) {
          setProject(null)
          setError(true)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadProject()

    return () => {
      active = false
    }
  }, [id])

  const galleryAssets = useMemo(() => getGalleryAssets(project || {}), [project])

  if (loading) {
    return (
      <div className="page-stack">
        <div className="skeleton skeleton--hero" />
        <div className="skeleton" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <section className="project-detail-shell">
        <Link className="text-button" to={mode === "game" ? "/games" : "/projects"}>
          Back to {mode === "game" ? "games" : "work"}
        </Link>
        <div className="project-detail-paper">
          <span className="static-chip">{mode === "game" ? "Game detail" : "Project detail"}</span>
          <h1>{mode === "game" ? "Game not found" : "Project not found"}</h1>
          <p>This item could not be loaded.</p>
        </div>
      </section>
    )
  }

  const projectType = getProjectType(project)
  const previewImage = getPreviewImage(project)
  const repoUrl = getRepoUrl(project)
  const demoUrl = getDemoUrl(project)
  const techStack = getTechStackItems(project)
  const githubFullName = getGitHubFullName(project)
  const githubLanguage = getGitHubLanguage(project)
  const githubPushedAt = getGitHubPushedAt(project)

  return (
    <div className="project-detail-shell">
      <Link className="text-button" to={mode === "game" ? "/games" : "/projects"}>
        Back to {mode === "game" ? "games" : "work"}
      </Link>

      <article className="project-detail-paper">
        <div className="project-detail-grid">
          <div className="project-detail-copy">
            <div className="project-detail-kickers">
              <span className="static-chip">{projectType === "game" ? "Game" : "Project"}</span>
              <span className="badge">{getProjectStatus(project)}</span>
              {project.featured && <span className="badge">Featured</span>}
            </div>
            <h1>{project.name}</h1>
            <p>{project.description || "No description yet."}</p>
            <div className="project-detail-actions">
              {demoUrl && (
                <a className="button button--primary" href={demoUrl} target="_blank" rel="noreferrer">
                  Open demo
                </a>
              )}
              {repoUrl && (
                <a className="button button--secondary" href={repoUrl} target="_blank" rel="noreferrer">
                  View source
                </a>
              )}
            </div>
          </div>

          <div className="project-detail-preview">
            {previewImage && !previewFailed ? (
              <img src={previewImage} alt={getPreviewAlt(project)} onError={() => setPreviewFailed(true)} />
            ) : (
              <div className="paper-image-placeholder paper-image-placeholder--large">
                <span>{projectType === "game" ? "Game" : "Project"}</span>
              </div>
            )}
          </div>
        </div>

        <div className="project-detail-sections">
          <section className="ruled-panel">
            <span className="card-kicker">Stack</span>
            {techStack.length > 0 ? (
              <div className="skill-cluster project-skill-cluster">
                {techStack.map(item => <span key={item}>{item}</span>)}
              </div>
            ) : (
              <p>No stack notes yet.</p>
            )}
          </section>

          <section className="ruled-panel">
            <span className="card-kicker">Details</span>
            <div className="ruled-rows">
              <div><span>Status</span><strong>{getProjectStatus(project)}</strong></div>
              <div><span>Type</span><strong>{projectType}</strong></div>
              {githubFullName && <div><span>GitHub</span><strong>{githubFullName}</strong></div>}
              {githubLanguage && <div><span>Language</span><strong>{githubLanguage}</strong></div>}
              {githubPushedAt && <div><span>Last pushed</span><strong>{formatDate(githubPushedAt)}</strong></div>}
            </div>
          </section>
        </div>

        <section className="ruled-panel">
          <span className="card-kicker">Gallery</span>
          {galleryAssets.length > 0 ? (
            <div className="contact-sheet-grid">
              {galleryAssets.map((asset, index) => {
                const assetUrl = getAssetUrl(asset)
                const failed = failedGalleryImages[index]

                return (
                  <figure className="contact-sheet-item" key={asset.id || asset._id || assetUrl || index}>
                    {assetUrl && !failed ? (
                      <img
                        src={assetUrl}
                        alt={getAssetAlt(asset, `${project.name} gallery image`)}
                        onError={() => setFailedGalleryImages(current => ({ ...current, [index]: true }))}
                      />
                    ) : (
                      <div className="paper-image-placeholder">
                        <span>Image</span>
                      </div>
                    )}
                    {(asset.caption || asset.altText || asset.alt_text) && (
                      <figcaption>{asset.caption || asset.altText || asset.alt_text}</figcaption>
                    )}
                  </figure>
                )
              })}
            </div>
          ) : (
            <p>No gallery images yet.</p>
          )}
        </section>
      </article>
    </div>
  )
}

export default ProjectDetail
