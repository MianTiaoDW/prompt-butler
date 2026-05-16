import { OverlayApp } from "../content/OverlayApp";

export function PopupApp() {
  return (
    <main className="h-full w-full overflow-hidden bg-accent-radial p-3 text-white">
      <OverlayApp embedded />
    </main>
  );
}
