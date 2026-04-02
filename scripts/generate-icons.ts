import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join } from 'path';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create a simple SVG icon with a phone/repair theme
const createSvgIcon = (size: number): string => {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#16a34a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#15803d;stop-opacity:1" />
        </linearGradient>
      </defs>

      <!-- Background circle -->
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="url(#bg)"/>

      <!-- Phone shape -->
      <rect x="${size*0.3}" y="${size*0.15}" width="${size*0.4}" height="${size*0.65}" rx="${size*0.05}" fill="white"/>
      <rect x="${size*0.35}" y="${size*0.22}" width="${size*0.3}" height="${size*0.45}" fill="#e5e7eb"/>

      <!-- Home button -->
      <circle cx="${size*0.5}" cy="${size*0.73}" r="${size*0.03}" fill="#9ca3af"/>

      <!-- Speaker -->
      <rect x="${size*0.43}" y="${size*0.18}" width="${size*0.14}" height="${size*0.02}" rx="${size*0.01}" fill="#9ca3af"/>

      <!-- Wrench icon -->
      <g transform="translate(${size*0.55}, ${size*0.35}) rotate(45)">
        <rect x="0" y="0" width="${size*0.08}" height="${size*0.25}" fill="#16a34a"/>
        <circle cx="${size*0.04}" cy="0" r="${size*0.06}" fill="none" stroke="#16a34a" stroke-width="${size*0.04}"/>
      </g>
    </svg>
  `;
};

async function generateIcons() {
  const iconsDir = join(process.cwd(), 'public', 'icons');
  mkdirSync(iconsDir, { recursive: true });

  for (const size of sizes) {
    const svg = createSvgIcon(size);
    const buffer = Buffer.from(svg);

    await sharp(buffer)
      .png()
      .toFile(join(iconsDir, `icon-${size}x${size}.png`));

    console.log(`Generated icon-${size}x${size}.png`);
  }

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
