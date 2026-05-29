import { useState } from "react"
import { uploadImage } from "../../services/admin"

function AdminUploads() {
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

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
      const data = await uploadImage(file)
      setResult(data)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || "Failed to upload image.")
    } finally {
      setUploading(false)
    }
  }

  const handleCopy = async () => {
    if (!result?.url) return

    try {
      await navigator.clipboard.writeText(result.url)
      setCopied(true)
    } catch (err) {
      console.error(err)
      setError("Could not copy URL.")
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

      <section className="admin-crud-grid admin-crud-grid--single">
        <form className="secure-form admin-panel" onSubmit={handleSubmit}>
          <span className="card-kicker">Protected upload</span>
          <label>
            Image file
            <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>
          <button className="button button--primary" type="submit" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload image"}
          </button>
          {error && <p className="form-status form-status--error">{error}</p>}
        </form>

        {result && (
          <article className="bento-card admin-upload-result">
            <span className="card-kicker">Upload complete</span>
            <h2>{result.filename || "Uploaded file"}</h2>
            <p>{result.url}</p>
            <div className="admin-actions">
              <button className="button button--secondary" type="button" onClick={handleCopy}>
                {copied ? "Copied" : "Copy URL"}
              </button>
            </div>
            {result.bucket && <small>Bucket: {result.bucket}</small>}
          </article>
        )}
      </section>
    </div>
  )
}

export default AdminUploads
