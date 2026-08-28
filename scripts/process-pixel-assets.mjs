import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve('src/assets/pixel');
const output = path.join(root, 'runtime');
await mkdir(output, { recursive: true });

const backgrounds = sharp(path.join(root, 'chapter-backgrounds-atlas.png'));
for (let index = 0; index < 6; index++) {
  const left = (index % 3) * 512;
  const top = Math.floor(index / 3) * 512;
  await backgrounds.clone()
    .extract({ left, top, width: 512, height: 512 })
    .resize(640, 360, { fit: 'cover', kernel: 'nearest' })
    .webp({ quality: 76, effort: 6 })
    .toFile(path.join(output, `chapter-${index}.webp`));
}

const enemyAtlases = (await readdir(root)).filter(file => /^enemies-.+-atlas\.png$/.test(file));
for (const file of enemyAtlases) {
  const source = path.join(root, file);
  const { width, height } = await sharp(source).metadata();
  const rgb = await sharp(source).removeAlpha().raw().toBuffer();
  const rgba = Buffer.alloc(width * height * 4);
  for (let pixel = 0; pixel < width * height; pixel++) {
    const input = pixel * 3;
    const outputPixel = pixel * 4;
    const red = rgb[input], green = rgb[input + 1], blue = rgb[input + 2];
    const neutral = Math.max(red, green, blue) - Math.min(red, green, blue) <= 8;
    const checker = neutral && Math.min(red, green, blue) >= 225;
    rgba[outputPixel] = red;
    rgba[outputPixel + 1] = green;
    rgba[outputPixel + 2] = blue;
    rgba[outputPixel + 3] = checker ? 0 : 255;
  }
  const name = file.replace('-atlas.png', '');
  const sourceImage = sharp(rgba, { raw: { width, height, channels: 4 } });
  const cellWidth = Math.floor(width / 2), cellHeight = Math.floor(height / 2), inset = 44;
  const frames = [];
  for (let frame = 0; frame < 4; frame++) {
    const left = (frame % 2) * cellWidth + inset;
    const top = Math.floor(frame / 2) * cellHeight + inset;
    const input = await sourceImage.clone()
      .extract({ left, top, width: cellWidth - inset * 2, height: cellHeight - inset * 2 })
      .resize(360, 360, { fit: 'contain', kernel: 'nearest', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    frames.push({ input, left: (frame % 2) * 384 + 12, top: Math.floor(frame / 2) * 384 + 12 });
  }
  await sharp({ create: { width: 768, height: 768, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(frames)
    .webp({ lossless: true, effort: 6 })
    .toFile(path.join(output, `${name}.webp`));
}

const creatureSource = path.join(root, 'dream-creatures-v3.png');
const creatureMeta = await sharp(creatureSource).metadata();
const creatureRgb = await sharp(creatureSource).removeAlpha().raw().toBuffer();
const creatureRgba = Buffer.alloc(creatureMeta.width * creatureMeta.height * 4);
const creatureMask = new Uint8Array(creatureMeta.width * creatureMeta.height);
for (let pixel = 0; pixel < creatureMeta.width * creatureMeta.height; pixel++) {
  const input = pixel * 3;
  const outputPixel = pixel * 4;
  const red = creatureRgb[input], green = creatureRgb[input + 1], blue = creatureRgb[input + 2];
  const neutral = Math.max(red, green, blue) - Math.min(red, green, blue) <= 8;
  const checker = neutral && Math.min(red, green, blue) >= 225;
  creatureRgba[outputPixel] = red;
  creatureRgba[outputPixel + 1] = green;
  creatureRgba[outputPixel + 2] = blue;
  creatureMask[pixel] = checker ? 0 : 1;
}

function morphMask(mask, width, height, radius, operation) {
  const integral = new Uint32Array((width + 1) * (height + 1));
  for (let y = 0; y < height; y++) {
    let row = 0;
    for (let x = 0; x < width; x++) {
      row += mask[y * width + x];
      integral[(y + 1) * (width + 1) + x + 1] = integral[y * (width + 1) + x + 1] + row;
    }
  }
  const result = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    const top = Math.max(0, y - radius), bottom = Math.min(height - 1, y + radius);
    for (let x = 0; x < width; x++) {
      const left = Math.max(0, x - radius), right = Math.min(width - 1, x + radius);
      const stride = width + 1;
      const sum = integral[(bottom + 1) * stride + right + 1] - integral[top * stride + right + 1]
        - integral[(bottom + 1) * stride + left] + integral[top * stride + left];
      const area = (right - left + 1) * (bottom - top + 1);
      result[y * width + x] = operation === 'erode' ? Number(sum === area) : Number(sum > 0);
    }
  }
  return result;
}

// Pull the silhouette inward to discard baked white antialiasing, then use the
// reclaimed edge as a hard black inner outline suited to dark battle scenes.
const cleanCreatureMask = morphMask(creatureMask, creatureMeta.width, creatureMeta.height, 2, 'erode');
const outlinedCreatureMask = morphMask(cleanCreatureMask, creatureMeta.width, creatureMeta.height, 2, 'dilate');
for (let pixel = 0; pixel < creatureMeta.width * creatureMeta.height; pixel++) {
  const outputPixel = pixel * 4;
  if (!cleanCreatureMask[pixel] && outlinedCreatureMask[pixel]) {
    creatureRgba[outputPixel] = 0;
    creatureRgba[outputPixel + 1] = 0;
    creatureRgba[outputPixel + 2] = 0;
  }
  creatureRgba[outputPixel + 3] = outlinedCreatureMask[pixel] ? 255 : 0;
}
await sharp(creatureRgba, { raw: { width: creatureMeta.width, height: creatureMeta.height, channels: 4 } })
  .resize(1024, 1024, { fit: 'fill', kernel: 'nearest' })
  .webp({ lossless: true, effort: 6 })
  .toFile(path.join(output, 'dream-creatures.webp'));

await sharp(path.resolve('src/assets/traveling-hotel-camper.png'))
  .resize({ width: 1280, withoutEnlargement: true })
  .webp({ quality: 78, effort: 6 })
  .toFile(path.join(output, 'camper.webp'));

console.log(`Processed ${enemyAtlases.length} enemy atlases, 16 dream creatures and 6 chapter backgrounds into ${output}.`);
