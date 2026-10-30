import sharp from 'sharp';
export const DEFAULT_GEMINI_MODEL = 'gemini-3-pro-image-preview';
export function geminiPrompt({ width = 1440, height = 1080, imageSize = '2K' } = {}) {
  return `Perform faithful image super-resolution on this ONE existing interior photograph. Return ONE higher-resolution version of exactly the same picture at ${imageSize}, at least ${width} pixels wide and ${height} pixels high, with the same 4:3 framing.
Preserve the exact camera viewpoint, boundaries, room geometry, windows, doors, furniture count, silhouettes, object positions, materials, colors and lighting. Improve the clarity of existing edges and texture conservatively. Do not redesign, restyle, replace or add objects; do not invent patterns, wood grain, joints, handles or fabric details that are not supported by the input. If a small detail is uncertain, keep it restrained rather than inventing an elaborate detail. No sharpened halos, smoothing to plastic, extra decoration, crops, borders, labels, text, watermark, split views or contact sheets. This is a fidelity comparison, not a request for a new room design.`;
}
export const GEMINI_PROMPT = geminiPrompt();
const api = 'https://generativelanguage.googleapis.com/v1beta/models/';
export function safeError(error, apiKey = '') {
  let message = String(error?.message || error);
  if (apiKey) message = message.split(apiKey).join('[REDACTED]');
  return message.slice(0,1500);
}
function modelUrl(model) {
  if (!/^[a-zA-Z0-9._-]+$/.test(model)) throw new Error('Use a Gemini model ID without URL or credentials');
  return api + model;
}
async function jsonResponse(response, apiKey, maxBytes = 45_000_000) {
  const length = Number(response.headers?.get('content-length') || 0);
  if (length > maxBytes) throw new Error('Gemini response exceeds the image limit');
  const data = await response.json();
  if (!response.ok) throw new Error(safeError(new Error(`Gemini HTTP ${response.status}: ${data.error?.status || 'request failed'} — ${data.error?.message || 'Check image-model availability, billing and quota.'}`), apiKey));
  return data;
}
export async function checkGemini({ apiKey, model, fetcher = fetch }) {
  if (!apiKey) throw new Error('Set GEMINI_API_KEY in your terminal; never put it in source files or command arguments');
  const response = await fetcher(modelUrl(model), { headers: { 'x-goog-api-key': apiKey }, redirect: 'error', signal: AbortSignal.timeout(30000) });
  const data = await jsonResponse(response, apiKey);
  if (!data.supportedGenerationMethods?.includes('generateContent')) throw new Error('The selected Gemini model does not support generateContent');
}
export async function upscaleGemini(png, { apiKey, model, width = 1440, height = 1080, imageSize = height > 1080 ? '4K' : '2K', fetcher = fetch }) {
  if (!apiKey) throw new Error('GEMINI_API_KEY is required');
  if (!['2K','4K'].includes(imageSize)) throw new Error('Unsupported Gemini imageSize');
  const response = await fetcher(modelUrl(model) + ':generateContent', {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(180000),
    headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: geminiPrompt({ width, height, imageSize }) }, { inlineData: { mimeType: 'image/png', data: png.toString('base64') } }] }], generationConfig: { responseModalities: ['TEXT','IMAGE'], imageConfig: { aspectRatio: '4:3', imageSize } } })
  });
  const data = await jsonResponse(response, apiKey, imageSize === '4K' ? 110_000_000 : 45_000_000);
  const images = (data.candidates || []).flatMap(candidate => candidate.content?.parts || []).map(part => part.inlineData || part.inline_data).filter(Boolean);
  if (images.length !== 1) throw new Error(`Gemini returned ${images.length} images; one standalone image is required. Finish reason: ${data.candidates?.[0]?.finishReason || data.promptFeedback?.blockReason || 'unknown'}`);
  const image = images[0], mime = image.mimeType || image.mime_type;
  if (!['image/png','image/jpeg','image/webp'].includes(mime) || typeof image.data !== 'string' || image.data.length > (imageSize === '4K' ? 100_000_000 : 35_000_000)) throw new Error('Unexpected Gemini image payload');
  const checked = await inspectGeminiImage(Buffer.from(image.data, 'base64'), { width, height, imageSize });
  return { ...checked, mime, modelVersion: data.modelVersion || model, usage: Object.fromEntries(['promptTokenCount','candidatesTokenCount','totalTokenCount'].filter(key => Number.isFinite(data.usageMetadata?.[key])).map(key => [key,data.usageMetadata[key]])) };
}

export async function inspectGeminiImage(buffer, { width = 1440, height = 1080, imageSize = height > 1080 ? '4K' : '2K' } = {}) {
  const metadata = await sharp(buffer, { limitInputPixels: 32_000_000 }).metadata();
  function rejectImage(message) { const error = new Error(message); error.rejectedImage = { buffer, width: metadata.width, height: metadata.height }; throw error; }
  if (!['png','jpeg','webp'].includes(metadata.format) || !metadata.width || !metadata.height) rejectImage('Gemini returned invalid image dimensions or format');
  const aspectDifference = Math.abs((metadata.width / metadata.height) / (width / height) - 1);
  if (aspectDifference > .01) rejectImage(`Gemini changed the aspect ratio (${metadata.width}×${metadata.height}, ${(aspectDifference*100).toFixed(2)}% deviation; allowed 1%). The comparison rejects cropping/stretching to hide this.`);
  // A near-4:3 image may need a few neutral padding pixels, but never enlargement.
  const fitScale = Math.min(width / metadata.width, height / metadata.height);
  if (fitScale > 1) rejectImage(`Gemini returned ${metadata.width}×${metadata.height}, below the requested resolution. No ordinary enlargement will be substituted; use an image model with ${imageSize} output.`);
  return { buffer, width: metadata.width, height: metadata.height, aspectDifferencePercent: Math.round(aspectDifference * 10000) / 100 };
}
