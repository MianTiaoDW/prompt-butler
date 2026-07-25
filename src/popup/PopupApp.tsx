import { OverlayApp } from "../content/OverlayApp";

export function PopupApp() {
  return (
    <main className="h-full w-full overflow-hidden bg-canvas p-3 text-primary">
      <OverlayApp embedded />
    </main>
  );
}
