/*
 * md5.ts — because Web Crypto will not do MD5.
 *
 * Survey networks sign their postbacks with MD5, which is the one hash
 * crypto.subtle deliberately omits (it is broken for collision resistance and
 * has no business being used for anything new). This is not a choice: CPX
 * signs `trans_id-secret` with MD5 and we have to check the same thing they
 * computed. Pre-image resistance is what the check actually leans on, and MD5
 * still has that — but nothing else in this app should use this file.
 */
const S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
]

const K = new Uint32Array(64)
for (let i = 0; i < 64; i += 1) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32)

function hex32le(n: number): string {
  let out = ''
  for (let i = 0; i < 4; i += 1) out += ((n >>> (i * 8)) & 0xff).toString(16).padStart(2, '0')
  return out
}

export function md5(message: string): string {
  const bytes = new TextEncoder().encode(message)
  const padded = new Uint8Array((((bytes.length + 8) >> 6) + 1) << 6)
  padded.set(bytes)
  padded[bytes.length] = 0x80

  const view = new DataView(padded.buffer)
  const bitLen = bytes.length * 8
  view.setUint32(padded.length - 8, bitLen >>> 0, true)
  view.setUint32(padded.length - 4, Math.floor(bitLen / 2 ** 32), true)

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  for (let off = 0; off < padded.length; off += 64) {
    const M = new Uint32Array(16)
    for (let i = 0; i < 16; i += 1) M[i] = view.getUint32(off + i * 4, true)

    let A = a0
    let B = b0
    let C = c0
    let D = d0

    for (let i = 0; i < 64; i += 1) {
      let F: number
      let g: number
      if (i < 16) {
        F = (B & C) | (~B & D)
        g = i
      } else if (i < 32) {
        F = (D & B) | (~D & C)
        g = (5 * i + 1) % 16
      } else if (i < 48) {
        F = B ^ C ^ D
        g = (3 * i + 5) % 16
      } else {
        F = C ^ (B | ~D)
        g = (7 * i) % 16
      }
      F = (F + A + K[i] + M[g]) >>> 0
      A = D
      D = C
      C = B
      B = (B + ((F << S[i]) | (F >>> (32 - S[i])))) >>> 0
    }

    a0 = (a0 + A) >>> 0
    b0 = (b0 + B) >>> 0
    c0 = (c0 + C) >>> 0
    d0 = (d0 + D) >>> 0
  }

  return hex32le(a0) + hex32le(b0) + hex32le(c0) + hex32le(d0)
}

/*
 * Comparison that does not leak where two hashes first differ.
 *
 * Overkill on a hash an attacker cannot compute anyway, but this is the one
 * place a timing signal would be worth having, so it costs nothing to be right.
 */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
