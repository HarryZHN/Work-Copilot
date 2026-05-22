export const DEEP_COLORS = [
  '#1E40AF', '#1C4CA6', '#7C2D12', '#134E4A', '#581C87',
  '#4D1F00', '#0C4A6E', '#1E293B', '#3B0764', '#1F1F1F',
  '#0F4C5C', '#5E2B00', '#4C0519', '#0D3B66', '#1A365D',
  '#2D1B69', '#3C1642', '#2B2D42', '#1A120B', '#0E46A3'
]

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 255, g: 255, b: 255 }
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

function lighten(hex: string, factor: number): string {
  const rgb = hexToRgb(hex)
  const r = Math.min(255, rgb.r + (255 - rgb.r) * factor)
  const g = Math.min(255, rgb.g + (255 - rgb.g) * factor)
  const b = Math.min(255, rgb.b + (255 - rgb.b) * factor)
  return rgbToHex(r, g, b)
}

function getLuminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

export function getTaskColor(id: string, completed: boolean): string {
  const hash = simpleHash(id)
  let color = DEEP_COLORS[hash % DEEP_COLORS.length]
  if (completed) {
    return lighten(color, 0.75)
  }
  return color
}

export function getTaskTextColor(bgColor: string): string {
  const rgb = hexToRgb(bgColor)
  const luminance = getLuminance(rgb.r, rgb.g, rgb.b)
  return luminance > 0.5 ? '#1a1a1a' : '#ffffff'
}
