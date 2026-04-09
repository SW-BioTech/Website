import useReveal from "../hooks/useReveal";
import useFormSubmit from "../hooks/useFormSubmit";

const ACTION = "https://formspree.io/f/YOUR_CONTACT_FORM_ID";

export default function Contact() {
  const ref = useReveal();
  const { handleSubmit, status, error, submitting } = useFormSubmit(
    ACTION,
    "Thank you. We will be in touch soon."
  );

  return (
    <section id="contact" className="section section--contact">
      <div className="section__inner reveal" ref={ref}>
        <h2 className="section__title">Say hello</h2>
        <p className="section__lead">
          Partnerships, speaking, venue ideas, or general questions &mdash; send
          a note and we will get back to you.
        </p>

        <form className="form form--stack" onSubmit={handleSubmit}>
          <input
            type="hidden"
            name="_subject"
            value="SW Biotech website inquiry"
          />
          <div className="form__row">
            <div className="field">
              <label htmlFor="contact-name">Name</label>
              <input
                id="contact-name"
                name="name"
                type="text"
                required
                autoComplete="name"
                className="input"
              />
            </div>
            <div className="field">
              <label htmlFor="contact-email">Email</label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="input"
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              name="message"
              rows="5"
              required
              className="input input--area"
            />
          </div>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting}
          >
            Send message
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
