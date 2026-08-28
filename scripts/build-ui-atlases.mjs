import sharp from 'sharp';

const jobs = [
  { name: 'equipment', columns: 8, rows: 6, cell: 128 },
  { name: 'skill', columns: 5, rows: 5, cell: 128 },
  { name: 'character', columns: 3, rows: 1, cell: 256 },
];

function removeConnectedCheckerboard(data, width, height, channels) {
  const alpha = new Uint8Array(width * height).fill(255);
  const seen = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  const isBackground = index => {
    const offset = index * channels;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    return Math.max(r, g, b) - Math.min(r, g, b) <= 12 && Math.min(r, g, b) >= 212;
  };
  const enqueue = index => {
    if (seen[index] || !isBackground(index)) return;
    seen[index] = 1;
    queue[tail++] = index;
  };
  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }
  while (head < tail) {
    const index = queue[head++];
    alpha[index] = 0;
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) enqueue(index - 1);
    if (x + 1 < width) enqueue(index + 1);
    if (y > 0) enqueue(index - width);
    if (y + 1 < height) enqueue(index + width);
  }
  return alpha;
}

function hasTransparentNeighbor(rgba, width, height, x, y, radius = 1) {
  for (let dy = -radius; dy <= radius; dy += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      if (!dx && !dy) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) return true;
      if (rgba[(ny * width + nx) * 4 + 3] === 0) return true;
    }
  }
  return false;
}

function cleanLightFringe(source, width, height) {
  let rgba = Buffer.from(source);
  for (let pass = 0; pass < 2; pass += 1) {
    const next = Buffer.from(rgba);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        if (rgba[offset + 3] === 0 || !hasTransparentNeighbor(rgba, width, height, x, y)) continue;
        const r = rgba[offset];
        const g = rgba[offset + 1];
        const b = rgba[offset + 2];
        const chroma = Math.max(r, g, b) - Math.min(r, g, b);
        if (Math.min(r, g, b) >= 176 && chroma <= 18) next[offset + 3] = 0;
      }
    }
    rgba = next;
  }
  return rgba;
}

function blackenOuterContour(source, width, height) {
  const rgba = Buffer.from(source);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      if (source[offset + 3] <= 18 || !hasTransparentNeighbor(source, width, height, x, y)) continue;
      rgba[offset] = 5;
      rgba[offset + 1] = 9;
      rgba[offset + 2] = 8;
      rgba[offset + 3] = 255;
    }
  }
  return rgba;
}

function collectComponents(rgba, width, height) {
  const seen = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  const components = [];
  const opaque = index => rgba[index * 4 + 3] > 18;
  for (let start = 0; start < width * height; start += 1) {
    if (seen[start] || !opaque(start)) continue;
    let head = 0;
    let tail = 0;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    const pixels = [];
    seen[start] = 1;
    queue[tail++] = start;
    while (head < tail) {
      const index = queue[head++];
      pixels.push(index);
      const x = index % width;
      const y = Math.floor(index / width);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) {
        if (!dx && !dy) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const next = ny * width + nx;
        if (!seen[next] && opaque(next)) {
          seen[next] = 1;
          queue[tail++] = next;
        }
      }
    }
    if (pixels.length >= 6) components.push({ pixels, minX, minY, maxX, maxY });
  }
  return components;
}

async function repackAtlas(rgba, width, height, columns, rows, cell) {
  const groups = Array.from({ length: columns * rows }, () => []);
  for (const component of collectComponents(rgba, width, height)) {
    const centerX = (component.minX + component.maxX) / 2;
    const centerY = (component.minY + component.maxY) / 2;
    const column = Math.max(0, Math.min(columns - 1, Math.floor(centerX / width * columns)));
    const row = Math.max(0, Math.min(rows - 1, Math.floor(centerY / height * rows)));
    groups[row * columns + column].push(component);
  }
  const layers = [];
  for (let index = 0; index < groups.length; index += 1) {
    const group = groups[index];
    if (!group.length) continue;
    const minX = Math.min(...group.map(item => item.minX));
    const minY = Math.min(...group.map(item => item.minY));
    const maxX = Math.max(...group.map(item => item.maxX));
    const maxY = Math.max(...group.map(item => item.maxY));
    const sourceWidth = maxX - minX + 1;
    const sourceHeight = maxY - minY + 1;
    const isolated = Buffer.alloc(sourceWidth * sourceHeight * 4);
    for (const component of group) for (const sourceIndex of component.pixels) {
      const x = sourceIndex % width;
      const y = Math.floor(sourceIndex / width);
      const targetIndex = ((y - minY) * sourceWidth + x - minX) * 4;
      rgba.copy(isolated, targetIndex, sourceIndex * 4, sourceIndex * 4 + 4);
    }
    const rendered = await sharp(isolated, { raw: { width: sourceWidth, height: sourceHeight, channels: 4 } })
      .resize(cell - 18, cell - 18, { fit: 'inside', kernel: sharp.kernel.nearest, withoutEnlargement: false })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const framed = Buffer.alloc(cell * cell * 4);
    const localLeft = Math.floor((cell - rendered.info.width) / 2);
    const localTop = Math.floor((cell - rendered.info.height) / 2);
    for (let y = 0; y < rendered.info.height; y += 1) {
      const sourceStart = y * rendered.info.width * 4;
      const targetStart = ((y + localTop) * cell + localLeft) * 4;
      rendered.data.copy(framed, targetStart, sourceStart, sourceStart + rendered.info.width * 4);
    }
    const cleaned = blackenOuterContour(cleanLightFringe(framed, cell, cell), cell, cell);
    layers.push({
      input: cleaned,
      raw: { width: cell, height: cell, channels: 4 },
      left: (index % columns) * cell,
      top: Math.floor(index / columns) * cell,
    });
  }
  return sharp({ create: { width: columns * cell, height: rows * cell, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(layers)
    .png()
    .toBuffer();
}

for (const { name, columns, rows, cell } of jobs) {
  const input = `src/assets/pixel/${name}-atlas.png`;
  const output = `src/assets/pixel/runtime/${name}-atlas.webp`;
  const metadata = await sharp(input).metadata();
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const alpha = metadata.hasAlpha ? null : removeConnectedCheckerboard(data, info.width, info.height, info.channels);
  const rgba = Buffer.from(data);
  for (let index = 0; index < info.width * info.height; index += 1) {
    if (alpha) rgba[index * 4 + 3] = alpha[index];
  }
  const atlas = await repackAtlas(rgba, info.width, info.height, columns, rows, cell);
  await sharp(atlas).png().toFile(input);
  await sharp(atlas).webp({ lossless: true, effort: 6 }).toFile(output);
  console.log(`built ${input} and ${output}`);
}
