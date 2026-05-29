import { useEffect, useState } from "react"
import { createProject, deleteProject, fetchProjects, updateProject } from "../../services/admin"

const emptyProject = {
  name: "",
  description: "",
  type: "project",
  repoUrl: "",
  demoUrl: "",
  imageUrl: "",
  stack: "",
  featured: false
}

const toForm = (project) => ({
  name: project.name || "",
  description: project.description || "",
  type: project.type || project.project_type || "project",
  repoUrl: project.repo_url || project.repoUrl || "",
  demoUrl: project.demo_url || project.demoUrl || "",
  imageUrl: project.preview_image || project.imageUrl || "",
  stack: Array.isArray(project.tech_stack) ? project.tech_stack.join(", ") : "",
  featured: Boolean(project.featured)
})

const toPayload = (form) => ({
  name: form.name.trim(),
  description: form.description.trim(),
  type: form.type,
  repoUrl: form.repoUrl.trim(),
  demoUrl: form.demoUrl.trim(),
  imageUrl: form.imageUrl.trim(),
  stack: form.stack.split(",").map(item => item.trim()).filter(Boolean),
  featured: form.featured
})

function AdminProjects() {
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState(emptyProject)
  const [editingId, setEditingId] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const loadProjects = async () => {
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
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value
    })
  }

  const resetForm = () => {
    setForm(emptyProject)
    setEditingId("")
  }

  const handleEdit = (project) => {
    setEditingId(project._id)
    setForm(toForm(project))
    setSuccess("")
    setError("")
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
        ? projects.map(project => project._id === editingId ? saved : project)
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

  const handleDelete = async (projectId) => {
    setError("")
    setSuccess("")

    try {
      await deleteProject(projectId)
      setProjects(projects.filter(project => project._id !== projectId))
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
        <span className="static-chip">Projects CRUD</span>
        <div className="command-hero__copy">
          <h1>Projects</h1>
          <p>Create and update public work/game cards. Public reads stay open; mutations use the owner token.</p>
        </div>
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
            Type
            <select name="type" value={form.type} onChange={handleChange}>
              <option value="project">Project</option>
              <option value="game">Game</option>
            </select>
          </label>
          <label>
            Stack, comma separated
            <input name="stack" value={form.stack} onChange={handleChange} placeholder="React, Express, MongoDB" />
          </label>
          <label>
            Repo URL
            <input name="repoUrl" value={form.repoUrl} onChange={handleChange} />
          </label>
          <label>
            Demo URL
            <input name="demoUrl" value={form.demoUrl} onChange={handleChange} />
          </label>
          <label>
            Image URL
            <input name="imageUrl" value={form.imageUrl} onChange={handleChange} />
          </label>
          <label className="admin-checkbox">
            <input name="featured" type="checkbox" checked={form.featured} onChange={handleChange} />
            Featured
          </label>
          <div className="admin-actions">
            <button className="button button--primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
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
          {loading && <div className="skeleton" />}
          {!loading && projects.length === 0 && (
            <article className="bento-card bento-card--quiet">
              <span className="card-kicker">Empty</span>
              <h2>No projects yet</h2>
              <p>Create the first portfolio project from the form.</p>
            </article>
          )}
          {!loading && projects.map(project => (
            <article className="admin-list-card" key={project._id}>
              <div className="admin-list-card__header">
                <div>
                  <span className="card-kicker">{project.type || project.project_type || "project"}</span>
                  <h2>{project.name}</h2>
                </div>
                {project.featured && <small>Featured</small>}
              </div>
              <p>{project.description}</p>
              <div className="admin-actions">
                <button className="button button--secondary" type="button" onClick={() => handleEdit(project)}>Edit</button>
                <button className="button button--secondary" type="button" onClick={() => handleDelete(project._id)}>Delete</button>
              </div>
            </article>
          ))}
        </section>
      </section>
    </div>
  )
}

export default AdminProjects
