import CommandHero from "../components/CommandHero"
import RouteChip from "../components/RouteChip"
import SecureContactForm from "../components/SecureContactForm"

function Contact() {
  return (
    <div className="page-stack">
      <CommandHero
        eyebrow={<RouteChip method="POST" path="/messages" />}
        title="Secure uplink"
        description="Send a direct message through the public contact endpoint."
      >
        <SecureContactForm />
      </CommandHero>

      <section className="bento-grid bento-grid--two" aria-label="Contact support cards">
        <article className="bento-card bento-card--focus">
          <span className="card-kicker">Contact protocol</span>
          <h2>Form first, status second</h2>
          <p>Inline sent/error states replace browser alerts and preserve the message on failure.</p>
        </article>
        <article className="bento-card bento-card--quiet">
          <span className="card-kicker">Inbox preview</span>
          <h2>Admin later</h2>
          <p>Message management can remain private and should not clutter the public route.</p>
        </article>
      </section>
    </div>
  )
}

export default Contact
