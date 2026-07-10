import { useCallback, useEffect, useState } from "react"
import {
  deleteAsset,
  fetchAssets,
  fetchProjects,
  linkAsset,
  updateAsset,
  uploadImage
} from "../../services/admin"
import { getAssetUrl, getUploadResultUrl } from "../../utils/projectMedia"

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

const getAssetCreatedAt = (asset) => asset.createdAt || asset.created_at || asset.uploadedAt || asset.uploaded_at || ""

const formatDate = (value) => {
  if (!value) return "No date"

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
}

const getResultAssetId = (result) => (
  result?.assetId || result?.asset_id || result?.asset?._id || result?.asset?.id || result?.id || ""
)

const getResultUrl = (result) => getUploadResultUrl(result)

function AdminUploads() {
  const [file, setFile] = useState(null)
  const [metadata, setMetadata] = useState(emptyMetadata)
  const [projects, setProjects] = useState([])
  const [assets, setAssets] = useState([])
  const [assetDrafts, setAssetDrafts] = useState({})
  const [selectedAssetId, setSelectedAssetId] = useState("")
  const [result, setResult] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [loadingAssets, setLoadingAssets] = useState(true)
  const [assetActionId, setAssetActionId] = useState("")
  const [error, setError] = useState("")
  const [assetError, setAssetError] = useState("")
  const [assetSuccess, setAssetSuccess] = useState("")
  const [copied, setCopied] = useState(false)
  const [copiedAssetId, setCopiedAssetId] = useState("")

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
      setSelectedAssetId(current => current || getAssetId(nextAssets[0]) || "")
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
      if (!getResultUrl(data)) {
        setError("Upload completed, but the response did not include a reusable public image URL.")
      }
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

  const handleAssetCopy = async (assetId, url) => {
    if (!url) return

    try {
      await navigator.clipboard.writeText(url)
      setCopiedAssetId(assetId)
      setAssetSuccess("Asset URL copied.")
    } catch (err) {
      console.error(err)
      setAssetError("Could not copy asset URL.")
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
      const nextAssets = assets.filter(asset => getAssetId(asset) !== assetId)
      setAssets(nextAssets)
      if (selectedAssetId === assetId) {
        setSelectedAssetId(getAssetId(nextAssets[0]) || "")
      }
      setAssetSuccess("Asset deleted.")
    } catch (err) {
      console.error(err)
      setAssetError(err.response?.data?.error || "Failed to delete asset.")
    } finally {
      setAssetActionId("")
    }
  }

  const selectedAsset = assets.find(asset => getAssetId(asset) === selectedAssetId) || null
  const selectedDraft = selectedAsset ? assetDrafts[selectedAssetId] || {} : {}
  const selectedAssetUrl = selectedAsset ? getAssetUrl(selectedAsset) : ""
  const resultUrl = getResultUrl(result)

  return (
    <div className="admin-desk">
      <section className="admin-page-bar">
        <div>
          <span className="card-kicker">Image library</span>
          <h1>Uploads</h1>
          <p>Upload media files and manage images used by projects and profile details.</p>
        </div>
        <div className="admin-actions">
          <button className="button button--secondary" type="button" onClick={loadAssets} disabled={loadingAssets}>
            {loadingAssets ? "Loading..." : "Refresh assets"}
          </button>
        </div>
      </section>

      <section className="admin-workbench admin-workbench--uploads">
        <div className="admin-upload-column">
          <form className="secure-form admin-panel admin-upload-form" onSubmit={handleSubmit}>
            <div className="admin-inspector__header">
              <div>
                <span className="card-kicker">New image</span>
                <h2>Upload</h2>
              </div>
              <button className="button button--primary" type="submit" disabled={uploading}>
                {uploading ? "Uploading..." : "Upload image"}
              </button>
            </div>
            <div className="admin-form-pair">
              <label>
                Image file
                <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} />
              </label>
              <label>
                Role
                <select name="assetRole" value={metadata.assetRole} onChange={handleMetadataChange}>
                  {assetRoles.map(role => (
                    <option value={role} key={role}>{role}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="admin-form-pair">
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
            </div>
            <label>
              Alt text
              <input name="altText" value={metadata.altText} onChange={handleMetadataChange} />
            </label>
            <label>
              Caption
              <textarea name="caption" value={metadata.caption} onChange={handleMetadataChange} rows="2" />
            </label>
            {error && <p className="form-status form-status--error">{error}</p>}
          </form>

          {result && (
            <article className="admin-panel admin-upload-result">
              <span className="card-kicker">Upload complete</span>
              <h2>{result.filename || result.asset?.filename || "Uploaded file"}</h2>
              {resultUrl ? (
                <p>{resultUrl}</p>
              ) : (
                <p className="form-status form-status--error">No reusable public URL was returned.</p>
              )}
              {getResultAssetId(result) && <small>Asset ID: {getResultAssetId(result)}</small>}
              <div className="admin-actions">
                <button className="button button--secondary" type="button" onClick={handleCopy} disabled={!resultUrl}>
                  {copied ? "Copied" : "Copy URL"}
                </button>
              </div>
            </article>
          )}
        </div>

        <section className="admin-panel admin-asset-catalog" aria-label="Asset list">
          <div className="admin-inspector__header">
            <div>
              <span className="card-kicker">Contact sheet</span>
              <h2>Asset catalog</h2>
            </div>
          </div>

          {assetError && <p className="form-status form-status--error">{assetError}</p>}
          {assetSuccess && <p className="form-status form-status--success">{assetSuccess}</p>}
          {loadingAssets && <div className="skeleton" />}
          {!loadingAssets && assets.length === 0 && (
            <article className="admin-panel admin-empty-card">
              <span className="card-kicker">Empty</span>
              <h2>No assets yet</h2>
              <p>No uploaded assets yet.</p>
            </article>
          )}
          <div className="admin-asset-contact-sheet">
            {!loadingAssets && assets.map(asset => {
              const assetId = getAssetId(asset)
              const assetUrl = getAssetUrl(asset)

              return (
                <button
                  className={`admin-asset-tile${selectedAssetId === assetId ? " admin-asset-tile--selected" : ""}`}
                  type="button"
                  key={assetId}
                  onClick={() => {
                    setSelectedAssetId(assetId)
                    setCopiedAssetId("")
                  }}
                >
                  {assetUrl ? (
                    <img src={assetUrl} alt={getAssetAltText(asset) || getAssetFilename(asset)} />
                  ) : (
                    <span className="paper-image-placeholder">Image</span>
                  )}
                  <span>{getAssetRole(asset)}</span>
                  <strong>{getAssetFilename(asset)}</strong>
                  <small>{getAssetEntityType(asset) || "standalone"} - {formatDate(getAssetCreatedAt(asset))}</small>
                </button>
              )
            })}
          </div>
        </section>

        <aside className="admin-panel admin-inspector">
          {selectedAsset ? (
            <>
              <div className="admin-inspector__header">
                <div>
                  <span className="card-kicker">{getAssetRole(selectedAsset)}</span>
                  <h2>{getAssetFilename(selectedAsset)}</h2>
                </div>
              </div>
              <div className="admin-asset-inspector-preview">
                {selectedAssetUrl ? (
                  <img src={selectedAssetUrl} alt={getAssetAltText(selectedAsset) || getAssetFilename(selectedAsset)} />
                ) : (
                  <div className="paper-image-placeholder paper-image-placeholder--large">Image</div>
                )}
              </div>
              <div className="admin-meta-grid">
                <span>Linked type: {getAssetEntityType(selectedAsset) || "standalone"}</span>
                <span>Linked item: {getAssetEntityId(selectedAsset) || "None"}</span>
                <span>Created: {formatDate(getAssetCreatedAt(selectedAsset))}</span>
              </div>
              <div className="admin-asset-url-panel">
                <span className="card-kicker">Reusable URL</span>
                {selectedAssetUrl ? (
                  <>
                    <p>{selectedAssetUrl}</p>
                    <button className="button button--secondary" type="button" onClick={() => handleAssetCopy(selectedAssetId, selectedAssetUrl)}>
                      {copiedAssetId === selectedAssetId ? "Copied" : "Copy URL"}
                    </button>
                  </>
                ) : (
                  <p className="form-status form-status--error">This asset record does not include a reusable public URL.</p>
                )}
              </div>
              <label>
                Role
                <select
                  value={selectedDraft.assetRole || "general"}
                  onChange={(event) => handleAssetDraftChange(selectedAssetId, "assetRole", event.target.value)}
                >
                  {assetRoles.map(role => (
                    <option value={role} key={role}>{role}</option>
                  ))}
                </select>
              </label>
              <label>
                Alt text
                <input
                  value={selectedDraft.altText || ""}
                  onChange={(event) => handleAssetDraftChange(selectedAssetId, "altText", event.target.value)}
                />
              </label>
              <label>
                Caption
                <textarea
                  value={selectedDraft.caption || ""}
                  rows="2"
                  onChange={(event) => handleAssetDraftChange(selectedAssetId, "caption", event.target.value)}
                />
              </label>
              <label>
                Link to project
                <select
                  value={selectedDraft.linkEntityId || ""}
                  onChange={(event) => handleAssetDraftChange(selectedAssetId, "linkEntityId", event.target.value)}
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
                <button className="button button--secondary" type="button" disabled={assetActionId === selectedAssetId} onClick={() => handleAssetUpdate(selectedAssetId)}>
                  Save asset details
                </button>
                <button className="button button--secondary" type="button" disabled={assetActionId === selectedAssetId} onClick={() => handleAssetLink(selectedAssetId)}>
                  Link asset
                </button>
                <button className="button button--secondary" type="button" disabled={assetActionId === selectedAssetId} onClick={() => handleAssetDelete(selectedAssetId)}>
                  Delete
                </button>
              </div>
            </>
          ) : (
            <p>Select an asset to edit its details.</p>
          )}
        </aside>
      </section>
    </div>
  )
}

export default AdminUploads
