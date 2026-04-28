export function SonicStripes() {
  return (
    <div aria-hidden className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute inset-0 sonic-stripes" />
      {/* Floating gold rings */}
      {Array.from({ length: 14 }).map((_, i) => {
        const top = (i * 73) % 95
        const left = (i * 137) % 95
        const size = 18 + ((i * 7) % 24)
        const delay = -((i * 0.35) % 1.2)
        return (
          <span
            key={i}
            className="sonic-ring absolute"
            style={{
              top: `${top}%`,
              left: `${left}%`,
              width: size,
              height: size,
              borderRadius: '9999px',
              border: `${Math.max(3, size / 6)}px solid rgba(255, 215, 0, 0.85)`,
              boxShadow: '0 0 10px rgba(255, 215, 0, 0.55)',
              animationDelay: `${delay}s`,
            }}
          />
        )
      })}
    </div>
  )
}
