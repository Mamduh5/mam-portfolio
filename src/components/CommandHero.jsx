function CommandHero({ eyebrow, title, description, children, actions, className = "" }) {
  return (
    <section className={`command-hero${className ? ` ${className}` : ""}`}>
      {eyebrow && <div className="command-hero__eyebrow">{eyebrow}</div>}
      <div className="command-hero__copy">
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="command-hero__body">{children}</div>}
      {actions && <div className="command-hero__actions">{actions}</div>}
    </section>
  )
}

export default CommandHero
