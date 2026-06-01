import { useEffect, useState } from "react";

// Hash-based routing keeps GitHub Pages happy (no 404s on refresh of deep links).
// "#/qa/ABC123?mod=1" -> { segments: ["qa", "ABC123"], query: { mod: "1" } }
export function parseHash() {
  const raw = window.location.hash.replace(/^#/, "");
  const [path = "", queryString = ""] = raw.split("?");
  const segments = path.split("/").filter(Boolean);
  const query = Object.fromEntries(new URLSearchParams(queryString));
  return { segments, query };
}

export default function useHashRoute() {
  const [route, setRoute] = useState(parseHash);

  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return route;
}

export function navigate(hash) {
  window.location.hash = hash;
}
