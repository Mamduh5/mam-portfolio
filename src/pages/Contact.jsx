import PublicHero from "../components/PublicHero"
import SecureContactForm from "../components/SecureContactForm"

function Contact() {
  return (
    <div className="page-stack">
      <PublicHero
        eyebrow={<span className="static-chip">Direct message</span>}
        title="Contact"
        description="Send me a message about a project, collaboration, or question."
      >
        <SecureContactForm />
      </PublicHero>

      <section className="bento-grid bento-grid--two" aria-label="Contact support cards">
        <article className="bento-card bento-card--focus">
          <span className="card-kicker">Contact form</span>
          <h2>Reach me directly</h2>
          <p>Your note is sent to the private admin workspace.</p>
        </article>
        <article className="bento-card bento-card--quiet">
          <span className="card-kicker">Private inbox</span>
          <h2>Messages stay private</h2>
          <p>Messages are stored privately in the admin workspace.</p>
        </article>
      </section>
    </div>
  )
}

export default Contact
