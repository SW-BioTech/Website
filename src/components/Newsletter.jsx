import { motion } from "framer-motion";
import useFormSubmit from "../hooks/useFormSubmit";

const ACTION = "https://formspree.io/f/YOUR_NEWSLETTER_FORM_ID";

export default function Newsletter() {
  const { handleSubmit, status, error, submitting } = useFormSubmit(
    ACTION,
    "Thanks \u2014 you are on the list."
  );

  return (
    <section id="newsletter" className="section section--newsletter">
      <motion.div
        className="section__inner"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10%" }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
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
            className="btn btn--primary btn--ripple"
            disabled={submitting}
          >
            Subscribe
          </button>
        </form>

        {status && (
          <p className="form-hint" data-state={error ? "error" : undefined}>
            {status}
          </p>
        )}
      </motion.div>
    </section>
  );
}
