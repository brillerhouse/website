import sharp from 'sharp';

// Reach the target with neural inference; ordinary enlargement is never used here.
export async function neuralUpscaleToTarget(png, target, engine, progress = () => {}) {
  let current = png;
  const passes = [];
  for (let pass = 1; pass <= 3; pass++) {
    let input = await sharp(current).metadata();
    const neededWidth = Math.ceil(target.width / 4), neededHeight = Math.ceil(target.height / 4);
    // After the first neural pass, reduce surplus pixels before the next pass.
    // This bounds CPU/memory use: the small gallery crops reach 4K in two passes.
    // Both dimensions must already be large enough: this never enlarges pixels.
    if (pass > 1 && input.width >= neededWidth && input.height >= neededHeight && (input.width > neededWidth || input.height > neededHeight)) {
      current = await sharp(current).resize(neededWidth, neededHeight, { fit: 'inside', kernel: 'lanczos3' }).png().toBuffer();
      input = await sharp(current).metadata();
    }
    current = await engine.run(current, (done,total) => progress(pass,done,total));
    const output = await sharp(current).metadata();
    if (output.width !== input.width * 4 || output.height !== input.height * 4) throw new Error('Real-ESRGAN did not produce a native 4× neural result');
    passes.push({ inputWidth: input.width, inputHeight: input.height, outputWidth: output.width, outputHeight: output.height });
    const aspectDifference = Math.abs((output.width / output.height) / (target.width / target.height) - 1);
    if (Math.min(target.width / output.width, target.height / output.height) <= 1 && aspectDifference <= .01) return { buffer: current, passes, width: output.width, height: output.height };
  }
  throw new Error('Native neural output is still below target after three passes; no ordinary enlargement was substituted');
}
