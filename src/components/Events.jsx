import useReveal from "../hooks/useReveal";

const EVENTBRITE_URL =
  "https://www.eventbrite.co.uk/e/discovering-south-west-biotech-tickets-1980147469385";

export default function Events() {
  const ref = useReveal();

  return (
    <section id="events" className="section section--events">
      <div className="section__inner section__inner--split reveal" ref={ref}>
        <div>
          <h2 className="section__title">Events</h2>
          <p className="section__lead">
            We list meetups and gatherings on Eventbrite &mdash; grab a ticket,
            say hello, and bring your story.
          </p>
        </div>

        <div className="events-card">
          <p className="events-card__label">Featured platform</p>
          <p className="events-card__title">Discovering South West Biotech</p>
          <p className="events-card__meta">
            Exeter Innovation Hub &middot; organised by SW Biotech
          </p>
          <a
            className="btn btn--primary btn--full"
            href={EVENTBRITE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Eventbrite
          </a>
        </div>
      </div>
    </section>
  );
}
