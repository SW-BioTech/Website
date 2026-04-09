import { useCallback, useState } from "react";

export default function useFormSubmit(action, successText) {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const form = e.currentTarget;

      if (action.includes("YOUR_")) {
        setError(true);
        setStatus(
          "Set your Formspree URLs in the source (replace YOUR_NEWSLETTER_FORM_ID / YOUR_CONTACT_FORM_ID)."
        );
        return;
      }

      setSubmitting(true);
      setError(false);
      setStatus("Sending\u2026");

      try {
        const res = await fetch(action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });

        if (res.ok) {
          setStatus(successText);
          setError(false);
          form.reset();
        } else {
          const data = await res.json().catch(() => ({}));
          setError(true);
          setStatus(
            data.error ||
              "Something went wrong. Please try again or email us directly."
          );
        }
      } catch {
        setError(true);
        setStatus("Network error. Check your connection and try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [action, successText]
  );

  return { handleSubmit, status, error, submitting };
}
