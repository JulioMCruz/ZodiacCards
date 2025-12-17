"use client"

import { type SeasonalTheme, SEASONAL_THEMES, isThemeAvailable } from "@/lib/seasonal-themes"
import { Label } from "@/components/ui/label"
import { Sparkles, Snowflake, PartyPopper } from "lucide-react"
import { cn } from "@/lib/utils"

interface SeasonalThemeSelectorProps {
  selectedTheme: SeasonalTheme
  onThemeChange: (theme: SeasonalTheme) => void
  className?: string
}

/**
 * Get theme-specific styling based on theme ID
 */
function getThemeStyles(themeId: SeasonalTheme, isSelected: boolean, available: boolean) {
  if (!available) {
    return {
      border: "border-gray-300",
      bg: "bg-gray-50",
      gradient: "",
      icon: null
    }
  }

  switch (themeId) {
    case 'winter-holidays':
      return {
        border: isSelected ? "border-green-500" : "border-green-200 hover:border-green-300",
        bg: isSelected ? "bg-gradient-to-r from-green-50 to-red-50" : "bg-white",
        gradient: isSelected ? "bg-gradient-to-r from-green-400/10 via-red-400/10 to-green-400/10" : "",
        icon: <Snowflake className="h-5 w-5 text-green-500 flex-shrink-0 animate-pulse" />
      }
    case 'new-year':
      return {
        border: isSelected ? "border-blue-500" : "border-blue-200 hover:border-blue-300",
        bg: isSelected ? "bg-gradient-to-r from-blue-50 to-amber-50" : "bg-white",
        gradient: isSelected ? "bg-gradient-to-r from-blue-400/10 via-amber-400/10 to-blue-400/10" : "",
        icon: <PartyPopper className="h-5 w-5 text-blue-500 flex-shrink-0 animate-pulse" />
      }
    default: // regular
      return {
        border: isSelected ? "border-amber-500" : "border-amber-200 hover:border-amber-300",
        bg: isSelected ? "bg-amber-50" : "bg-white",
        gradient: isSelected ? "bg-gradient-to-r from-amber-400/10 to-amber-600/10" : "",
        icon: <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0 animate-pulse" />
      }
  }
}

/**
 * Get helper text styling based on selected theme
 */
function getHelperTextStyles(theme: SeasonalTheme) {
  switch (theme) {
    case 'winter-holidays':
      return "bg-green-50 border-green-200 text-green-700"
    case 'new-year':
      return "bg-blue-50 border-blue-200 text-blue-700"
    default:
      return "bg-blue-50 border-blue-200 text-gray-500"
  }
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
          const styles = getThemeStyles(theme.id, isSelected, available)

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => available && onThemeChange(theme.id)}
              disabled={!available}
              className={cn(
                "p-4 rounded-lg border-2 transition-all text-left relative overflow-hidden",
                styles.border,
                styles.bg,
                isSelected && "shadow-md",
                !isSelected && available && "hover:shadow-sm",
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
                    {available && theme.id !== 'regular' && (
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        theme.id === 'winter-holidays' && "bg-green-100 text-green-700",
                        theme.id === 'new-year' && "bg-blue-100 text-blue-700"
                      )}>
                        Limited Time
                      </span>
                    )}
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
                {isSelected && available && styles.icon}
              </div>

              {/* Selected Border Glow Effect */}
              {isSelected && styles.gradient && (
                <div className={cn("absolute inset-0 pointer-events-none", styles.gradient)} />
              )}
            </button>
          )
        })}
      </div>

      {/* Helper Text */}
      {selectedTheme !== 'regular' && (
        <div className={cn(
          "text-xs border rounded-lg p-3",
          getHelperTextStyles(selectedTheme)
        )}>
          <span className="font-semibold">
            {selectedTheme === 'winter-holidays' && "❄️ Winter Holidays Active:"}
            {selectedTheme === 'new-year' && "🎆 New Year Active:"}
          </span>{" "}
          Your zodiac character will include festive elements from the {SEASONAL_THEMES.find(t => t.id === selectedTheme)?.name} theme!
        </div>
      )}
    </div>
  )
}
