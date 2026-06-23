export function ZodiacWheelPointer() {
  return (
    <div
      className="absolute top-0 left-1/2 -translate-x-1/2 z-20 pointer-events-none scale-110 sm:scale-125"
      aria-hidden
    >
      <div className="flex flex-col items-center">
        <div className="w-1 h-2 rounded-full bg-[var(--color-accent-daily)]/80" />
        <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent border-t-[var(--color-accent-daily)] drop-shadow-[0_0_8px_rgba(232,213,163,0.6)]" />
      </div>
    </div>
  );
}
