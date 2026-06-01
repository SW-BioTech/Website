import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import leoProfanity from "leo-profanity";
import { supabase, ensureAnonAuth } from "../../lib/supabase";

const MAX_LEN = 280;
const MOD_KEY = "swbio-qa-mod-pass";

function sortQuestions(list, mode) {
  const copy = [...list];
  if (mode === "new") {
    copy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } else {
    copy.sort(
      (a, b) =>
        b.vote_count - a.vote_count ||
        new Date(a.created_at) - new Date(b.created_at)
    );
  }
  return copy;
}

export default function QaRoom({ roomCode, isMod }) {
  const [userId, setUserId] = useState(null);
  const [room, setRoom] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [myVotes, setMyVotes] = useState(() => new Set());
  const [sortMode, setSortMode] = useState("top");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState(null);

  const [copied, setCopied] = useState(false);
  const [modPass, setModPass] = useState(() => sessionStorage.getItem(MOD_KEY) || "");

  const userIdRef = useRef(null);
  userIdRef.current = userId;

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const uid = await ensureAnonAuth();
        if (!active) return;
        setUserId(uid);

        // Rooms are created only by organisers; an unknown code = not found.
        const { data: roomRow } = await supabase
          .from("rooms")
          .select("code, title")
          .eq("code", roomCode)
          .maybeSingle();
        if (!active) return;
        if (!roomRow) {
          setNotFound(true);
          return;
        }
        setRoom(roomRow);

        const { data: rows, error } = await supabase
          .from("questions")
          .select("id, body, vote_count, created_at")
          .eq("room_code", roomCode);
        if (error) throw error;
        if (active) setQuestions(rows ?? []);

        const { data: voteRows } = await supabase
          .from("votes")
          .select("question_id")
          .eq("user_id", uid);
        if (active && voteRows) {
          setMyVotes(new Set(voteRows.map((v) => v.question_id)));
        }
      } catch (err) {
        if (active) setLoadError(err.message || "Could not load this panel.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [roomCode]);

  // Realtime: new questions, live vote counts, and moderator deletes.
  // NOTE: we deliberately do NOT use a server-side `filter` on room_code.
  // Supabase Realtime only filters UPDATE/DELETE reliably on the primary key,
  // so a non-PK filter silently drops those events (e.g. live vote counts).
  // Instead we subscribe to all question changes and match the room here.
  useEffect(() => {
    const channel = supabase
      .channel(`qa-room-${roomCode}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "questions" },
        (payload) => {
          setQuestions((prev) => {
            if (payload.eventType === "DELETE") {
              // Old row may only carry the primary key, so match on id alone.
              // Our list only ever holds this room, so this is safe.
              return prev.filter((q) => q.id !== payload.old.id);
            }
            // INSERT/UPDATE always include the full new row, so we can scope
            // strictly to this room.
            if (payload.new?.room_code !== roomCode) return prev;
            if (payload.eventType === "INSERT") {
              if (prev.some((q) => q.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            }
            if (payload.eventType === "UPDATE") {
              return prev.map((q) => (q.id === payload.new.id ? { ...q, ...payload.new } : q));
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode]);

  const sorted = useMemo(() => sortQuestions(questions, sortMode), [questions, sortMode]);

  const charsLeft = MAX_LEN - draft.length;

  const submitQuestion = useCallback(
    async (e) => {
      e.preventDefault();
      const body = draft.trim();
      setFormMsg(null);

      if (!body) return;
      if (body.length > MAX_LEN) {
        setFormMsg({ error: true, text: `Please keep it under ${MAX_LEN} characters.` });
        return;
      }
      if (leoProfanity.check(body)) {
        setFormMsg({ error: true, text: "Please rephrase without inappropriate language." });
        return;
      }

      setSubmitting(true);
      try {
        const { data, error } = await supabase
          .from("questions")
          .insert({ room_code: roomCode, body })
          .select("id, body, vote_count, created_at")
          .single();
        if (error) {
          const msg = /rate_limit/i.test(error.message)
            ? "You're posting quickly \u2014 wait a few seconds and try again."
            : error.message;
          setFormMsg({ error: true, text: msg });
        } else {
          // Show it immediately; the realtime handler dedupes by id.
          if (data) {
            setQuestions((prev) =>
              prev.some((q) => q.id === data.id) ? prev : [...prev, data]
            );
          }
          setDraft("");
          setFormMsg({ error: false, text: "Posted \u2014 thanks!" });
        }
      } catch (err) {
        setFormMsg({ error: true, text: err.message || "Could not post. Try again." });
      } finally {
        setSubmitting(false);
      }
    },
    [draft, roomCode]
  );

  const toggleVote = useCallback(async (question) => {
    const uid = userIdRef.current;
    if (!uid) return;
    const id = question.id;
    const hasVoted = myVotes.has(id);

    // Optimistic update; realtime reconciles the authoritative count.
    setMyVotes((prev) => {
      const next = new Set(prev);
      if (hasVoted) next.delete(id);
      else next.add(id);
      return next;
    });
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, vote_count: q.vote_count + (hasVoted ? -1 : 1) } : q
      )
    );

    try {
      if (hasVoted) {
        await supabase.from("votes").delete().eq("question_id", id).eq("user_id", uid);
      } else {
        await supabase.from("votes").insert({ question_id: id });
      }
    } catch {
      // Roll back on failure.
      setMyVotes((prev) => {
        const next = new Set(prev);
        if (hasVoted) next.add(id);
        else next.delete(id);
        return next;
      });
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === id ? { ...q, vote_count: q.vote_count + (hasVoted ? 1 : -1) } : q
        )
      );
    }
  }, [myVotes]);

  const deleteQuestion = useCallback(
    async (id) => {
      if (!modPass) return;
      const { error } = await supabase.rpc("delete_question", {
        p_question_id: id,
        p_passphrase: modPass,
      });
      if (error) {
        window.alert(
          /unauthorized/i.test(error.message)
            ? "Wrong moderator passphrase."
            : error.message
        );
        return;
      }
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    },
    [modPass]
  );

  function copyLink() {
    const link = `${window.location.origin}${window.location.pathname}#/qa/${roomCode}`;
    navigator.clipboard?.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  function saveModPass(value) {
    setModPass(value);
    if (value) sessionStorage.setItem(MOD_KEY, value);
    else sessionStorage.removeItem(MOD_KEY);
  }

  // Organisers carry the passphrase in their session, so they can moderate any
  // room without needing the ?mod=1 hint in the URL.
  const canModerate = isMod || Boolean(modPass);

  if (notFound) {
    return (
      <div className="qa-room">
        <div className="glass-card qa__notice">
          <h1 className="qa__title">Panel not found</h1>
          <p className="qa__lead">
            No panel exists with the code <strong>{roomCode}</strong>. Check the
            code with the organiser, or <a href="#/qa">go back</a>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="qa-room">
      <div className="qa-room__head">
        <div>
          <h1 className="qa__title qa-room__title">{room?.title || "Audience questions"}</h1>
          <p className="qa-room__code">
            Code <strong>{roomCode}</strong>
            <button type="button" className="qa-room__copy" onClick={copyLink}>
              {copied ? "Link copied" : "Copy invite link"}
            </button>
          </p>
        </div>
      </div>

      <form className="glass-card qa-ask" onSubmit={submitQuestion}>
        <label className="visually-hidden" htmlFor="qa-question">
          Your question
        </label>
        <textarea
          id="qa-question"
          className="input input--area qa-ask__area"
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_LEN))}
          placeholder="Ask the panel a question…"
          maxLength={MAX_LEN}
          rows={3}
        />
        <div className="qa-ask__foot">
          <span className={`qa-ask__count ${charsLeft < 20 ? "qa-ask__count--low" : ""}`}>
            {charsLeft}
          </span>
          <button type="submit" className="btn btn--primary btn--ripple" disabled={submitting || !draft.trim()}>
            {submitting ? "Posting\u2026" : "Ask question"}
          </button>
        </div>
        {formMsg && (
          <p className="form-hint" data-state={formMsg.error ? "error" : undefined}>
            {formMsg.text}
          </p>
        )}
      </form>

      {canModerate && (
        <div className="glass-card qa-mod">
          <span className="qa-mod__badge">Moderator</span>
          <input
            className="input qa-mod__input"
            type="password"
            value={modPass}
            onChange={(e) => saveModPass(e.target.value)}
            placeholder="Moderator passphrase"
            aria-label="Moderator passphrase"
            autoComplete="off"
          />
          <p className="qa-mod__hint">
            Enter the passphrase to enable deleting questions. It is checked on
            the server and never stored in the page.
          </p>
        </div>
      )}

      <div className="qa-room__toolbar">
        <span className="qa-room__count">
          {questions.length} {questions.length === 1 ? "question" : "questions"}
        </span>
        <div className="qa-sort" role="group" aria-label="Sort questions">
          <button
            type="button"
            className={`qa-sort__btn ${sortMode === "top" ? "qa-sort__btn--on" : ""}`}
            onClick={() => setSortMode("top")}
          >
            Top
          </button>
          <button
            type="button"
            className={`qa-sort__btn ${sortMode === "new" ? "qa-sort__btn--on" : ""}`}
            onClick={() => setSortMode("new")}
          >
            Newest
          </button>
        </div>
      </div>

      {loading ? (
        <p className="qa-room__empty">Loading questions…</p>
      ) : loadError ? (
        <p className="form-hint" data-state="error">
          {loadError}
        </p>
      ) : sorted.length === 0 ? (
        <p className="qa-room__empty">No questions yet — be the first to ask.</p>
      ) : (
        <ul className="qa-list">
          {sorted.map((q) => {
            const voted = myVotes.has(q.id);
            return (
              <li key={q.id} className="glass-card qa-item">
                <button
                  type="button"
                  className={`qa-vote ${voted ? "qa-vote--on" : ""}`}
                  onClick={() => toggleVote(q)}
                  aria-pressed={voted}
                  aria-label={voted ? "Remove your upvote" : "Upvote this question"}
                >
                  <span className="qa-vote__arrow" aria-hidden="true">
                    &#9650;
                  </span>
                  <span className="qa-vote__count">{q.vote_count}</span>
                </button>
                <p className="qa-item__body">{q.body}</p>
                {modPass && (
                  <button
                    type="button"
                    className="qa-item__delete"
                    onClick={() => deleteQuestion(q.id)}
                    aria-label="Delete question"
                    title="Delete question"
                  >
                    &times;
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
