import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { runtimeDirectory } from '../../tools/upscale/runtime.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export async function createRealEsrgan({ threads = Math.min(4, os.availableParallelism?.() || os.cpus().length), tile = 128 } = {}) {
  if (!Number.isInteger(tile) || tile < 32 || tile > 512) throw new Error('Tile size must be 32–512');
  const modelPath = path.join(root, 'tools/upscale/models/realesrgan-general-x4v3-dni030.onnx');
  const metadata = JSON.parse(await fs.readFile(modelPath.replace(/\.onnx$/, '.json'), 'utf8'));
  const bytes = await fs.readFile(modelPath);
  if (createHash('sha256').update(bytes).digest('hex') !== metadata.sha256) throw new Error('Real-ESRGAN model checksum mismatch');
  let ort;
  try { ort = createRequire(path.join(runtimeDirectory(), 'package.json'))('onnxruntime-node'); }
  catch { throw new Error('Local AI runtime is missing. Run: npm run gallery:compare:setup'); }
  const session = await ort.InferenceSession.create(bytes, { executionProviders: ['cpu'], intraOpNumThreads: threads, interOpNumThreads: 1, graphOptimizationLevel: 'all' });
  return {
    metadata,
    async run(png, progress = () => {}) {
      const { data, info } = await sharp(png).removeAlpha().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });
      const { width, height } = info, scale = 4, pad = 40;
      if (width > 4096 || height > 4096 || info.channels !== 3) throw new Error('Unexpected Real-ESRGAN input');
      const outputWidth = width * scale, outputHeight = height * scale;
      const output = Buffer.alloc(outputWidth * outputHeight * 3);
      const total = Math.ceil(width / tile) * Math.ceil(height / tile);let completed = 0;
      // The 40px context exceeds the network receptive-field radius; discard overlap.
      for (let top = 0; top < height; top += tile) for (let left = 0; left < width; left += tile) {
        const right = Math.min(left + tile, width), bottom = Math.min(top + tile, height);
        const x0 = Math.max(0, left - pad), y0 = Math.max(0, top - pad), x1 = Math.min(width, right + pad), y1 = Math.min(height, bottom + pad);
        const w = x1 - x0, h = y1 - y0, plane = w * h, input = new Float32Array(3 * plane);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let c = 0; c < 3; c++) input[c * plane + y * w + x] = data[((y0 + y) * width + x0 + x) * 3 + c] / 255;
        const results = await session.run({ [session.inputNames[0]]: new ort.Tensor('float32', input, [1,3,h,w]) });
        const result = results[session.outputNames[0]], [batch, channels, oh, ow] = result.dims;
        if (batch !== 1 || channels !== 3 || ow !== w * scale || oh !== h * scale) throw new Error('Unexpected neural-network output dimensions');
        for (let y = top * scale; y < bottom * scale; y++) for (let x = left * scale; x < right * scale; x++) {
          const sourceOffset = (y - y0 * scale) * ow + (x - x0 * scale), dest = (y * outputWidth + x) * 3;
          for (let c = 0; c < 3; c++) output[dest + c] = Math.round(Math.max(0, Math.min(1, result.data[c * ow * oh + sourceOffset])) * 255);
        }
        progress(++completed, total);
      }
      return sharp(output, { raw: { width: outputWidth, height: outputHeight, channels: 3 } }).png().toBuffer();
    },
    async close() { await session.release(); }
  };
}
