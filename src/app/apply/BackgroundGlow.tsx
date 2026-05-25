export function BackgroundGlow() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-zinc-950" />
      <div
        className="absolute -top-32 left-1/2 h-[640px] w-[820px] -translate-x-1/2 rounded-full opacity-50 blur-[140px]"
        style={{ background: 'radial-gradient(closest-side, oklch(0.696 0.17 162.48 / 0.30), transparent 70%)' }}
      />
      <div
        className="absolute bottom-[-220px] right-[-140px] h-[520px] w-[520px] rounded-full opacity-40 blur-[160px]"
        style={{ background: 'radial-gradient(closest-side, oklch(0.696 0.17 162.48 / 0.20), transparent 70%)' }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.04),transparent_40%)]" />
    </div>
  );
}
