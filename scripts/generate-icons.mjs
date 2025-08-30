import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const publicDir = path.join(projectRoot, 'public')
const iconsDir = path.join(publicDir, 'icons')

await mkdir(iconsDir, { recursive: true })

const svgPath = path.join(publicDir, 'tb_tab.svg')
const svg = await readFile(svgPath)

const outputs = [
  { size: 192, file: 'icon-192.png' },
  { size: 512, file: 'icon-512.png' },
  { size: 180, file: 'apple-touch-icon.png' },
]

for (const { size, file } of outputs) {
  const outPath = path.join(iconsDir, file)
  await sharp(svg)
    .resize(size, size, { fit: 'contain', withoutEnlargement: false, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(outPath)
  console.log(`Generated ${file} (${size}x${size}) → ${path.relative(projectRoot, outPath)}`)
}

console.log('All icons generated successfully.')
