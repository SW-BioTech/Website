import { useState } from "react";
import { supabase, ensureAnonAuth } from "../../lib/supabase";
import { navigate } from "../../hooks/useHashRoute";

const ADMIN_KEY = "swbio-qa-mod-pass";

export default function QaLanding() {
  const [joinCode, setJoinCode] = useState("");

  // Organiser (admin) state — gated behind the moderator passphrase.
  const [adminPass, setAdminPass] = useState(() => sessionStorage.getItem(ADMIN_KEY) || "");
  const [adminVerified, setAdminVerified] = useState(
    () => Boolean(sessionStorage.getItem(ADMIN_KEY))
  );
  const [showAdmin, setShowAdmin] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [adminError, setAdminError] = useState(null);

  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  function joinPanel(e) {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code) navigate(`#/qa/${code}`);
  }

  async function verifyAdmin(e) {
    e.preventDefault();
    setAdminError(null);
    const pass = adminPass.trim();
    if (!pass) return;
    setVerifying(true);
    try {
      await ensureAnonAuth();
      const { data, error: rpcError } = await supabase.rpc("verify_admin", {
        p_passphrase: pass,
      });
      if (rpcError) throw rpcError;
      if (data === true) {
        sessionStorage.setItem(ADMIN_KEY, pass);
        setAdminVerified(true);
      } else {
        setAdminError("Incorrect passphrase.");
      }
    } catch (err) {
      setAdminError(err.message || "Could not verify. Try again.");
    } finally {
      setVerifying(false);
    }
  }

  async function createPanel(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await ensureAnonAuth();
      const { data, error: rpcError } = await supabase.rpc("create_room", {
        p_passphrase: adminPass,
        p_title: title.trim() || null,
      });
      if (rpcError) throw rpcError;
      navigate(`#/qa/${data}`);
    } catch (err) {
      const msg = /unauthorized/i.test(err.message)
        ? "Your organiser session expired — re-enter the passphrase."
        : err.message || "Could not create the panel. Try again.";
      if (/unauthorized/i.test(err.message)) {
        sessionStorage.removeItem(ADMIN_KEY);
        setAdminVerified(false);
      }
      setError(msg);
      setBusy(false);
    }
  }

  function signOutAdmin() {
    sessionStorage.removeItem(ADMIN_KEY);
    setAdminVerified(false);
    setAdminPass("");
    setShowAdmin(false);
  }

  return (
    <div className="qa-landing">
      <h1 className="qa__title">Live panel Q&amp;A</h1>
      <p className="qa__lead">
        Join a panel to ask questions and upvote the ones you want answered. No
        sign-up needed.
      </p>

      <form className="glass-card qa-landing__card" onSubmit={joinPanel}>
        <h2 className="qa-landing__card-title">Join a panel</h2>
        <p className="qa-landing__card-text">Enter the code shown by the chair.</p>
        <input
          className="input qa-landing__code-input"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          placeholder="e.g. K7M2Q"
          aria-label="Panel code"
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={12}
        />
        <button type="submit" className="btn btn--primary btn--ripple btn--full" disabled={!joinCode.trim()}>
          Join
        </button>
      </form>

      {/* Organiser-only: create a panel (gated behind the passphrase) */}
      {adminVerified ? (
        <form className="glass-card qa-landing__card qa-landing__card--admin" onSubmit={createPanel}>
          <div className="qa-landing__admin-head">
            <h2 className="qa-landing__card-title">Start a panel</h2>
            <button type="button" className="qa-landing__signout" onClick={signOutAdmin}>
              Sign out
            </button>
          </div>
          <p className="qa-landing__card-text">
            Creates a shareable code for your audience.
          </p>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Panel title (optional)"
            aria-label="Panel title"
            maxLength={120}
          />
          <button type="submit" className="btn btn--ghost btn--full" disabled={busy}>
            {busy ? "Creating\u2026" : "Create panel"}
          </button>
          {error && (
            <p className="form-hint" data-state="error">
              {error}
            </p>
          )}
        </form>
      ) : showAdmin ? (
        <form className="glass-card qa-landing__card qa-landing__card--admin" onSubmit={verifyAdmin}>
          <h2 className="qa-landing__card-title">Organiser sign in</h2>
          <p className="qa-landing__card-text">
            Enter the organiser passphrase to start a panel.
          </p>
          <input
            className="input"
            type="password"
            value={adminPass}
            onChange={(e) => setAdminPass(e.target.value)}
            placeholder="Organiser passphrase"
            aria-label="Organiser passphrase"
            autoComplete="off"
          />
          <button type="submit" className="btn btn--ghost btn--full" disabled={verifying || !adminPass.trim()}>
            {verifying ? "Checking\u2026" : "Verify"}
          </button>
          {adminError && (
            <p className="form-hint" data-state="error">
              {adminError}
            </p>
          )}
        </form>
      ) : (
        <button
          type="button"
          className="qa-landing__admin-link"
          onClick={() => setShowAdmin(true)}
        >
          Organiser? Start a panel
        </button>
      )}
    </div>
  );
}
