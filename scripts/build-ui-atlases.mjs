import sharp from 'sharp';

const jobs = [
  { name: 'equipment', columns: 8, rows: 6, cell: 128 },
  { name: 'skill', columns: 5, rows: 5, cell: 128 },
];

function removeConnectedCheckerboard(data, width, height) {
  const alpha = new Uint8Array(width * height).fill(255);
  for (let index = 0; index < width * height; index += 1) {
    const offset = index * 3;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    if (Math.max(r, g, b) - Math.min(r, g, b) <= 10 && Math.min(r, g, b) >= 214) alpha[index] = 0;
  }
  return alpha;
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
      .png()
      .toBuffer({ resolveWithObject: true });
    layers.push({
      input: rendered.data,
      left: (index % columns) * cell + Math.floor((cell - rendered.info.width) / 2),
      top: Math.floor(index / columns) * cell + Math.floor((cell - rendered.info.height) / 2),
    });
  }
  return sharp({ create: { width: columns * cell, height: rows * cell, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(layers)
    .webp({ quality: 86, alphaQuality: 92, smartSubsample: true })
    .toBuffer();
}

for (const { name, columns, rows, cell } of jobs) {
  const input = `src/assets/pixel/runtime/${name}-atlas-source.png`;
  const output = `src/assets/pixel/runtime/${name}-atlas.webp`;
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const alpha = removeConnectedCheckerboard(data, info.width, info.height);
  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let index = 0; index < info.width * info.height; index += 1) {
    rgba[index * 4] = data[index * 3];
    rgba[index * 4 + 1] = data[index * 3 + 1];
    rgba[index * 4 + 2] = data[index * 3 + 2];
    rgba[index * 4 + 3] = alpha[index];
  }
  const atlas = await repackAtlas(rgba, info.width, info.height, columns, rows, cell);
  await sharp(atlas).toFile(output);
  console.log(`built ${output}`);
}
