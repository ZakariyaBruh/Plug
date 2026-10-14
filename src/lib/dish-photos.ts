import data from './dish-photos.json'

/*
 * A real photograph for most dish pages, chosen by scripts/dish-photos.mjs
 * from Wikipedia's article on the dish and credited the way its licence asks.
 * Server-side only: the page is handed the one photo it needs.
 */
export type DishPhoto = {
  src: string
  ext: 'jpg' | 'png'
  width: number
  height: number
  credit: string
  license: string
  licenseUrl: string
  page: string
  cuisine: string | null
}

const PHOTOS = (data as { photos: Record<string, DishPhoto> }).photos

export function photoFor(slug: string): DishPhoto | null {
  return PHOTOS[slug] ?? null
}

/** Where the page shows it: this site, never Wikimedia directly. */
export function photoPath(slug: string, photo: DishPhoto, width?: 500 | 960) {
  return `/photos/${slug}${width ? `-${width}` : ''}.${photo.ext}`
}

/*
 * Smaller copies for phones: Wikimedia keeps the same photo at standard
 * widths, so the 1280-pixel address with "960px-" in place of "1280px-" is
 * the same picture at 960. A photo whose original is narrower has no such
 * copies, and gets the one it has.
 */
export const PHOTO_WIDTHS = [500, 960] as const
export function upstreamFor(photo: DishPhoto, width?: number) {
  return width && photo.src.includes('/1280px-') ? photo.src.replace('/1280px-', `/${width}px-`) : photo.src
}
