export const DEEP_COLORS = [
  '#FF8A80', '#FF80AB', '#EA80FC', '#B388FF', '#8C9EFF',
  '#82B1FF', '#80D8FF', '#84FFFF', '#B9F6CA', '#CCFF90',
  '#F4FF81', '#FFFF8D', '#FFE57F', '#FFD180', '#FF9E80',
  '#A5D6A7', '#81D4FA', '#FFAB91', '#CE93D8', '#90CAF9'
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
