function AdminUploads() {
  return (
    <div className="page-stack">
      <section className="command-hero admin-hero">
        <span className="static-chip">Owner only</span>
        <div className="command-hero__copy">
          <h1>Uploads</h1>
          <p>Placeholder for protected media upload workflow. Upload UI will be wired after the backend upload response contract is verified.</p>
        </div>
      </section>

      <article className="bento-card bento-card--quiet">
        <span className="card-kicker">Waiting for B4</span>
        <h2>Upload form not wired yet</h2>
        <p>F3 will connect this page to the protected upload endpoint and show returned file URLs.</p>
      </article>
    </div>
  )
}

export default AdminUploads
