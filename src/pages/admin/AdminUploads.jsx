import { useCallback, useEffect, useState } from "react"
import {
  deleteAsset,
  fetchAssets,
  fetchProjects,
  linkAsset,
  updateAsset,
  uploadImage
} from "../../services/admin"

const emptyMetadata = {
  entityType: "",
  entityId: "",
  assetRole: "general",
  altText: "",
  caption: ""
}

const assetRoles = ["general", "preview", "gallery", "icon", "banner"]

const getProjectId = (project) => project._id || project.id

const toCollection = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.assets)) return data.assets
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  return []
}

const getAssetId = (asset) => asset._id || asset.id || asset.assetId

const getAssetUrl = (asset) => (
  asset.url || asset.imageUrl || asset.image_url || asset.fileUrl || asset.file_url || asset.publicUrl || ""
)

const getAssetFilename = (asset) => (
  asset.filename || asset.originalName || asset.original_name || asset.key || "Uploaded asset"
)

const getAssetRole = (asset) => asset.assetRole || asset.asset_role || asset.role || "general"

const getAssetEntityType = (asset) => (
  asset.entityType || asset.entity_type || asset.linkedEntityType || asset.linked_entity_type || ""
)

const getAssetEntityId = (asset) => (
  asset.entityId || asset.entity_id || asset.linkedEntityId || asset.linked_entity_id || ""
)

const getAssetAltText = (asset) => asset.altText || asset.alt_text || ""

const getAssetCaption = (asset) => asset.caption || ""

const getResultAssetId = (result) => (
  result?.assetId || result?.asset_id || result?.asset?._id || result?.asset?.id || result?.id || ""
)

const getResultUrl = (result) => result?.url || result?.asset?.url || ""

function AdminUploads() {
  const [file, setFile] = useState(null)
  const [metadata, setMetadata] = useState(emptyMetadata)
  const [projects, setProjects] = useState([])
  const [assets, setAssets] = useState([])
  const [assetDrafts, setAssetDrafts] = useState({})
  const [result, setResult] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [loadingAssets, setLoadingAssets] = useState(true)
  const [assetActionId, setAssetActionId] = useState("")
  const [error, setError] = useState("")
  const [assetError, setAssetError] = useState("")
  const [assetSuccess, setAssetSuccess] = useState("")
  const [copied, setCopied] = useState(false)

  const loadProjects = useCallback(async () => {
    try {
      const data = await fetchProjects()
      setProjects(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
      setError("Failed to load projects for asset linking.")
    }
  }, [])

  const loadAssets = useCallback(async () => {
    setLoadingAssets(true)
    setAssetError("")

    try {
      const data = await fetchAssets({ limit: 50 })
      const nextAssets = toCollection(data)
      setAssets(nextAssets)
      setAssetDrafts(nextAssets.reduce((drafts, asset) => {
        const assetId = getAssetId(asset)
        if (!assetId) return drafts

        drafts[assetId] = {
          altText: getAssetAltText(asset),
          caption: getAssetCaption(asset),
          assetRole: getAssetRole(asset),
          linkEntityId: getAssetEntityType(asset) === "project" ? getAssetEntityId(asset) : ""
        }
        return drafts
      }, {}))
    } catch (err) {
      console.error(err)
      setAssetError("Failed to load assets.")
    } finally {
      setLoadingAssets(false)
    }
  }, [])

  useEffect(() => {
    loadProjects()
    loadAssets()
  }, [loadAssets, loadProjects])

  const handleMetadataChange = (event) => {
    const { name, value } = event.target
    const nextMetadata = {
      ...metadata,
      [name]: value
    }

    if (name === "entityType" && value !== "project") {
      nextMetadata.entityId = ""
    }

    if (name === "entityId" && value) {
      nextMetadata.entityType = "project"
    }

    setMetadata(nextMetadata)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")
    setResult(null)
    setCopied(false)

    if (!file) {
      setError("Choose an image first.")
      return
    }

    setUploading(true)

    try {
      const payload = {
        ...metadata,
        entityType: metadata.entityId ? "project" : metadata.entityType
      }
      const data = await uploadImage(file, payload)
      setResult(data)
      setMetadata(emptyMetadata)
      await loadAssets()
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || "Failed to upload image.")
    } finally {
      setUploading(false)
    }
  }

  const handleCopy = async () => {
    const url = getResultUrl(result)
    if (!url) return

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch (err) {
      console.error(err)
      setError("Could not copy URL.")
    }
  }

  const handleAssetDraftChange = (assetId, field, value) => {
    setAssetDrafts({
      ...assetDrafts,
      [assetId]: {
        ...assetDrafts[assetId],
        [field]: value
      }
    })
  }

  const handleAssetUpdate = async (assetId) => {
    const draft = assetDrafts[assetId]
    setAssetActionId(assetId)
    setAssetError("")
    setAssetSuccess("")

    try {
      await updateAsset(assetId, {
        altText: draft?.altText || "",
        alt_text: draft?.altText || "",
        caption: draft?.caption || "",
        assetRole: draft?.assetRole || "general",
        asset_role: draft?.assetRole || "general",
        role: draft?.assetRole || "general"
      })
      setAssetSuccess("Asset metadata updated.")
      await loadAssets()
    } catch (err) {
      console.error(err)
      setAssetError(err.response?.data?.error || "Failed to update asset.")
    } finally {
      setAssetActionId("")
    }
  }

  const handleAssetLink = async (assetId) => {
    const draft = assetDrafts[assetId]

    if (!draft?.linkEntityId) {
      setAssetError("Choose a project before linking the asset.")
      return
    }

    setAssetActionId(assetId)
    setAssetError("")
    setAssetSuccess("")

    try {
      await linkAsset(assetId, {
        entityType: "project",
        entityId: draft.linkEntityId,
        assetRole: draft.assetRole || "general"
      })
      setAssetSuccess("Asset linked to project.")
      await loadAssets()
    } catch (err) {
      console.error(err)
      setAssetError(err.response?.data?.error || "Failed to link asset.")
    } finally {
      setAssetActionId("")
    }
  }

  const handleAssetDelete = async (assetId) => {
    setAssetActionId(assetId)
    setAssetError("")
    setAssetSuccess("")

    try {
      await deleteAsset(assetId)
      setAssets(assets.filter(asset => getAssetId(asset) !== assetId))
      setAssetSuccess("Asset deleted.")
    } catch (err) {
      console.error(err)
      setAssetError(err.response?.data?.error || "Failed to delete asset.")
    } finally {
      setAssetActionId("")
    }
  }

  return (
    <div className="page-stack">
      <section className="command-hero admin-hero">
        <span className="static-chip">POST /upload</span>
        <div className="command-hero__copy">
          <h1>Uploads</h1>
          <p>Upload protected media files and copy the returned URL for project/profile records.</p>
        </div>
      </section>

      <section className="admin-crud-grid admin-upload-grid">
        <form className="secure-form admin-panel" onSubmit={handleSubmit}>
          <span className="card-kicker">Protected upload</span>
          <label>
            Image file
            <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>
          <label>
            Entity type
            <select name="entityType" value={metadata.entityType} onChange={handleMetadataChange}>
              <option value="">Standalone</option>
              <option value="project">Project</option>
            </select>
          </label>
          <label>
            Project
            <select name="entityId" value={metadata.entityId} onChange={handleMetadataChange}>
              <option value="">No project</option>
              {projects.map(project => (
                <option value={getProjectId(project)} key={getProjectId(project)}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Asset role
            <select name="assetRole" value={metadata.assetRole} onChange={handleMetadataChange}>
              {assetRoles.map(role => (
                <option value={role} key={role}>{role}</option>
              ))}
            </select>
          </label>
          <label>
            Alt text
            <input name="altText" value={metadata.altText} onChange={handleMetadataChange} />
          </label>
          <label>
            Caption
            <textarea name="caption" value={metadata.caption} onChange={handleMetadataChange} rows="3" />
          </label>
          <button className="button button--primary" type="submit" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload image"}
          </button>
          {error && <p className="form-status form-status--error">{error}</p>}
        </form>

        <div className="admin-list">
          {result && (
            <article className="bento-card admin-upload-result">
              <span className="card-kicker">Upload complete</span>
              <h2>{result.filename || result.asset?.filename || "Uploaded file"}</h2>
              <p>{getResultUrl(result)}</p>
              {getResultAssetId(result) && <small>Asset ID: {getResultAssetId(result)}</small>}
              <div className="admin-actions">
                <button className="button button--secondary" type="button" onClick={handleCopy}>
                  {copied ? "Copied" : "Copy URL"}
                </button>
              </div>
              {result.bucket && <small>Bucket: {result.bucket}</small>}
            </article>
          )}

          <section className="admin-list" aria-label="Asset list">
            <div className="admin-list-card__header">
              <div>
                <span className="card-kicker">GET /assets?limit=50</span>
                <h2>Asset catalog</h2>
              </div>
              <button className="button button--secondary" type="button" onClick={loadAssets} disabled={loadingAssets}>
                {loadingAssets ? "Loading..." : "Refresh"}
              </button>
            </div>

            {assetError && <p className="form-status form-status--error">{assetError}</p>}
            {assetSuccess && <p className="form-status form-status--success">{assetSuccess}</p>}
            {loadingAssets && <div className="skeleton" />}
            {!loadingAssets && assets.length === 0 && (
              <article className="bento-card bento-card--quiet">
                <span className="card-kicker">Empty</span>
                <h2>No assets yet</h2>
                <p>Uploads will appear here after the backend records them.</p>
              </article>
            )}
            {!loadingAssets && assets.map(asset => {
              const assetId = getAssetId(asset)
              const draft = assetDrafts[assetId] || {}
              const assetUrl = getAssetUrl(asset)

              return (
                <article className={`admin-list-card admin-asset-card${assetUrl ? "" : " admin-asset-card--no-thumb"}`} key={assetId}>
                  {assetUrl && (
                    <img className="admin-asset-thumb" src={assetUrl} alt={getAssetAltText(asset) || ""} />
                  )}
                  <div className="admin-asset-body">
                    <div className="admin-list-card__header">
                      <div>
                        <span className="card-kicker">{getAssetRole(asset)}</span>
                        <h2>{getAssetFilename(asset)}</h2>
                      </div>
                      <small>{assetId}</small>
                    </div>
                    <div className="admin-meta-grid">
                      <span>Entity type: {getAssetEntityType(asset) || "standalone"}</span>
                      <span>Entity ID: {getAssetEntityId(asset) || "None"}</span>
                    </div>
                    <label>
                      Role
                      <select
                        value={draft.assetRole || "general"}
                        onChange={(event) => handleAssetDraftChange(assetId, "assetRole", event.target.value)}
                      >
                        {assetRoles.map(role => (
                          <option value={role} key={role}>{role}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Alt text
                      <input
                        value={draft.altText || ""}
                        onChange={(event) => handleAssetDraftChange(assetId, "altText", event.target.value)}
                      />
                    </label>
                    <label>
                      Caption
                      <textarea
                        value={draft.caption || ""}
                        rows="2"
                        onChange={(event) => handleAssetDraftChange(assetId, "caption", event.target.value)}
                      />
                    </label>
                    <label>
                      Link to project
                      <select
                        value={draft.linkEntityId || ""}
                        onChange={(event) => handleAssetDraftChange(assetId, "linkEntityId", event.target.value)}
                      >
                        <option value="">Choose project</option>
                        {projects.map(project => (
                          <option value={getProjectId(project)} key={getProjectId(project)}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="admin-actions">
                      <button
                        className="button button--secondary"
                        type="button"
                        disabled={assetActionId === assetId}
                        onClick={() => handleAssetUpdate(assetId)}
                      >
                        Update metadata
                      </button>
                      <button
                        className="button button--secondary"
                        type="button"
                        disabled={assetActionId === assetId}
                        onClick={() => handleAssetLink(assetId)}
                      >
                        Link to project
                      </button>
                      <button
                        className="button button--secondary"
                        type="button"
                        disabled={assetActionId === assetId}
                        onClick={() => handleAssetDelete(assetId)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </section>
        </div>
      </section>
    </div>
  )
}

export default AdminUploads
