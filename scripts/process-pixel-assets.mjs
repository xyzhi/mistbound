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

function clearOpaqueBorderComponents(rgba, width, height) {
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0, tail = 0;
  const enqueue = pixel => {
    if (visited[pixel] || rgba[pixel * 4 + 3] === 0) return;
    visited[pixel] = 1;
    queue[tail++] = pixel;
  };
  for (let x = 0; x < width; x++) { enqueue(x); enqueue((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { enqueue(y * width); enqueue(y * width + width - 1); }
  while (head < tail) {
    const pixel = queue[head++];
    rgba.fill(0, pixel * 4, pixel * 4 + 4);
    const x = pixel % width, y = Math.floor(pixel / width);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nextX = x + dx, nextY = y + dy;
      if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) continue;
      enqueue(nextY * width + nextX);
    }
  }
}

for (const file of enemyAtlases) {
  const source = path.join(root, file);
  const { width, height } = await sharp(source).metadata();
  const name = file.replace('-atlas.png', '');
  const frameBounds = [
    { left: 0, top: 0, width: Math.floor(width * .5), height: Math.floor(height * .5) },
    { left: Math.floor(width * .5), top: 0, width: width - Math.floor(width * .5), height: Math.floor(height * .5) },
    { left: 0, top: Math.floor(height * .5), width: Math.floor(width * .5), height: height - Math.floor(height * .5) },
    // Boss illustrations often cross the nominal center line, so give the final
    // frame a larger source window before trimming and fitting it into its cell.
    { left: Math.floor(width * .43), top: Math.floor(height * .43), width: width - Math.floor(width * .43), height: height - Math.floor(height * .43) },
  ];

  const frames = [];
  for (let frame = 0; frame < 4; frame++) {
    const bounds = frameBounds[frame];
    const rgb = await sharp(source).extract(bounds).removeAlpha().raw().toBuffer();
    const rgba = Buffer.alloc(bounds.width * bounds.height * 4);
    for (let pixel = 0; pixel < bounds.width * bounds.height; pixel++) {
      const inputOffset = pixel * 3, outputOffset = pixel * 4;
      const red = rgb[inputOffset], green = rgb[inputOffset + 1], blue = rgb[inputOffset + 2];
      const checker = Math.max(red, green, blue) - Math.min(red, green, blue) <= 24
        && Math.min(red, green, blue) >= 205;
      rgba[outputOffset] = checker ? 0 : red;
      rgba[outputOffset + 1] = checker ? 0 : green;
      rgba[outputOffset + 2] = checker ? 0 : blue;
      rgba[outputOffset + 3] = checker ? 0 : 255;
    }
    clearOpaqueBorderComponents(rgba, bounds.width, bounds.height);
    const resized = await sharp(rgba, { raw: { width: bounds.width, height: bounds.height, channels: 4 } })
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 2 })
      .resize(348, 348, { fit: 'contain', kernel: 'nearest', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .ensureAlpha()
      .raw()
      .toBuffer();
    for (let pixel = 0; pixel < 348 * 348; pixel++) {
      const offset = pixel * 4;
      if (resized[offset + 3] === 0) resized.fill(0, offset, offset + 4);
    }
    const input = await sharp(resized, { raw: { width: 348, height: 348, channels: 4 } })
      .png()
      .toBuffer();
    if (frame === 3) {
      await sharp(resized, { raw: { width: 348, height: 348, channels: 4 } })
        .png({ compressionLevel: 9 })
        .toFile(path.join(output, `${name}-boss.png`));
    }
    frames.push({ input, left: (frame % 2) * 384 + 18, top: Math.floor(frame / 2) * 384 + 18 });
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
