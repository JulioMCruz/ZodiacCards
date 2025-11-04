"use client"

import { useEffect, useState, useMemo } from "react"
import { cn } from "@/lib/utils"

interface CollectionLoadingProps {
  className?: string
}

// Collection-themed mystical messages
const COLLECTION_MESSAGES = [
  "Scanning the blockchain cosmos...",
  "Gathering your celestial treasures...",
  "Connecting to the NFT constellation...",
  "Retrieving your cosmic collection...",
  "Aligning with the blockchain stars...",
  "Summoning your digital artifacts...",
  "Reading the NFT signatures...",
  "Consulting the smart contract oracle...",
  "Unveiling your zodiac vault...",
  "Decoding blockchain memories...",
  "Channeling your NFT energies...",
  "Awakening your digital spirits...",
]

export function CollectionLoading({ className }: CollectionLoadingProps) {
  const [currentMessage, setCurrentMessage] = useState(0)
  const [isMounted, setIsMounted] = useState(false)

  // Generate random star positions only on client side
  const starPositions = useMemo(() =>
    Array.from({ length: 20 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 3,
    })),
  [])

  // Set mounted state to true after client hydration
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Rotate through collection messages
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % COLLECTION_MESSAGES.length)
    }, 2500) // Change message every 2.5 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={cn("relative flex flex-col items-center justify-center min-h-[40vh]", className)}>
      {/* Animated starfield background */}
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        <div className="stars-container">
          {/* Only render stars after client-side mount to avoid hydration mismatch */}
          {isMounted && starPositions.map((star, i) => (
            <div
              key={i}
              className="star"
              style={{
                left: `${star.left}%`,
                top: `${star.top}%`,
                animationDelay: `${star.delay}s`,
                animationDuration: `${star.duration}s`,
              }}
            />
          ))}
        </div>

        {/* Zodiac constellation lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="constellation-gradient-collection" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Animated constellation pattern */}
          <g className="constellation-lines">
            <line x1="20%" y1="30%" x2="40%" y2="20%" stroke="url(#constellation-gradient-collection)" strokeWidth="1" />
            <line x1="40%" y1="20%" x2="60%" y2="25%" stroke="url(#constellation-gradient-collection)" strokeWidth="1" />
            <line x1="60%" y1="25%" x2="75%" y2="40%" stroke="url(#constellation-gradient-collection)" strokeWidth="1" />
            <line x1="75%" y1="40%" x2="80%" y2="70%" stroke="url(#constellation-gradient-collection)" strokeWidth="1" />
            <line x1="80%" y1="70%" x2="60%" y2="80%" stroke="url(#constellation-gradient-collection)" strokeWidth="1" />
            <line x1="60%" y1="80%" x2="30%" y2="75%" stroke="url(#constellation-gradient-collection)" strokeWidth="1" />
            <line x1="30%" y1="75%" x2="20%" y2="50%" stroke="url(#constellation-gradient-collection)" strokeWidth="1" />
            <line x1="20%" y1="50%" x2="20%" y2="30%" stroke="url(#constellation-gradient-collection)" strokeWidth="1" />
          </g>

          {/* Constellation points (stars) */}
          <circle cx="20%" cy="30%" r="3" fill="#c084fc" className="constellation-star" />
          <circle cx="40%" cy="20%" r="3" fill="#c084fc" className="constellation-star" />
          <circle cx="60%" cy="25%" r="3" fill="#c084fc" className="constellation-star" />
          <circle cx="75%" cy="40%" r="3" fill="#c084fc" className="constellation-star" />
          <circle cx="80%" cy="70%" r="3" fill="#c084fc" className="constellation-star" />
          <circle cx="60%" cy="80%" r="3" fill="#c084fc" className="constellation-star" />
          <circle cx="30%" cy="75%" r="3" fill="#c084fc" className="constellation-star" />
          <circle cx="20%" cy="50%" r="3" fill="#c084fc" className="constellation-star" />
        </svg>
      </div>

      {/* Central loading content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-6 p-8">
        {/* Animated zodiac wheel */}
        <div className="relative w-24 h-24">
          {/* Outer rotating ring */}
          <div className="absolute inset-0 border-4 border-violet-400/30 rounded-full animate-spin-slow" />

          {/* Inner pulsing circle */}
          <div className="absolute inset-2 border-4 border-violet-500/50 rounded-full animate-pulse" />

          {/* Center glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-violet-400/20 rounded-full animate-ping" />
            <div className="absolute w-8 h-8 bg-violet-500 rounded-full blur-xl animate-pulse" />
          </div>

          {/* Zodiac symbols rotating around */}
          <div className="absolute inset-0 animate-spin-reverse">
            {['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'].map((symbol, i) => (
              <span
                key={i}
                className="absolute text-violet-300 text-xl font-bold"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) rotate(${i * 30}deg) translateY(-45px) rotate(-${i * 30}deg)`,
                }}
              >
                {symbol}
              </span>
            ))}
          </div>
        </div>

        {/* Animated collection message */}
        <div className="text-center space-y-2 min-h-[60px] flex flex-col items-center justify-center">
          <p
            className="text-violet-200 text-lg font-medium animate-fade-in"
            key={currentMessage}
          >
            {COLLECTION_MESSAGES[currentMessage]}
          </p>

          {/* Mystical sparkles */}
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="text-violet-400 animate-twinkle"
                style={{ animationDelay: `${i * 0.3}s` }}
              >
                ✨
              </span>
            ))}
          </div>
        </div>

        {/* Progress indicator dots */}
        <div className="flex space-x-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        .stars-container {
          position: absolute;
          inset: 0;
        }

        .star {
          position: absolute;
          width: 2px;
          height: 2px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 0 6px 2px rgba(255, 255, 255, 0.5);
          animation: twinkle 3s ease-in-out infinite;
        }

        .constellation-lines {
          animation: constellation-pulse 4s ease-in-out infinite;
        }

        .constellation-star {
          animation: star-glow 2s ease-in-out infinite;
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        @keyframes constellation-pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.5; }
        }

        @keyframes star-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; filter: brightness(1.5); }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }

        .animate-spin-reverse {
          animation: spin-reverse 12s linear infinite;
        }

        .animate-twinkle {
          animation: twinkle 1.5s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}
