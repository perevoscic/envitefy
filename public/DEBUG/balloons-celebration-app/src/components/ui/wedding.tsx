import * as React from "react"
import { cn } from "@/src/lib/utils"
import { motion, AnimatePresence } from "motion/react"

export interface WeddingProps {
  className?: string
  onLaunch?: () => void
}

interface FloatingItem {
  id: number
  x: number
  size: number
  duration: number
  delay: number
  content: string
  rotation: number
  swayAmplitude: number
}

const Wedding = React.forwardRef<any, WeddingProps>(
  ({ className, onLaunch }, ref) => {
    const [items, setItems] = React.useState<FloatingItem[]>([])
    const [isAnimating, setIsAnimating] = React.useState(false)

    const launchAnimation = React.useCallback(() => {
      setIsAnimating(true)
      
      const newItems: FloatingItem[] = []
      const itemCount = 40
      const possibleContents = ["🌸", "🌹", "🕊️", "✨", "🤍"]

      for (let i = 0; i < itemCount; i++) {
        newItems.push({
          id: Math.random(),
          x: Math.random() * 100, // percentage from left
          size: 1.5 + Math.random() * 2, // rem
          duration: 4 + Math.random() * 4, // seconds
          delay: Math.random() * 2, // seconds
          content: possibleContents[Math.floor(Math.random() * possibleContents.length)],
          rotation: Math.random() * 360,
          swayAmplitude: 2 + Math.random() * 5 // horizontal sway
        })
      }

      setItems(newItems)

      if (onLaunch) onLaunch()

      // Reset after animation is mostly done
      setTimeout(() => {
        setIsAnimating(false)
        setItems([])
      }, 8000)
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
                y: "-20vh", 
                opacity: [0, 1, 1, 0],
                x: [
                  `${item.x}vw`, 
                  `${item.x + item.swayAmplitude}vw`, 
                  `${item.x - item.swayAmplitude}vw`, 
                  `${item.x + item.swayAmplitude / 2}vw`
                ],
                rotate: item.rotation + 360
              }}
              exit={{ opacity: 0 }}
              transition={{
                y: { duration: item.duration, delay: item.delay, ease: "linear" },
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
                fontSize: `${item.size}rem`,
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                zIndex: item.content === "🕊️" ? 20 : 10
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
Wedding.displayName = "Wedding"

export { Wedding }
