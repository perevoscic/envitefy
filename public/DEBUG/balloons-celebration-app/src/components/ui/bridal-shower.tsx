import * as React from "react"
import { cn } from "@/src/lib/utils"
import { motion, AnimatePresence } from "motion/react"

export type BridalShowerType = "petals" | "bubbles" | "bouquets" | "pearls"

export interface BridalShowerProps {
  className?: string
  onLaunch?: () => void
}

interface FloatingItem {
  id: number
  x: number
  size: number
  duration: number
  delay: number
  content: React.ReactNode
  rotation: number
  swayAmplitude: number
  behavior: "float" | "toss"
}

const BridalShower = React.forwardRef<any, BridalShowerProps>(
  ({ className, onLaunch }, ref) => {
    const [items, setItems] = React.useState<FloatingItem[]>([])
    const [isAnimating, setIsAnimating] = React.useState(false)

    const launchAnimation = React.useCallback((type: BridalShowerType = "petals") => {
      setIsAnimating(true)
      
      const newItems: FloatingItem[] = []
      const itemCount = type === "pearls" ? 60 : 30
      
      for (let i = 0; i < itemCount; i++) {
        let content: React.ReactNode = ""
        let sizeRange = [1, 2.5]
        let durationRange = [4, 7]
        const behavior = type === "bouquets" ? "toss" : "float"
        
        if (type === "petals") {
          const petals = ["🌸", "🌹", "🌷", "🌺"]
          content = petals[Math.floor(Math.random() * petals.length)]
          sizeRange = [1.5, 3]
        } else if (type === "bubbles") {
          const bubbles = ["🫧", "🫧", "✨"]
          content = bubbles[Math.floor(Math.random() * bubbles.length)]
          sizeRange = [1, 2]
        } else if (type === "bouquets") {
          content = "💐"
          sizeRange = [2, 4]
          durationRange = [5, 7]
        } else if (type === "pearls") {
          content = (
            <div className="relative">
              <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              {Math.random() > 0.7 && (
                <div className="absolute -top-2 -right-2 text-xs">✨</div>
              )}
            </div>
          )
          sizeRange = [0.5, 1.2]
          durationRange = [6, 10]
        }

        newItems.push({
          id: Math.random(),
          x: Math.random() * 100,
          size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
          duration: durationRange[0] + Math.random() * (durationRange[1] - durationRange[0]),
          delay: Math.random() * 1.5,
          content: content,
          rotation: Math.random() * 360,
          swayAmplitude: 3 + Math.random() * 6,
          behavior
        })
      }

      setItems(newItems)
      if (onLaunch) onLaunch()

      setTimeout(() => {
        setIsAnimating(false)
        setItems([])
      }, 12000)
    }, [onLaunch])

    React.useImperativeHandle(ref, () => ({
      launchAnimation
    }))

    return (
      <div className={cn("fixed inset-0 pointer-events-none z-50 overflow-hidden", className)}>
        <AnimatePresence>
          {isAnimating && items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ y: "110vh", x: `${item.x}vw`, opacity: 0, rotate: item.rotation }}
              animate={{ 
                y: item.behavior === "toss" ? ["110vh", "30vh", "120vh"] : "-20vh", 
                opacity: [0, 1, 1, item.behavior === "toss" ? 1 : 0],
                x: [
                  `${item.x}vw`, 
                  `${item.x + item.swayAmplitude}vw`, 
                  `${item.x - item.swayAmplitude}vw`, 
                  `${item.x + item.swayAmplitude / 2}vw`
                ],
                rotate: item.rotation + (Math.random() > 0.5 ? 360 : -360)
              }}
              exit={{ opacity: 0 }}
              transition={{
                y: { 
                  duration: item.duration, 
                  delay: item.delay, 
                  ease: item.behavior === "toss" ? [0.22, 1, 0.36, 1] : "linear",
                  times: item.behavior === "toss" ? [0, 0.45, 1] : undefined
                },
                opacity: { duration: item.duration, delay: item.delay, times: [0, 0.1, 0.8, 1] },
                x: { 
                  duration: item.duration, 
                  delay: item.delay, 
                  ease: "easeInOut",
                  times: [0, 0.33, 0.66, 1]
                },
                rotate: { duration: item.duration, delay: item.delay, ease: "linear" }
              }}
              style={{
                position: "absolute",
                fontSize: typeof item.content === "string" ? `${item.size}rem` : undefined,
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.05))",
              }}
            >
              {item.content}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    )
  }
)
BridalShower.displayName = "BridalShower"

export { BridalShower }
