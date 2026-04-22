import { motion } from "framer-motion";

const UPCOMING = {
  title: "Biotech in the South West: Panel Discussion",
  date: "19 June 2026 · 15:00 – 17:30",
  venue: "Exeter · Venue revealed on registration",
  description:
    "A panel event exploring the future of biotech in the region. Confirmed panellists include representatives from Innovate UK and SETsquared, with more speakers to be announced. Capacity is intentionally limited — reach out directly to secure early access before public release.",
  contacts: [
    {
      name: "Wiktor",
      role: "Co-organiser",
      url: "https://linkedin.com/in/wiktor-wiejak",
      initials: "WW",
    },
    {
      name: "Harvey",
      role: "Co-organiser",
      url: "https://www.linkedin.com/in/harvey-mitchell-ba1681206/",
      initials: "HM",
    },
  ],
};

// Draft partner flags hanging from the top of the upcoming-event card.
// All entries are placeholders — drop a `logo` path on each once the
// partnering organisations are confirmed.
const EVENT_PARTNERS = [
  { name: "Partner one (TBC)", url: "#", label: "P1" },
  { name: "Partner two (TBC)", url: "#", label: "P2" },
  { name: "Partner three (TBC)", url: "#", label: "P3" },
  { name: "Partner four (TBC)", url: "#", label: "P4" },
  { name: "Partner five (TBC)", url: "#", label: "P5" },
];

const BANNER = {
  src: "./images/460_460p191_16-10.jpg",
  alt: "Aerial view of the University of Exeter Forum and Northcott Theatre",
};

const PAST_EVENTS = [
  {
    title: "Discovering South West Biotech",
    date: "25 Feb 2026",
    venue: "Exeter Innovation Hub",
    attendees: 34,
    description:
      "Our inaugural meetup bringing together researchers, founders, and biotech-curious minds from across the South West for an evening of talks and networking.",
    url: "https://www.eventbrite.co.uk/e/discovering-south-west-biotech-tickets-1980147469385",
    image: "./images/events/discovering-crowd.jpg",
    imageAlt: "Audience at Discovering South West Biotech event",
  },
  {
    title: "Science to Startup: Into Biotech Entrepreneurship",
    date: "25 Mar 2026",
    venue: "XFi Building, Exeter",
    attendees: 28,
    description:
      "A deep-dive into turning research into ventures — covering funding, IP, and the journey from lab bench to biotech company.",
    url: "https://www.eventbrite.co.uk/e/science-to-startup-into-biotech-entrepreneurship-tickets-1983945836403",
    image: "./images/events/startup-march.jpg",
    imageAlt: "Science to Startup event at XFi Building, Exeter",
  },
];

const card = {
  hidden: { opacity: 0, y: 28 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export default function Events() {
  return (
    <section id="events" className="section section--events">
      <motion.div
        className="section__inner"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-8%" }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="section__title">Events</h2>
        <p className="section__lead">
          We organise meetups across Exeter for people in and around biotech.
          Subscribe to our newsletter to hear about upcoming events first.
        </p>

        {/* Upcoming event banner */}
        <motion.div
          className="upcoming-card glass-card"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-5%" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Banner image (sits behind the hanging flags) */}
          <div className="upcoming-card__banner">
            <img
              src={BANNER.src}
              alt={BANNER.alt}
              className="upcoming-card__banner-img"
              loading="lazy"
            />
            <div className="upcoming-card__banner-overlay" aria-hidden="true" />
          </div>

          {/* Hanging partner flags */}
          <div className="upcoming-flags" aria-label="Partnering organisations">
            {EVENT_PARTNERS.map((p, i) => (
              <a
                key={p.name}
                href={p.url}
                target={p.url === "#" ? undefined : "_blank"}
                rel="noopener noreferrer"
                className="upcoming-flag"
                style={{ "--flag-index": i, "--flag-total": EVENT_PARTNERS.length }}
                title={p.name}
              >
                <span className="upcoming-flag__pennant">
                  {p.logo ? (
                    <img
                      src={p.logo}
                      alt={p.name}
                      className="upcoming-flag__img"
                      loading="lazy"
                    />
                  ) : (
                    <span className="upcoming-flag__placeholder">{p.label}</span>
                  )}
                </span>
              </a>
            ))}
          </div>

          <span className="upcoming-card__badge">Up next</span>
          <h3 className="upcoming-card__title">{UPCOMING.title}</h3>
          <p className="upcoming-card__meta">
            {UPCOMING.date}
            <br />
            <span className="upcoming-card__venue">
              <span className="upcoming-card__lock" aria-hidden="true">🔒</span>
              {UPCOMING.venue}
            </span>
          </p>
          <p className="upcoming-card__desc">{UPCOMING.description}</p>

          <div className="upcoming-cta">
            <p className="upcoming-cta__lead">
              <span className="upcoming-cta__pulse" aria-hidden="true" />
              <span className="upcoming-cta__lead-text">
                Get in touch for{" "}
                <strong>early &amp; exclusive access</strong> — tickets and
                venue are released to our network first.
              </span>
            </p>
            <div className="upcoming-cta__buttons">
              {UPCOMING.contacts.map((c) => (
                <a
                  key={c.name}
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--primary btn--ripple upcoming-cta__btn"
                >
                  <span className="upcoming-cta__avatar" aria-hidden="true">
                    {c.initials}
                  </span>
                  Contact {c.name}
                </a>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Past events */}
        <h3 className="events-sub-heading">Past events</h3>
        <div className="events-grid">
          {PAST_EVENTS.map((evt, i) => (
            <motion.a
              key={evt.url}
              href={evt.url}
              target="_blank"
              rel="noopener noreferrer"
              className="event-card glass-card"
              custom={i}
              variants={card}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-5%" }}
              whileHover={{
                y: -5,
                transition: { type: "spring", stiffness: 260, damping: 20 },
              }}
            >
              <div className="event-card__img-wrap">
                <img
                  src={evt.image}
                  alt={evt.imageAlt}
                  className="event-card__img"
                  loading="lazy"
                />
                <span className="event-card__badge">Past event</span>
              </div>
              <div className="event-card__body">
                <p className="event-card__date">
                  {evt.date} &middot; {evt.venue}
                </p>
                <h3 className="event-card__title">{evt.title}</h3>
                <p className="event-card__desc">{evt.description}</p>
                {evt.attendees && (
                  <p className="event-card__stat">
                    {evt.attendees} attendees
                  </p>
                )}
                <span className="event-card__link">
                  View on Eventbrite &rarr;
                </span>
              </div>
            </motion.a>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
