import { useEffect, useRef } from 'react'

const GLYPHS =
  'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789$€¥£+-*/=<>'

export function MatrixRain() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const fontSize = 16
    let cols = 0
    let drops: number[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      cols = Math.floor(canvas.width / fontSize)
      drops = Array(cols).fill(0).map(() => Math.random() * -100)
    }
    resize()
    window.addEventListener('resize', resize)

    let raf = 0
    let last = 0
    const frameMs = 60

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw)
      if (t - last < frameMs) return
      last = t

      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.font = `${fontSize}px "JetBrains Mono", monospace`

      for (let i = 0; i < drops.length; i++) {
        const ch = GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length))
        const x = i * fontSize
        const y = drops[i] * fontSize

        ctx.fillStyle = 'rgba(180, 255, 200, 0.95)'
        ctx.fillText(ch, x, y)
        ctx.fillStyle = 'rgba(0, 255, 120, 0.55)'
        ctx.fillText(ch, x, y - fontSize)

        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      }
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="fixed inset-0 pointer-events-none z-0 opacity-40"
    />
  )
}
