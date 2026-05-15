import * as React from "react"
import { cn } from "@/src/lib/utils"
import confetti from "canvas-confetti"

export interface GraduationProps {
  type?: "default" | "text"
  text?: string
  fontSize?: number
  color?: string
  className?: string
  onLaunch?: () => void
}

const Graduation = React.forwardRef<HTMLDivElement, GraduationProps>(
  ({ type = "default", text, fontSize = 120, color = "#000000", className, onLaunch }, ref) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    
    const launchAnimation = React.useCallback(() => {
      if (type === "default") {
        // Graduation cap throwing animation from bottom up
        const scalar = 5
        const graduationCap = confetti.shapeFromText({ text: '🎓', scalar })

        const defaults = {
          spread: 360,
          ticks: 120,
          gravity: 0.5,
          decay: 0.96,
          startVelocity: 30,
          shapes: [graduationCap],
          scalar,
          origin: { x: 0.5, y: 1 }
        }

        const shoot = () => {
          confetti({
            ...defaults,
            particleCount: 30
          })

          confetti({
            ...defaults,
            particleCount: 5,
            flat: true
          })

          confetti({
            ...defaults,
            particleCount: 15,
            scalar: scalar / 2,
            shapes: ['circle']
          })
        }

        setTimeout(shoot, 0)
        setTimeout(shoot, 100)
        setTimeout(shoot, 200)
      } else if (type === "text" && text) {
        // Text-based graduation celebration
        const canvas = document.createElement('canvas')
        canvas.style.position = 'fixed'
        canvas.style.top = '0'
        canvas.style.left = '0'
        canvas.style.width = '100%'
        canvas.style.height = '100%'
        canvas.style.pointerEvents = 'none'
        canvas.style.zIndex = '9999'
        document.body.appendChild(canvas)

        const ctx = canvas.getContext('2d')
        if (ctx) {
          canvas.width = window.innerWidth
          canvas.height = window.innerHeight

          ctx.font = `${fontSize}px Arial`
          ctx.fillStyle = color
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'

          let opacity = 1
          let y = window.innerHeight / 2
          let scale = 0.5

          const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            
            if (opacity > 0 && scale < 1.5) {
              ctx.save()
              ctx.globalAlpha = opacity
              ctx.translate(canvas.width / 2, y)
              ctx.scale(scale, scale)
              ctx.fillText(text, 0, 0)
              ctx.restore()

              scale += 0.02
              if (scale > 1) {
                opacity -= 0.01
              }
              
              requestAnimationFrame(animate)
            } else {
              if (document.body.contains(canvas)) {
                document.body.removeChild(canvas)
              }
            }
          }

          animate()
        }

        // Add confetti with text
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#000000', '#FFD700', '#C0C0C0']
        })
      }
      
      if (onLaunch) {
        onLaunch()
      }
    }, [type, text, fontSize, color, onLaunch])

    React.useImperativeHandle(ref, () => {
      const element = containerRef.current as HTMLDivElement | null
      if (element) {
        return Object.assign(element, { launchAnimation })
      }
      return element as HTMLDivElement
    }, [launchAnimation])

    return <div ref={containerRef} className={cn("graduation-container", className)} />
  }
)
Graduation.displayName = "Graduation"

export { Graduation }
