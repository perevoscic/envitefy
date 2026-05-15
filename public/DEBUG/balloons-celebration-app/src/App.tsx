import { Balloons } from "@/src/components/ui/balloons"
import { Graduation } from "@/src/components/ui/graduation"
import { Wedding } from "@/src/components/ui/wedding"
import { BridalShower, BridalShowerType } from "@/src/components/ui/bridal-shower"
import { Button } from "@/src/components/ui/button"
import { useRef } from "react"
import { PartyPopper, GraduationCap, Heart, Flower, Sparkles, Wine } from "lucide-react"

export default function App() {
  const balloonsRef = useRef<{ launchAnimation: () => void } | null>(null)
  const graduationRef = useRef<{ launchAnimation: () => void } | null>(null)
  const weddingRef = useRef<{ launchAnimation: () => void } | null>(null)
  const bridalShowerRef = useRef<{ launchAnimation: (type: BridalShowerType) => void } | null>(null)

  const handleLaunchBalloons = () => {
    if (balloonsRef.current) {
      balloonsRef.current.launchAnimation()
    }
  }

  const handleLaunchHats = () => {
    if (graduationRef.current) {
      graduationRef.current.launchAnimation()
    }
  }

  const handleLaunchWedding = () => {
    if (weddingRef.current) {
      weddingRef.current.launchAnimation()
    }
  }

  const handleLaunchBridal = (type: BridalShowerType) => {
    if (bridalShowerRef.current) {
      bridalShowerRef.current.launchAnimation(type)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4 bg-background text-foreground">
      <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4">
        <Button 
          onClick={handleLaunchBalloons}
          size="lg"
          className="rounded-full px-8 py-6 text-lg font-semibold transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center gap-2"
        >
          <PartyPopper className="w-6 h-6" />
          Launch Balloons! 🎈
        </Button>

        <Button 
          onClick={handleLaunchHats}
          variant="outline"
          size="lg"
          className="rounded-full px-8 py-6 text-lg font-semibold transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center gap-2 border-primary text-primary hover:bg-primary/10"
        >
          <GraduationCap className="w-6 h-6" />
          Launch Grad Hats! 🎓
        </Button>

        <Button 
          onClick={handleLaunchWedding}
          variant="secondary"
          size="lg"
          className="rounded-full px-8 py-6 text-lg font-semibold transition-all hover:scale-105 active:scale-95 shadow-xl flex items-center gap-2 bg-[#B76E79] text-white hover:bg-[#A65E69] border-none"
        >
          <Heart className="w-6 h-6 fill-current" />
          Rose Petals & Doves 🕊️
        </Button>
      </div>

      <div className="flex flex-col items-center gap-4">
        <h2 className="text-xl font-bold text-[#B76E79]">Bridal Shower Celebration</h2>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button 
            onClick={() => handleLaunchBridal("bouquets")}
            variant="outline"
            className="rounded-full px-6 py-4 transition-all hover:scale-105 active:scale-95 shadow-lg border-[#98FB98] text-[#2E8B57] hover:bg-[#F0FFF0]"
          >
            Toss Bouquets! 💐
          </Button>
        </div>
      </div>

      <Balloons 
        ref={balloonsRef}
        type="default"
      />

      <Graduation 
        ref={graduationRef}
        type="default"
      />

      <Wedding 
        ref={weddingRef}
      />

      <BridalShower 
        ref={bridalShowerRef}
      />
    </div>
  )
}

