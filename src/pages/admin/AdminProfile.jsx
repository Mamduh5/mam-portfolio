function AdminProfile() {
  return (
    <div className="page-stack">
      <section className="command-hero admin-hero">
        <span className="static-chip">Owner only</span>
        <div className="command-hero__copy">
          <h1>Profile</h1>
          <p>Placeholder for owner-only profile editing. Public profile reads should remain available after B4.</p>
        </div>
      </section>

      <article className="bento-card bento-card--quiet">
        <span className="card-kicker">Waiting for B4</span>
        <h2>Profile editor not wired yet</h2>
        <p>F3 will add the editable form after the protected profile update API is confirmed.</p>
      </article>
    </div>
  )
}

export default AdminProfile
