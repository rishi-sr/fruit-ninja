import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sourceDir = 'C:/Users/Rishi/.gemini/antigravity/brain/bbf816f9-41bf-4bc1-b8d6-b8808c003e4c';
const outputDir = 'd:/GHGAMES/fruit-ninja/public/assets/fruits';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs.readdirSync(sourceDir);

const mapping = {
  apple: files.find(f => f.startsWith('fruit_3d_apple_') && !f.includes('cut')),
  apple_cut: files.find(f => f.startsWith('fruit_3d_apple_cut_')),
  watermelon: files.find(f => f.startsWith('fruit_3d_watermelon_') && !f.includes('cut')),
  watermelon_cut: files.find(f => f.startsWith('fruit_3d_watermelon_cut_')),
  orange: files.find(f => f.startsWith('fruit_3d_orange_') && !f.includes('cut')),
  orange_cut: files.find(f => f.startsWith('fruit_3d_orange_cut_')),
  kiwi: files.find(f => f.startsWith('fruit_3d_kiwi_') && !f.includes('cut')),
  kiwi_cut: files.find(f => f.startsWith('fruit_3d_kiwi_cut_')),
  strawberry: files.find(f => f.startsWith('fruit_3d_strawberry_') && !f.includes('cut')),
  strawberry_cut: files.find(f => f.startsWith('fruit_3d_strawberry_cut_')),
  bomb: files.find(f => f.startsWith('fruit_3d_bomb_'))
};

console.log('Found mappings:', mapping);

async function processImage(inputName, outputKey) {
  if (!inputName) {
    console.warn(`No input for ${outputKey}`);
    return;
  }
  const inputPath = path.join(sourceDir, inputName);
  const outputPath = path.join(outputDir, `${outputKey}.png`);

  // Load raw pixels
  const { data, info } = await sharp(inputPath)
    .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels; // usually 3 (RGB)
  const rgbaBuffer = Buffer.alloc(info.width * info.height * 4);

  for (let i = 0, j = 0; i < data.length; i += channels, j += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const maxVal = Math.max(r, g, b);

    let alpha = 255;
    if (maxVal < 14) {
      alpha = 0;
    } else if (maxVal < 36) {
      alpha = Math.round(((maxVal - 14) / 22) * 255);
    }

    rgbaBuffer[j] = r;
    rgbaBuffer[j + 1] = g;
    rgbaBuffer[j + 2] = b;
    rgbaBuffer[j + 3] = alpha;
  }

  await sharp(rgbaBuffer, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
    .png({ compressionLevel: 8 })
    .toFile(outputPath);

  console.log(`Saved ${outputKey}.png`);
}

async function run() {
  for (const [key, filename] of Object.entries(mapping)) {
    if (filename) {
      await processImage(filename, key);
    }
  }
  console.log('All 3D fruits processed successfully!');
}

run().catch(console.error);

