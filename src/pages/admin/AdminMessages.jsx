function AdminMessages() {
  return (
    <div className="page-stack">
      <section className="command-hero admin-hero">
        <span className="static-chip">Owner only</span>
        <div className="command-hero__copy">
          <h1>Messages</h1>
          <p>Placeholder for contact inbox management. Sprint B4 must expose protected message list/read/delete APIs before this page fetches data.</p>
        </div>
      </section>

      <article className="bento-card bento-card--quiet">
        <span className="card-kicker">Waiting for B4</span>
        <h2>No live inbox call yet</h2>
        <p>F2 only builds the protected shell. F3 will wire this page to protected message endpoints.</p>
      </article>
    </div>
  )
}

export default AdminMessages
