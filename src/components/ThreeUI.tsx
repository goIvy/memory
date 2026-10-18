import { Component, Suspense, lazy, type ReactNode } from "react";
import "@designcodeio/threeui/style.css";

// Component subpaths keep the import graph small; both load after the app shell.
const SylvaHero = lazy(() =>
  import("@designcodeio/threeui/components/SylvaHero").then((m) => ({ default: m.SylvaHero })),
);
const PredictiveArcCanvas = lazy(() =>
  import("@designcodeio/threeui/components/PredictiveArcCanvas").then((m) => ({ default: m.PredictiveArcCanvas })),
);

/** These are decorations: if one fails to load or render, hide it instead of breaking the page. */
class Decoration extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : <Suspense fallback={null}>{this.props.children}</Suspense>;
  }
}

/** ThreeUI's Sylva "Living Green" hero, used exactly as configured. Its page lives in public/landing-pages/. */
export function SylvaIntro() {
  return (
    <section className="sylva-intro" aria-label="Sylva hero">
      <div className="shader-frame">
        <Decoration>
          {/* The npm build has no `variant` prop: SylvaHero always loads Living Green (inner-green-3d.html). */}
          <SylvaHero
            headingFont="lexend"
            bodyFont="lexend"
            headingWeight="300"
            bodyWeight="300"
            primaryColor="#ffffff"
            headingSize={63}
            bodySize={16.5}
            headingLetterSpacing={-0.006}
          />
        </Decoration>
      </div>
      <a className="sylva-cue" href="#make" onClick={scrollToMake}>
        Make flashcards <span aria-hidden>↓</span>
      </a>
    </section>
  );
}

function scrollToMake(e: React.MouseEvent) {
  // The app uses the hash for routing, so scroll without changing it.
  e.preventDefault();
  document.getElementById("make")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** ThreeUI's Predictive Arc, rotated from purple to the app's moss green, as an ambient background. */
export function ArcBackground() {
  return (
    <div className="arc-bg" aria-hidden>
      <Decoration>
        <PredictiveArcCanvas hue={225} saturation={0.75} speed={0.6} brightness={0.9} />
      </Decoration>
    </div>
  );
}
