/**
 * Seasonal Theme System for Zodiac Card Image Generation
 * Allows users to choose between regular and seasonal/holiday themed images
 */

export type SeasonalTheme = 'regular' | 'winter-holidays' | 'new-year'

export interface ThemeOption {
  id: SeasonalTheme
  name: string
  description: string
  emoji: string
  promptModifiers: string
  color: string // Tailwind color for UI theming
}

/**
 * Available seasonal themes with their prompt modifiers
 * These modifiers are appended to the base zodiac image generation prompt
 */
export const SEASONAL_THEMES: ThemeOption[] = [
  {
    id: 'regular',
    name: 'Classic Zodiac',
    description: 'Traditional cosmic and anime style',
    emoji: '⭐',
    promptModifiers: '',
    color: 'amber'
  },
  {
    id: 'winter-holidays',
    name: 'Winter Holidays',
    description: 'Festive December theme with snow & lights',
    emoji: '🎄',
    promptModifiers: 'The mystical cosmic backdrop features elegant white snowflakes falling throughout the scene with detailed crystalline patterns. Festive red and green aurora lights with sophisticated gradients blend beautifully with the purple and blue nebulae. Warm golden holiday lights create a magical winter atmosphere with soft bokeh effects and ethereal glow. Delicate frost patterns add seasonal elegance with fine detail and shimmer. Maintain the mature, semi-realistic anime art style with detailed shading. The elegant character and their majestic spirit animal companion remain the central focus of this festive mystical scene',
    color: 'green'
  },
  {
    id: 'new-year',
    name: 'New Year',
    description: 'Celebration theme with fireworks & sparkles',
    emoji: '🎆',
    promptModifiers: 'The mystical cosmic backdrop features spectacular firework bursts with intricate light trails and particle effects exploding across the starry sky in rich, vibrant colors. Golden and silver metallic confetti with detailed reflections float gracefully through the scene. The nebulae shimmer with enhanced midnight blue and lustrous gold tones, creating an elegant celebration atmosphere with sophisticated lighting. Radiant sparkles and gleaming effects illuminate the scene with refined detail. Maintain the mature, semi-realistic anime art style with detailed shading. The elegant character and their majestic spirit animal companion remain the central focus of this celebratory mystical scene',
    color: 'blue'
  }
]

/**
 * Check if a seasonal theme is currently available based on date
 * @param theme - The seasonal theme to check
 * @returns boolean indicating if theme is available
 */
export function isThemeAvailable(theme: SeasonalTheme): boolean {
  const now = new Date()
  const month = now.getMonth() + 1 // 1-12
  const day = now.getDate()

  switch (theme) {
    case 'regular':
      return true // Always available

    case 'winter-holidays':
      // Available during December
      return month === 12

    case 'new-year':
      // Available from December 25 to January 7
      return (month === 12 && day >= 25) || (month === 1 && day <= 7)

    default:
      return true
  }
}

/**
 * Get the theme option by ID
 * @param themeId - The theme ID
 * @returns ThemeOption or undefined
 */
export function getThemeById(themeId: SeasonalTheme): ThemeOption | undefined {
  return SEASONAL_THEMES.find(theme => theme.id === themeId)
}

/**
 * Get all currently available themes
 * @returns Array of available ThemeOptions
 */
export function getAvailableThemes(): ThemeOption[] {
  return SEASONAL_THEMES.filter(theme => isThemeAvailable(theme.id))
}

/**
 * Get the default theme (first available theme)
 * @returns Default SeasonalTheme
 */
export function getDefaultTheme(): SeasonalTheme {
  const available = getAvailableThemes()
  return available.length > 0 ? available[0].id : 'regular'
}

/**
 * Build the complete image generation prompt with seasonal modifiers
 * @param basePrompt - The base zodiac prompt
 * @param theme - The selected seasonal theme
 * @returns Complete prompt with seasonal modifiers
 */
export function buildSeasonalPrompt(basePrompt: string, theme: SeasonalTheme): string {
  const themeOption = getThemeById(theme)

  if (!themeOption || !themeOption.promptModifiers) {
    return basePrompt
  }

  // Replace the backdrop description with seasonal version
  const backdropStart = basePrompt.indexOf('Both figures are surrounded by a mesmerizing cosmic backdrop')
  const balanceIndex = basePrompt.indexOf('The artwork should maintain a perfect balance')

  if (backdropStart === -1 || balanceIndex === -1) {
    // Fallback: append at the end
    return `${basePrompt}\n\n${themeOption.promptModifiers}`
  }

  // Replace backdrop description with seasonal version
  const beforeBackdrop = basePrompt.substring(0, backdropStart)
  const balanceStatement = basePrompt.substring(balanceIndex)

  return `${beforeBackdrop}Both figures are surrounded by a mesmerizing cosmic setting. ${themeOption.promptModifiers}\n\n${balanceStatement}`
}
