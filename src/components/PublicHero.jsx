function PublicHero({ eyebrow, title, description, children, actions, className = "" }) {
  return (
    <section className={`public-hero${className ? ` ${className}` : ""}`}>
      {eyebrow && <div className="public-hero__eyebrow">{eyebrow}</div>}
      <div className="public-hero__copy">
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="public-hero__body">{children}</div>}
      {actions && <div className="public-hero__actions">{actions}</div>}
    </section>
  )
}

export default PublicHero
