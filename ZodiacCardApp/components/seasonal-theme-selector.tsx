"use client"

import { type SeasonalTheme, SEASONAL_THEMES, isThemeAvailable } from "@/lib/seasonal-themes"
import { Label } from "@/components/ui/label"
import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface SeasonalThemeSelectorProps {
  selectedTheme: SeasonalTheme
  onThemeChange: (theme: SeasonalTheme) => void
  className?: string
}

export function SeasonalThemeSelector({
  selectedTheme,
  onThemeChange,
  className
}: SeasonalThemeSelectorProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-gray-800 font-semibold">
        Image Style
      </Label>
      <p className="text-sm text-gray-600 -mt-1">
        Choose your preferred style for the generated image
      </p>

      <div className="grid grid-cols-1 gap-3">
        {SEASONAL_THEMES.map((theme) => {
          const available = isThemeAvailable(theme.id)
          const isSelected = selectedTheme === theme.id

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => available && onThemeChange(theme.id)}
              disabled={!available}
              className={cn(
                "p-4 rounded-lg border-2 transition-all text-left relative overflow-hidden",
                isSelected
                  ? "border-amber-500 bg-amber-50 shadow-md"
                  : "border-amber-200 bg-white hover:border-amber-300 hover:shadow-sm",
                !available && "opacity-50 cursor-not-allowed grayscale"
              )}
            >
              <div className="flex items-center gap-3">
                {/* Emoji Icon */}
                <span className="text-3xl flex-shrink-0">{theme.emoji}</span>

                {/* Theme Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 flex items-center gap-2">
                    {theme.name}
                    {!available && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                        Seasonal
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-0.5">
                    {theme.description}
                  </div>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0 animate-pulse" />
                )}
              </div>

              {/* Selected Border Glow Effect */}
              {isSelected && (
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 to-amber-600/10 pointer-events-none" />
              )}
            </button>
          )
        })}
      </div>

      {/* Helper Text */}
      {selectedTheme !== 'regular' && (
        <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <span className="font-semibold">✨ Seasonal Theme Active:</span> Your zodiac character will include festive elements from the {SEASONAL_THEMES.find(t => t.id === selectedTheme)?.name} theme!
        </div>
      )}
    </div>
  )
}
