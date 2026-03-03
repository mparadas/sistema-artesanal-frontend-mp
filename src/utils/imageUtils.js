import { IMAGES_BASE_URL } from '../config'

const DEFAULT_PRODUCT_IMAGE = '/logo_agromae.png'
const BACKEND_ORIGIN = IMAGES_BASE_URL.replace(/\/uploads\/?$/, '')

export const getImageUrl = (imagePath) => {
  const raw = String(imagePath || '').trim()
  if (!raw) return DEFAULT_PRODUCT_IMAGE

  if (/^data:image\//i.test(raw)) return raw

  if (/^https?:\/\//i.test(raw)) {
    if (/localhost|127\.0\.0\.1|192\.168\./i.test(raw)) {
      try {
        const source = new URL(raw)
        return `${BACKEND_ORIGIN}${source.pathname}${source.search || ''}`
      } catch {
        return raw
      }
    }
    if (/^http:\/\//i.test(raw) && /agromae-b\.onrender\.com/i.test(raw)) {
      return raw.replace(/^http:\/\//i, 'https://')
    }
    return raw
  }

  const normalized = raw.replace(/^\/+/, '')
  if (normalized.startsWith('uploads/')) {
    return `${BACKEND_ORIGIN}/${normalized}`
  }

  if (raw.startsWith('/')) {
    return `${BACKEND_ORIGIN}${raw}`
  }

  return `${IMAGES_BASE_URL.replace(/\/+$/, '')}/${normalized}`
}

export const isValidImageUrl = (url) => {
  const value = String(url || '').trim()
  if (!value) return false
  return /^https?:\/\//i.test(value) || value.startsWith('/') || /^data:image\//i.test(value)
}
