import { Smartphone } from 'lucide-react';

/**
 * Phones are portrait-only: a web page cannot stop the device from rotating, so when a
 * touch phone is held in landscape this covers the app and asks to turn it back.
 */
export function RotateToPortraitOverlay() {
  return (
    <div
      role="alert"
      data-testid="rotate-to-portrait-overlay"
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-[#030508] px-6 text-center text-white"
    >
      <Smartphone className="h-12 w-12 rotate-90 text-orange-500" aria-hidden="true" />
      <div className="text-xl font-black uppercase italic">Tourne ton téléphone</div>
      <p className="max-w-xs text-sm text-gray-400">
        Bougnat Darts s’utilise en mode portrait sur téléphone. Ta partie est conservée.
      </p>
    </div>
  );
}
