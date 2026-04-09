const EVENTBRITE_URL =
  "https://www.eventbrite.co.uk/e/discovering-south-west-biotech-tickets-1980147469385";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <p className="site-footer__brand">South West Biotech</p>
        <p className="site-footer__tag">Biotech cluster &middot; Exeter</p>
        <div className="site-footer__links">
          <a
            href={EVENTBRITE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Eventbrite
          </a>
          <a href="#contact">Contact</a>
        </div>
        <p className="site-footer__legal">
          &copy; {new Date().getFullYear()} South West Biotech. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}
