function ProjectList({ title, items, emptyMessage }) {
  return (
    <section className="page-section">
      <div className="section-heading">
        <p className="section-label">Selected work</p>
        <h2>{title}</h2>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">{emptyMessage}</div>
      ) : (
        <div className="project-grid">
          {items.map((item) => (
            <article key={item._id} className="project-card">
              <p className="project-type">{item.type || "Project"}</p>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default ProjectList
