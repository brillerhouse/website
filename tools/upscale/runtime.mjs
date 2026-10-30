import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
const directory=path.dirname(fileURLToPath(import.meta.url));
export function runtimeDirectory(platform=process.platform,release=os.release()) {
  if(platform==='darwin'){
    const [major,minor]=release.split('.').map(Number);
    if(major<20)throw new Error('Local Real-ESRGAN needs macOS 11 or later. Gemini-only comparison is still available without this runtime.');
    // Newer ONNX native libraries require macOS 13.4 / Darwin 22.5.
    if(major<22||(major===22&&minor<5))return path.join(directory,'legacy');
  }
  return directory;
}
