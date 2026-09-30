import type { View } from "@/lib/youcam/features";

// Pictograms for the four capture poses YouCam's hair detectors expect.
export function PoseIcon({ view, className }: { view: View; className?: string }) {
  const face = {
    front: <ellipse cx="32" cy="30" rx="11" ry="13" />,
    right: <path d="M24 18c8-3 16 2 17 12s-5 14-11 14c-4 0-7-3-7-3" />,
    left: <path d="M40 18c-8-3-16 2-17 12s5 14 11 14c4 0 7-3 7-3" />,
    down: <path d="M21 26c0-8 5-12 11-12s11 4 11 12c0 5-4 9-11 11-7-2-11-6-11-11Z" />,
  }[view];
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 58c3-9 11-13 22-13s19 4 22 13" />
      {face}
      {view === "right" && <path d="M48 12l6 6-6 6M54 18H42" />}
      {view === "left" && <path d="M16 12l-6 6 6 6M10 18h12" />}
      {view === "down" && <path d="M52 10v12M47 17l5 5 5-5" />}
      {view === "front" && <path d="M22 50v8M42 50v8" strokeDasharray="2 3" />}
    </svg>
  );
}

export const CAPTURE_STEPS: { view: View; title: string; how: string; unlocks: string; required?: boolean }[] = [
  { view: "front", title: "Straight on", how: "Look at the camera, hair down in front of your shoulders.", unlocks: "Length", required: true },
  { view: "right", title: "Turn right", how: "Turn your head to your right like saying “no”. Keep it level.", unlocks: "Curl pattern · frizz" },
  { view: "left", title: "Turn left", how: "Same, to your left. Face stays in the frame.", unlocks: "Curl pattern · frizz" },
  { view: "down", title: "Chin down", how: "Face the camera, then lower your chin so your hairline faces the lens.", unlocks: "Density" },
];
