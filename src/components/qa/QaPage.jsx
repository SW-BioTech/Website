import useHashRoute from "../../hooks/useHashRoute";
import { isSupabaseConfigured } from "../../lib/supabase";
import QaLanding from "./QaLanding";
import QaRoom from "./QaRoom";

export default function QaPage() {
  const { segments, query } = useHashRoute();
  // segments[0] === "qa"; segments[1] is the optional room code.
  const roomCode = segments[1] ? segments[1].toUpperCase() : null;
  const isMod = query.mod === "1" || query.mod === "true";

  return (
    <main className="qa">
      <div className="qa__inner">
        <header className="qa__bar">
          <a className="qa__home" href="#/" aria-label="Back to SW Biotech home">
            <span aria-hidden="true">&larr;</span> SW Biotech
          </a>
          <span className="qa__bar-tag">Live Q&amp;A</span>
        </header>

        {!isSupabaseConfigured ? (
          <div className="glass-card qa__notice">
            <h1 className="qa__title">Live Q&amp;A isn&rsquo;t configured yet</h1>
            <p className="qa__lead">
              Set <code>VITE_SUPABASE_URL</code> and{" "}
              <code>VITE_SUPABASE_ANON_KEY</code> (see <code>.env.example</code>{" "}
              and <code>supabase/schema.sql</code>) to enable this page.
            </p>
          </div>
        ) : roomCode ? (
          <QaRoom roomCode={roomCode} isMod={isMod} />
        ) : (
          <QaLanding />
        )}
      </div>
    </main>
  );
}
