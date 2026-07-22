import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const labDirectory = path.resolve(scriptDirectory, "..");
const repositoryDirectory = path.resolve(labDirectory, "..", "..");
const sourceDirectory = path.join(repositoryDirectory, "design-lab", "optical-fidelity-lab", "artifacts");
const outputDirectory = path.join(labDirectory, "assets", "ribbon-icons", "v1");
const sizes = [48, 64, 96, 128];
const targetVisualExtent = 880;
const effectiveAlphaThreshold = 12;

const icons = [
  { id: "ai-spark", label: "AI Spark", version: "V11", source: "ai-spark-gradient-ribbon-v11.png" },
  { id: "upload", label: "Upload", version: "V11", source: "upload-gradient-ribbon-v11.png" },
  { id: "processing", label: "Processing", version: "V11", source: "processing-gradient-ribbon-v11.png" },
  { id: "success", label: "Success", version: "V12", source: "success-gradient-ribbon-v12.png" },
  { id: "warning", label: "Warning", version: "V12", source: "warning-gradient-ribbon-v12.png" },
  { id: "command-entry", label: "Command Entry", version: "V12", source: "command-entry-gradient-ribbon-v12.png" },
];

function recoverTransparency(data, info) {
  const output = Buffer.alloc(info.width * info.height * 4);

  for (let index = 0; index < info.width * info.height; index += 1) {
    const sourceOffset = index * info.channels;
    const targetOffset = index * 4;
    const red = data[sourceOffset];
    const green = data[sourceOffset + 1];
    const blue = data[sourceOffset + 2];
    const sourceAlpha = info.channels === 4 ? data[sourceOffset + 3] : 255;
    const peak = Math.max(red, green, blue);

    if (peak <= 3 || sourceAlpha === 0) {
      output[targetOffset] = 0;
      output[targetOffset + 1] = 0;
      output[targetOffset + 2] = 0;
      output[targetOffset + 3] = 0;
      continue;
    }

    const recoveredAlpha = Math.min(
      sourceAlpha,
      Math.round(255 * Math.pow((peak - 3) / 252, 0.72)),
    );
    const unpremultiply = 255 / Math.max(recoveredAlpha, 1);

    output[targetOffset] = Math.min(255, Math.round(red * unpremultiply));
    output[targetOffset + 1] = Math.min(255, Math.round(green * unpremultiply));
    output[targetOffset + 2] = Math.min(255, Math.round(blue * unpremultiply));
    output[targetOffset + 3] = recoveredAlpha;
  }

  return output;
}

function findAlphaBounds(data, width, height, threshold) {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] <= threshold) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  if (right < left || bottom < top) throw new Error("Ribbon icon contains no visible pixels.");
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

async function normalizeVisualExtent(data, info) {
  const effectiveBounds = findAlphaBounds(data, info.width, info.height, effectiveAlphaThreshold);
  const fullGlowBounds = findAlphaBounds(data, info.width, info.height, 0);
  const scale = targetVisualExtent / Math.max(effectiveBounds.width, effectiveBounds.height);
  const resizedWidth = Math.round(fullGlowBounds.width * scale);
  const resizedHeight = Math.round(fullGlowBounds.height * scale);
  const left = Math.round((info.width - resizedWidth) / 2);
  const top = Math.round((info.height - resizedHeight) / 2);

  if (left < 0 || top < 0) throw new Error("Normalized glow would exceed the frozen master canvas.");

  const glyph = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .extract(fullGlowBounds)
    .resize(resizedWidth, resizedHeight, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();

  const normalized = await sharp({
    create: {
      width: info.width,
      height: info.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: glyph, left, top }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();

  return {
    normalized,
    transform: {
      method: "uniform-scale-and-center",
      targetVisualExtent,
      effectiveAlphaThreshold,
      scale: Number(scale.toFixed(4)),
      originalEffectiveBounds: effectiveBounds,
      originalFullGlowBounds: fullGlowBounds,
      placement: { left, top, width: resizedWidth, height: resizedHeight },
    },
  };
}

async function inspectAlpha(filePath) {
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let transparentPixels = 0;
  let partialPixels = 0;
  let opaquePixels = 0;

  for (let index = 3; index < data.length; index += 4) {
    if (data[index] === 0) transparentPixels += 1;
    else if (data[index] === 255) opaquePixels += 1;
    else partialPixels += 1;
  }

  const cornerOffsets = [
    3,
    (info.width - 1) * 4 + 3,
    (info.width * (info.height - 1)) * 4 + 3,
    (info.width * info.height - 1) * 4 + 3,
  ];

  return {
    width: info.width,
    height: info.height,
    transparentPixels,
    partialPixels,
    opaquePixels,
    cornersTransparent: cornerOffsets.every((offset) => data[offset] === 0),
  };
}

await Promise.all([
  mkdir(path.join(outputDirectory, "source"), { recursive: true }),
  mkdir(path.join(outputDirectory, "master"), { recursive: true }),
  ...sizes.map((size) => mkdir(path.join(outputDirectory, String(size)), { recursive: true })),
]);

const manifest = {
  version: 1,
  geometryFrozen: true,
  background: "transparent",
  sizeNormalization: {
    method: "uniform-scale-and-center",
    targetVisualExtent,
    effectiveAlphaThreshold,
    geometryChanged: false,
  },
  sizes,
  icons: [],
};

for (const icon of icons) {
  const sourcePath = path.join(sourceDirectory, icon.source);
  const archivedSourcePath = path.join(outputDirectory, "source", `${icon.id}.png`);
  const masterPath = path.join(outputDirectory, "master", `${icon.id}.png`);
  const sourceBuffer = await readFile(sourcePath);
  const { data, info } = await sharp(sourceBuffer).raw().toBuffer({ resolveWithObject: true });
  const transparentPixels = recoverTransparency(data, info);
  const { normalized, transform } = await normalizeVisualExtent(transparentPixels, info);

  await copyFile(sourcePath, archivedSourcePath);
  await writeFile(masterPath, normalized);

  for (const size of sizes) {
    const resized = sharp(masterPath)
      .resize(size, size, {
        fit: "contain",
        kernel: sharp.kernel.lanczos3,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .sharpen({ sigma: size <= 64 ? 0.6 : 0.35 });

    await resized.clone().png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(
      path.join(outputDirectory, String(size), `${icon.id}.png`),
    );
    await resized.clone().webp({ quality: 90, alphaQuality: 100, smartSubsample: true }).toFile(
      path.join(outputDirectory, String(size), `${icon.id}.webp`),
    );
  }

  manifest.icons.push({
    ...icon,
    sourceSha256: createHash("sha256").update(sourceBuffer).digest("hex"),
    transform,
    master: await inspectAlpha(masterPath),
    preview48: await inspectAlpha(path.join(outputDirectory, "48", `${icon.id}.png`)),
  });
}

await writeFile(path.join(outputDirectory, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify(manifest, null, 2));
