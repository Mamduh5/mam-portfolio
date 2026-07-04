import { useCallback, useEffect, useMemo, useState } from "react"
import {
  createProject,
  deleteProject,
  fetchProjects,
  syncGitHubProjectCatalog,
  updateProject,
  uploadImage
} from "../../services/admin"

const emptyProject = {
  name: "",
  description: "",
  status: "draft",
  publicVisible: true,
  sortOrder: "",
  projectType: "project",
  repoUrl: "",
  demoUrl: "",
  previewImage: "",
  techStack: "",
  featured: false
}

const emptyFilters = {
  type: "",
  status: "",
  source: "",
  visibility: ""
}

const getProjectId = (project) => project._id || project.id

const getProjectType = (project) => (
  project.projectType || project.project_type || project.type || "project"
)

const getPublicVisible = (project) => {
  if (project.publicVisible !== undefined) return Boolean(project.publicVisible)
  if (project.public_visible !== undefined) return Boolean(project.public_visible)
  return true
}

const getSortOrder = (project) => project.sortOrder ?? project.sort_order ?? ""

const getRepoUrl = (project) => (
  project.repoUrl || project.repo_url || project.repositoryUrl || project.html_url || ""
)

const getDemoUrl = (project) => project.demoUrl || project.demo_url || ""

const getPreviewImage = (project) => (
  project.previewImage || project.preview_image || project.imageUrl || project.image_url || ""
)

const getTechStack = (project) => {
  const value = project.techStack || project.tech_stack || project.tech_stack_json || project.stack

  if (Array.isArray(value)) return value.join(", ")
  if (typeof value === "string") return value
  return ""
}

const getSourceKind = (project) => (
  project.sourceKind || project.source_kind || project.source?.kind || project.github?.sourceKind || ""
)

const getGitHubFullName = (project) => (
  project.githubFullName ||
  project.github_full_name ||
  project.github?.fullName ||
  project.github?.full_name ||
  ""
)

const getGitHubLanguage = (project) => (
  project.githubLanguage || project.github_language || project.github?.language || ""
)

const getGitHubPushedAt = (project) => (
  project.githubPushedAt ||
  project.github_pushed_at ||
  project.github?.pushedAt ||
  project.github?.pushed_at ||
  ""
)

const getGitHubRepoUrl = (project) => (
  project.githubRepoUrl ||
  project.github_repo_url ||
  project.github?.repoUrl ||
  project.github?.repo_url ||
  project.github?.htmlUrl ||
  project.github?.html_url ||
  ""
)

const isGitHubImported = (project) => (
  getSourceKind(project).toLowerCase() === "github" ||
  Boolean(getGitHubFullName(project) || getGitHubRepoUrl(project))
)

const formatDate = (value) => {
  if (!value) return ""

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
}

const toForm = (project) => ({
  name: project.name || "",
  description: project.description || "",
  status: project.status || "draft",
  publicVisible: getPublicVisible(project),
  sortOrder: getSortOrder(project),
  projectType: getProjectType(project),
  repoUrl: getRepoUrl(project),
  demoUrl: getDemoUrl(project),
  previewImage: getPreviewImage(project),
  techStack: getTechStack(project),
  featured: Boolean(project.featured)
})

const toPayload = (form) => {
  const techStack = form.techStack
    .split(",")
    .map(item => item.trim())
    .filter(Boolean)
  const projectType = form.projectType || "project"
  const sortOrder = form.sortOrder === "" ? "" : Number(form.sortOrder)

  return {
    name: form.name.trim(),
    description: form.description.trim(),
    status: form.status,
    publicVisible: form.publicVisible,
    public_visible: form.publicVisible,
    sortOrder,
    sort_order: sortOrder,
    projectType,
    project_type: projectType,
    type: projectType,
    repoUrl: form.repoUrl.trim(),
    demoUrl: form.demoUrl.trim(),
    demo_url: form.demoUrl.trim(),
    previewImage: form.previewImage.trim(),
    preview_image: form.previewImage.trim(),
    imageUrl: form.previewImage.trim(),
    techStack,
    tech_stack_json: techStack,
    stack: techStack,
    featured: form.featured
  }
}

const getSyncValue = (result, keys) => {
  for (const key of keys) {
    if (result?.[key] !== undefined) return result[key]
  }

  return 0
}

const getUploadUrl = (result) => result?.url || result?.asset?.url || result?.previewImage || result?.preview_image || ""

function AdminProjects() {
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState(emptyProject)
  const [filters, setFilters] = useState(emptyFilters)
  const [previewFile, setPreviewFile] = useState(null)
  const [editingId, setEditingId] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewUploading, setPreviewUploading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState(null)
  const [syncError, setSyncError] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const loadProjects = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const data = await fetchProjects()
      setProjects(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setError("Failed to load projects.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  const filteredProjects = useMemo(() => (
    projects.filter(project => {
      if (filters.type && getProjectType(project) !== filters.type) return false
      if (filters.status && (project.status || "draft") !== filters.status) return false
      if (filters.source === "github" && !isGitHubImported(project)) return false
      if (filters.source === "manual" && isGitHubImported(project)) return false
      if (filters.visibility === "visible" && !getPublicVisible(project)) return false
      if (filters.visibility === "hidden" && getPublicVisible(project)) return false
      return true
    })
  ), [filters, projects])

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value
    })
  }

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    setFilters({
      ...filters,
      [name]: value
    })
  }

  const resetForm = () => {
    setForm(emptyProject)
    setPreviewFile(null)
    setEditingId("")
  }

  const handleEdit = (project) => {
    setEditingId(getProjectId(project))
    setForm(toForm(project))
    setPreviewFile(null)
    setSuccess("")
    setError("")
  }

  const handleSync = async () => {
    setSyncing(true)
    setSyncError("")
    setSyncResult(null)
    setSuccess("")
    setError("")

    try {
      const result = await syncGitHubProjectCatalog({
        includeArchived: false,
        maxRepos: 100
      })
      setSyncResult(result)
      setSuccess("GitHub project sync complete.")
      await loadProjects()
    } catch (err) {
      console.error(err)
      setSyncError(err.response?.data?.error || "Failed to sync GitHub projects.")
    } finally {
      setSyncing(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const payload = toPayload(form)
      const saved = editingId
        ? await updateProject(editingId, payload)
        : await createProject(payload)

      setProjects(editingId
        ? projects.map(project => getProjectId(project) === editingId ? saved : project)
        : [saved, ...projects]
      )
      setSuccess(editingId ? "Project updated." : "Project created.")
      resetForm()
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || "Failed to save project.")
    } finally {
      setSaving(false)
    }
  }

  const handlePreviewUpload = async () => {
    setError("")
    setSuccess("")

    if (!editingId) {
      setError("Save or select a project before uploading a preview image.")
      return
    }

    if (!previewFile) {
      setError("Choose a preview image first.")
      return
    }

    setPreviewUploading(true)

    try {
      const result = await uploadImage(previewFile, {
        entityType: "project",
        entityId: editingId,
        assetRole: "preview",
        altText: form.name ? `${form.name} preview` : "Project preview"
      })
      const previewUrl = getUploadUrl(result)

      if (previewUrl) {
        setForm({
          ...form,
          previewImage: previewUrl
        })
        setProjects(projects.map(project => (
          getProjectId(project) === editingId
            ? { ...project, previewImage: previewUrl, preview_image: previewUrl, imageUrl: previewUrl }
            : project
        )))
      }

      setPreviewFile(null)
      setSuccess("Preview image uploaded.")
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || "Failed to upload preview image.")
    } finally {
      setPreviewUploading(false)
    }
  }

  const handleDelete = async (projectId) => {
    setError("")
    setSuccess("")

    try {
      await deleteProject(projectId)
      setProjects(projects.filter(project => getProjectId(project) !== projectId))
      if (editingId === projectId) resetForm()
      setSuccess("Project deleted.")
    } catch (err) {
      console.error(err)
      setError("Failed to delete project.")
    }
  }

  return (
    <div className="page-stack">
      <section className="command-hero admin-hero">
        <span className="static-chip">Project collection</span>
        <div className="command-hero__copy">
          <h1>Projects</h1>
          <p>Create and update the work and game cards shown on the portfolio.</p>
        </div>
      </section>

      <section className="admin-panel admin-sync-panel" aria-label="GitHub project sync">
        <div>
          <span className="card-kicker">GitHub import</span>
          <h2>Sync GitHub Projects</h2>
          <p>Import public repository details while keeping portfolio edits in this workspace.</p>
        </div>
        <div className="admin-actions">
          <button className="button button--primary" type="button" onClick={handleSync} disabled={syncing}>
            {syncing ? "Syncing..." : "Sync GitHub Projects"}
          </button>
        </div>
        {syncResult && (
          <div className="admin-meta-grid">
            <span>Repos scanned: {getSyncValue(syncResult, ["reposScanned", "repos_scanned", "scanned"])}</span>
            <span>Projects created: {getSyncValue(syncResult, ["projectsCreated", "projects_created", "created"])}</span>
            <span>Projects updated: {getSyncValue(syncResult, ["projectsUpdated", "projects_updated", "updated"])}</span>
            <span>Skipped archived: {getSyncValue(syncResult, ["skippedArchived", "skipped_archived"])}</span>
            <span>Errors: {getSyncValue(syncResult, ["errorsCount", "errors_count", "errorCount"])}</span>
          </div>
        )}
        {syncError && <p className="form-status form-status--error">{syncError}</p>}
      </section>

      <section className="admin-crud-grid">
        <form className="secure-form admin-panel" onSubmit={handleSubmit}>
          <span className="card-kicker">{editingId ? "Edit project" : "Create project"}</span>
          <label>
            Name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            Description
            <textarea name="description" value={form.description} onChange={handleChange} rows="4" required />
          </label>
          <label>
            Status
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label>
            Project type
            <select name="projectType" value={form.projectType} onChange={handleChange}>
              <option value="project">Project</option>
              <option value="game">Game</option>
            </select>
          </label>
          <label>
            Sort order
            <input name="sortOrder" type="number" value={form.sortOrder} onChange={handleChange} />
          </label>
          <label>
            Tech stack, comma separated
            <input name="techStack" value={form.techStack} onChange={handleChange} placeholder="React, Express, MongoDB" />
          </label>
          <label>
            Repo URL
            <input name="repoUrl" value={form.repoUrl} onChange={handleChange} />
          </label>
          <label>
            Demo URL
            <input name="demoUrl" value={form.demoUrl} onChange={handleChange} />
          </label>
          <div className="admin-preview-panel">
            <span className="card-kicker">Preview image</span>
            {form.previewImage ? (
              <img src={form.previewImage} alt={form.name ? `${form.name} preview` : "Project preview"} />
            ) : (
              <small>No preview image set.</small>
            )}
            <label>
              Upload preview image
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setPreviewFile(event.target.files?.[0] || null)}
              />
            </label>
            <button
              className="button button--secondary"
              type="button"
              onClick={handlePreviewUpload}
              disabled={previewUploading || !previewFile}
            >
              {previewUploading ? "Uploading..." : "Upload preview image"}
            </button>
            {!editingId && <small>Create or edit a project before uploading a preview image.</small>}
          </div>
          <label>
            Preview image URL (advanced fallback)
            <input name="previewImage" value={form.previewImage} onChange={handleChange} />
          </label>
          <label className="admin-checkbox">
            <input name="publicVisible" type="checkbox" checked={form.publicVisible} onChange={handleChange} />
            Public visible
          </label>
          <label className="admin-checkbox">
            <input name="featured" type="checkbox" checked={form.featured} onChange={handleChange} />
            Featured
          </label>
          <div className="admin-actions">
            <button className="button button--primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save project" : "Create project"}
            </button>
            {editingId && (
              <button className="button button--secondary" type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
          {error && <p className="form-status form-status--error">{error}</p>}
          {success && <p className="form-status form-status--success">{success}</p>}
        </form>

        <section className="admin-list" aria-label="Project list">
          <div className="admin-panel admin-filter-panel">
            <label>
              Type
              <select name="type" value={filters.type} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="project">Project</option>
                <option value="game">Game</option>
              </select>
            </label>
            <label>
              Status
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </label>
            <label>
              Source
              <select name="source" value={filters.source} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="github">GitHub</option>
                <option value="manual">Manual</option>
              </select>
            </label>
            <label>
              Visibility
              <select name="visibility" value={filters.visibility} onChange={handleFilterChange}>
                <option value="">All</option>
                <option value="visible">Public</option>
                <option value="hidden">Hidden</option>
              </select>
            </label>
          </div>

          {loading && <div className="skeleton" />}
          {!loading && projects.length === 0 && (
            <article className="bento-card bento-card--quiet">
              <span className="card-kicker">Empty</span>
              <h2>No projects yet</h2>
              <p>Create the first portfolio project from the form.</p>
            </article>
          )}
          {!loading && projects.length > 0 && filteredProjects.length === 0 && (
            <article className="bento-card bento-card--quiet">
              <span className="card-kicker">No matches</span>
              <h2>No projects match these filters</h2>
              <p>Clear filters to return to the full catalog.</p>
            </article>
          )}
          {!loading && filteredProjects.map(project => {
            const projectId = getProjectId(project)
            const projectType = getProjectType(project)
            const githubImported = isGitHubImported(project)
            const repoUrl = getGitHubRepoUrl(project) || getRepoUrl(project)

            return (
              <article className="admin-list-card" key={projectId}>
                <div className="admin-list-card__header">
                  <div>
                    <span className="card-kicker">{projectType}</span>
                    <h2>{project.name}</h2>
                  </div>
                  {project.featured && <small>Featured</small>}
                </div>
                <p>{project.description}</p>
                <div className="admin-status-row">
                  <span>{githubImported ? "GitHub imported" : "Manual"}</span>
                  <span>{getPublicVisible(project) ? "Public" : "Hidden"}</span>
                  <span>{project.status || "draft"}</span>
                  <span>{projectType}</span>
                  {project.featured && <span>Featured</span>}
                </div>
                {githubImported && (
                  <div className="admin-meta-grid">
                    <span>Source: {getSourceKind(project) || "github"}</span>
                    <span>GitHub full name: {getGitHubFullName(project) || "Not set"}</span>
                    <span>GitHub language: {getGitHubLanguage(project) || "Not set"}</span>
                    <span>GitHub pushed at: {formatDate(getGitHubPushedAt(project)) || "Not set"}</span>
                    {repoUrl && (
                      <a href={repoUrl} target="_blank" rel="noreferrer">
                        Repo URL
                      </a>
                    )}
                  </div>
                )}
                <div className="admin-actions">
                  <button className="button button--secondary" type="button" onClick={() => handleEdit(project)}>Edit</button>
                  <button className="button button--secondary" type="button" onClick={() => handleDelete(projectId)}>Delete</button>
                </div>
              </article>
            )
          })}
        </section>
      </section>
    </div>
  )
}

export default AdminProjects
