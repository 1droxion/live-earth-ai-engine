'use client';

const CHECKOUT_URL = 'https://buy.stripe.com/5kQ14ne9pcl4btpg5t7Re03';

const features = [
  ['Message check', 'Paste a suspicious text, email, or DM and review the warning signs before you reply.'],
  ['Link check', 'Check suspicious links and websites before entering passwords, cards, or personal information.'],
  ['Share to Droxion', 'Planned mobile flow: share suspicious content directly into Droxion for a fast risk check.'],
  ['Family alerts', 'Planned family protection can notify a trusted person when a high-risk scam is detected.'],
];

export default function Page() {
  function checkout() {
    window.location.href = CHECKOUT_URL;
  }

  return (
    <main className="shield">
      <header className="nav">
        <div className="brand">DROXION <span>SHIELD</span></div>
        <button onClick={checkout}>Founding Access</button>
      </header>

      <section className="hero">
        <div className="pill">PRE-LAUNCH</div>
        <h1>Protect your family from scams <span>before money is lost.</span></h1>
        <p className="lead">
          Droxion Family Shield is being built to help families check suspicious texts,
          links, emails, screenshots, and online messages before trusting them.
        </p>

        <button className="primary" onClick={checkout}>
          Reserve Founding Access — $9.99
        </button>
        <p className="fine">One-time pre-launch preorder. Refundable if Droxion Family Shield does not launch.</p>

        <div className="demo">
          <div className="phone">
            <div className="muted">Suspicious message</div>
            <div className="bubble">
              “Your bank account is locked. Verify your identity now at secure-bank-help.co”
            </div>
            <div className="share">Share → Droxion</div>
          </div>

          <div className="arrow">→</div>

          <div className="result">
            <div className="risk">HIGH RISK</div>
            <h3>Possible impersonation scam</h3>
            <ul>
              <li>Urgent pressure to act</li>
              <li>Suspicious domain</li>
              <li>Requests sensitive information</li>
            </ul>
            <div className="safe">Safe action: open your bank’s official app directly.</div>
          </div>
        </div>
        <p className="fine">Concept demo only. The finished product is not yet available.</p>
      </section>

      <section className="proof">
        <div><strong>$16B</strong><span>reported U.S. fraud losses in 2025</span></div>
        <div><strong>4M+</strong><span>paying Truecaller subscribers reported in 2026</span></div>
        <div><strong>Family-first</strong><span>designed around checking before sending money or information</span></div>
      </section>

      <section className="features">
        <div className="sectionLabel">PLANNED V1</div>
        <h2>One simple job: help you decide whether to trust it.</h2>
        <div className="grid">
          {features.map(([title, text]) => (
            <article key={title}>
              <div className="icon">✓</div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="founding">
        <div>
          <div className="sectionLabel">FOUNDING FAMILY ACCESS</div>
          <h2>$9.99 once.</h2>
          <p>Reserve early access while we validate and build Droxion Family Shield.</p>
          <ul className="checks">
            <li>One-time preorder</li>
            <li>Founding access</li>
            <li>Refundable if the product does not launch</li>
          </ul>
        </div>

        <div className="checkout">
          <strong>$9.99</strong>
          <span>one-time</span>
          <button onClick={checkout}>Reserve Founding Access</button>
          <p>Secure payment handled by Stripe.</p>
        </div>
      </section>

      <footer>
        <strong>DROXION SHIELD</strong>
        <span>Pre-launch concept. Not a substitute for law enforcement, a bank, or professional fraud investigation.</span>
      </footer>
    </main>
  );
}
