export type StudyMode = "flip" | "quiz" | "type";

export type Route = { name: "home" } | { name: "deck"; id: string } | { name: "study"; id: string; mode: StudyMode };

export function parseHash(): Route {
  const [, view, id, mode] = window.location.hash.split("/");
  if (view === "deck" && id) return { name: "deck", id };
  if (view === "study" && id && (mode === "flip" || mode === "quiz" || mode === "type")) return { name: "study", id, mode };
  return { name: "home" };
}

export function go(route: Route) {
  window.location.hash =
    route.name === "home" ? "#/" : route.name === "deck" ? `#/deck/${route.id}` : `#/study/${route.id}/${route.mode}`;
}
