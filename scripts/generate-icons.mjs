/**
 * Regenerates the PWA / favicon PNGs in public/ from a barbell mark.
 * Run with: node scripts/generate-icons.mjs   (requires the `sharp` devDep)
 */
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const PUB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public')

const barbell = (scale) => {
  const cx = 256
  const s = (v) => cx + (v - cx) * scale
  const w = (v) => v * scale
  return `
    <rect x="${s(150)}" y="${s(236)}" width="${w(212)}" height="${w(40)}" rx="${w(20)}" fill="#3b82f6"/>
    <rect x="${s(116)}" y="${s(188)}" width="${w(38)}" height="${w(136)}" rx="${w(13)}" fill="#3b82f6"/>
    <rect x="${s(80)}"  y="${s(212)}" width="${w(32)}" height="${w(88)}"  rx="${w(12)}" fill="#60a5fa"/>
    <rect x="${s(358)}" y="${s(188)}" width="${w(38)}" height="${w(136)}" rx="${w(13)}" fill="#3b82f6"/>
    <rect x="${s(400)}" y="${s(212)}" width="${w(32)}" height="${w(88)}"  rx="${w(12)}" fill="#60a5fa"/>`
}

const svg = ({ rounded = true, scale = 1 }) => `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" ${rounded ? 'rx="114"' : ''} fill="#0a0f1a"/>
  <g>${barbell(scale)}</g>
</svg>`

const render = (svgStr, size, out) =>
  sharp(Buffer.from(svgStr)).resize(size, size).png().toFile(path.join(PUB, out))

await Promise.all([
  render(svg({ rounded: true }), 192, 'pwa-192.png'),
  render(svg({ rounded: true }), 512, 'pwa-512.png'),
  render(svg({ rounded: false, scale: 0.68 }), 192, 'pwa-maskable-192.png'),
  render(svg({ rounded: false, scale: 0.68 }), 512, 'pwa-maskable-512.png'),
  render(svg({ rounded: false }), 180, 'apple-touch-icon.png'),
  render(svg({ rounded: true }), 32, 'favicon-32.png'),
  render(svg({ rounded: true }), 16, 'favicon-16.png'),
])

console.log('Wrote PWA icons to', PUB)
