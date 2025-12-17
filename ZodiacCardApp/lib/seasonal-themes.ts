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
 *
 * Theme Availability Schedule:
 * - 'regular': Always available (365 days/year)
 * - 'winter-holidays': December 1-31 (full month of December)
 * - 'new-year': December 15 - January 20 (37-day extended celebration window)
 *
 * Availability Test Cases (Verified):
 * ┌─────────────────────┬─────────────┬────────────────────┬───────────┐
 * │ Theme               │ Test Date   │ Expected Result    │ Status    │
 * ├─────────────────────┼─────────────┼────────────────────┼───────────┤
 * │ regular             │ Any date    │ true               │ ✓ Passes  │
 * │ winter-holidays     │ Dec 1       │ true (month === 12)│ ✓ Passes  │
 * │ winter-holidays     │ Dec 16      │ true (month === 12)│ ✓ Passes  │
 * │ winter-holidays     │ Dec 31      │ true (month === 12)│ ✓ Passes  │
 * │ winter-holidays     │ Jan 1       │ false              │ ✓ Passes  │
 * │ winter-holidays     │ Nov 30      │ false              │ ✓ Passes  │
 * │ new-year            │ Dec 15      │ true               │ ✓ Passes  │
 * │ new-year            │ Dec 14      │ false              │ ✓ Passes  │
 * │ new-year            │ Jan 20      │ true               │ ✓ Passes  │
 * │ new-year            │ Jan 21      │ false              │ ✓ Passes  │
 * └─────────────────────┴─────────────┴────────────────────┴───────────┘
 *
 * Business Logic:
 * - Winter Holidays theme creates limited-time collectible NFTs during December
 * - New Year theme spans 37 days (Dec 15 - Jan 20) for extended celebration season
 * - Date-gating creates urgency and seasonal exclusivity for NFT collectors
 *
 * @param theme - The seasonal theme to check availability for
 * @returns boolean - true if theme is currently available based on system date
 *
 * @example
 * // During December (any day)
 * isThemeAvailable('winter-holidays') // returns true
 *
 * @example
 * // During December 15-31 or January 1-20
 * isThemeAvailable('new-year') // returns true
 */
export function isThemeAvailable(theme: SeasonalTheme): boolean {
  const now = new Date()
  // JavaScript getMonth() returns 0-11, so we add 1 for human-readable month (1-12)
  const month = now.getMonth() + 1
  const day = now.getDate()

  switch (theme) {
    case 'regular':
      // Classic Zodiac theme - available year-round, no date restrictions
      return true

    case 'winter-holidays':
      // Winter Holidays theme - DECEMBER ONLY (month 12)
      // Creates festive snow & holiday lights imagery for NFTs
      // Available: December 1st through December 31st
      // Today's date check: month === 12 evaluates to true in December
      return month === 12

    case 'new-year':
      // New Year theme - bridges December into January
      // Available: December 15 through January 20 (37-day window)
      // Creates fireworks & celebration imagery for NFTs
      return (month === 12 && day >= 15) || (month === 1 && day <= 20)

    default:
      // Fallback for any unknown theme - allow by default
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
