import useReveal from "../hooks/useReveal";
import useFormSubmit from "../hooks/useFormSubmit";

const ACTION = "https://formspree.io/f/YOUR_NEWSLETTER_FORM_ID";

export default function Newsletter() {
  const ref = useReveal();
  const { handleSubmit, status, error, submitting } = useFormSubmit(
    ACTION,
    "Thanks \u2014 you are on the list."
  );

  return (
    <section id="newsletter" className="section section--newsletter">
      <div className="section__inner reveal" ref={ref}>
        <h2 className="section__title">Stay in the loop</h2>
        <p className="section__lead">
          Occasional emails with event announcements and cluster news. No
          clutter &mdash; unsubscribe any time.
        </p>

        <form className="form form--inline" onSubmit={handleSubmit}>
          <label className="visually-hidden" htmlFor="newsletter-email">
            Email
          </label>
          <input
            id="newsletter-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@organisation.org"
            className="input"
          />
          <input
            type="hidden"
            name="_subject"
            value="SW Biotech newsletter signup"
          />
          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting}
          >
            Subscribe
          </button>
        </form>

        {status && (
          <p
            className="form-hint"
            data-state={error ? "error" : undefined}
          >
            {status}
          </p>
        )}
      </div>
    </section>
  );
}
