function AdminProjects() {
  return (
    <div className="page-stack">
      <section className="command-hero admin-hero">
        <span className="static-chip">Owner only</span>
        <div className="command-hero__copy">
          <h1>Projects</h1>
          <p>Placeholder for creating, editing, and deleting project/game entries after Sprint B4 finalizes protected CRUD APIs.</p>
        </div>
      </section>

      <article className="bento-card bento-card--quiet">
        <span className="card-kicker">Waiting for B4</span>
        <h2>CRUD form not wired yet</h2>
        <p>F3 will connect this page to protected project mutation endpoints with inline validation states.</p>
      </article>
    </div>
  )
}

export default AdminProjects
