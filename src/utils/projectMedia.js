export const getProjectId = (project = {}) => project._id || project.id || project.projectId || project.project_id || ""

export const getProjectType = (project = {}) => (
  project.projectType || project.project_type || project.type || "project"
)

export const getProjectStatus = (project = {}) => project.status || "draft"

export const getPublicVisible = (project = {}) => {
  if (project.publicVisible !== undefined) return Boolean(project.publicVisible)
  if (project.public_visible !== undefined) return Boolean(project.public_visible)
  return true
}

export const getRepoUrl = (project = {}) => (
  project.repoUrl ||
  project.repo_url ||
  project.repositoryUrl ||
  project.repository_url ||
  project.githubRepoUrl ||
  project.github_repo_url ||
  project.github?.repoUrl ||
  project.github?.repo_url ||
  project.github?.htmlUrl ||
  project.github?.html_url ||
  project.html_url ||
  ""
)

export const getDemoUrl = (project = {}) => project.demoUrl || project.demo_url || ""

export const getGitHubFullName = (project = {}) => (
  project.githubFullName ||
  project.github_full_name ||
  project.github?.fullName ||
  project.github?.full_name ||
  ""
)

export const getGitHubLanguage = (project = {}) => (
  project.githubLanguage || project.github_language || project.github?.language || ""
)

export const getGitHubPushedAt = (project = {}) => (
  project.githubPushedAt ||
  project.github_pushed_at ||
  project.github?.pushedAt ||
  project.github?.pushed_at ||
  project.pushedAt ||
  project.pushed_at ||
  ""
)

export const getSourceKind = (project = {}) => (
  project.sourceKind || project.source_kind || project.source?.kind || project.github?.sourceKind || ""
)

export const isGitHubImported = (project = {}) => (
  getSourceKind(project).toLowerCase() === "github" ||
  Boolean(getGitHubFullName(project) || getRepoUrl(project))
)

export const formatDate = (value) => {
  if (!value) return ""

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
}

export const getTechStackItems = (project = {}) => {
  const value = project.techStack || project.tech_stack || project.tech_stack_json || project.stack

  if (Array.isArray(value)) return value.map(String).map(item => item.trim()).filter(Boolean)

  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return []

    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed.map(String).map(item => item.trim()).filter(Boolean)
      }
    } catch {
      // Fall through to comma/newline parsing.
    }

    return trimmed
      .split(/,|\n/)
      .map(item => item.trim())
      .filter(Boolean)
  }

  return []
}

export const getProjectAssets = (project = {}) => {
  const candidates = [
    project.assets,
    project.galleryAssets,
    project.gallery_assets,
    project.attachedAssets,
    project.attached_assets,
    project.images
  ]

  return candidates.find(Array.isArray) || []
}

const firstString = (...values) => (
  values
    .map(value => (typeof value === "string" ? value.trim() : ""))
    .find(Boolean) || ""
)

export const getMediaUrl = (source = {}) => {
  if (typeof source === "string") return source.trim()
  if (!source || typeof source !== "object") return ""

  return firstString(
    source.url,
    source.publicUrl,
    source.public_url,
    source.avatarUrl,
    source.avatar_url,
    source.imageUrl,
    source.image_url,
    source.photoUrl,
    source.photo_url,
    source.fileUrl,
    source.file_url,
    source.assetUrl,
    source.asset_url,
    source.downloadUrl,
    source.download_url,
    source.location,
    source.Location,
    source.href,
    typeof source.avatar === "string" ? source.avatar : "",
    typeof source.image === "string" ? source.image : "",
    typeof source.photo === "string" ? source.photo : "",
    source.asset?.url,
    source.asset?.publicUrl,
    source.asset?.public_url,
    source.asset?.imageUrl,
    source.asset?.image_url,
    source.asset?.fileUrl,
    source.asset?.file_url
  )
}

export const getAssetRole = (asset = {}) => asset.assetRole || asset.asset_role || asset.role || ""

export const getAssetUrl = (asset = {}) => getMediaUrl(asset)

export const getUploadResultUrl = (result = {}) => getMediaUrl(result)

export const getProfileAvatarUrl = (profile = {}) => (
  firstString(
    getMediaUrl(profile),
    getMediaUrl(profile.avatar),
    getMediaUrl(profile.image),
    getMediaUrl(profile.photo)
  )
)

export const getAssetAlt = (asset = {}, fallback = "") => (
  asset.altText || asset.alt_text || asset.caption || fallback
)

export const getPreviewAsset = (project = {}) => {
  const assets = getProjectAssets(project)
  return assets.find(asset => getAssetRole(asset) === "preview") || null
}

export const getGalleryAssets = (project = {}) => {
  const assets = getProjectAssets(project)
  return assets.filter(asset => getAssetRole(asset) === "gallery" || getAssetRole(asset) !== "preview")
}

export const getPreviewImage = (project = {}) => {
  if (project.previewImage) return project.previewImage
  if (project.preview_image) return project.preview_image
  if (project.imageUrl) return project.imageUrl
  if (project.image_url) return project.image_url

  const previewAsset = getPreviewAsset(project)
  if (previewAsset) return getAssetUrl(previewAsset)

  const galleryAsset = getGalleryAssets(project).find(asset => getAssetUrl(asset))
  return galleryAsset ? getAssetUrl(galleryAsset) : ""
}

export const getPreviewAlt = (project = {}) => {
  const previewAsset = getPreviewAsset(project)
  return previewAsset
    ? getAssetAlt(previewAsset, `${project.name || "Project"} preview`)
    : `${project.name || "Project"} preview`
}
