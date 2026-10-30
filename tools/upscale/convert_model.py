"""Maintainer-only conversion of the official Real-ESRGAN general x4v3 weights.
Local comparison users need only Node + ONNX Runtime, not Python/PyTorch.
Requires torch==2.6.0 and onnx==1.17.0. Supply official general and WDN .pth paths.
SRVGGNetCompact adapted from xinntao/Real-ESRGAN, BSD-3-Clause (adjacent LICENSE).
"""
import hashlib
import json
import sys
from pathlib import Path
import torch
from torch import nn
from torch.nn import functional as F

class SRVGGNetCompact(nn.Module):
    def __init__(self):
        super().__init__()
        self.body = nn.ModuleList([nn.Conv2d(3, 64, 3, 1, 1), nn.PReLU(64)])
        for _ in range(32):
            self.body.extend([nn.Conv2d(64, 64, 3, 1, 1), nn.PReLU(64)])
        self.body.append(nn.Conv2d(64, 48, 3, 1, 1))
        self.upsampler = nn.PixelShuffle(4)
    def forward(self, x):
        out = x
        for layer in self.body:
            out = layer(out)
        return self.upsampler(out) + F.interpolate(x, scale_factor=4, mode='nearest')

if __name__ == '__main__':
    expected = ['8dc7edb9ac80ccdc30c3a5dca6616509367f05fbc184ad95b731f05bece96292', '1641f8c4464b9f097c9fdda5589273713f67cf59f3d909e0bd688f0cee269dca']
    paths = [Path(p) for p in sys.argv[1:3]]
    assert len(paths) == 2, 'Supply general and WDN official .pth weights'
    states = []
    for file, checksum in zip(paths, expected):
        assert hashlib.sha256(file.read_bytes()).hexdigest() == checksum, 'Unexpected model weights'
        state = torch.load(file, map_location='cpu', weights_only=True)
        states.append(state.get('params_ema', state.get('params', state)))
    # Conservative official DNI interpolation: 30% denoising model, 70% weak denoise.
    network = SRVGGNetCompact().eval()
    network.load_state_dict({key: states[0][key] * .3 + states[1][key] * .7 for key in states[0]})
    torch.set_num_threads(2)
    torch.manual_seed(1234)
    probe = torch.rand(1,3,17,19)
    output = Path(__file__).parent / 'models/realesrgan-general-x4v3-dni030.onnx'
    torch.onnx.export(network, probe, output, input_names=['input'], output_names=['output'], dynamic_axes={'input':{2:'height',3:'width'},'output':{2:'output_height',3:'output_width'}}, opset_version=17, do_constant_folding=True, dynamo=False)
    import onnx
    onnx.checker.check_model(onnx.load(output))
    import numpy as np
    with torch.inference_mode():
        np.save('/tmp/briller-onnx-input.npy', probe.numpy())
        np.save('/tmp/briller-onnx-expected.npy', network(probe).numpy())
    metadata = {'name':'Real-ESRGAN general x4v3', 'architecture':'SRVGGNetCompact, 64 features, 32 body convolutions, PReLU, 4× pixel shuffle + nearest residual','license':'BSD-3-Clause','source':'https://github.com/xinntao/Real-ESRGAN','release':'v0.2.5.0','denoiseStrength':.3,'weights':[{'file':p.name,'sha256':h} for p,h in zip(paths,expected)],'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'opset':17,'precision':'float32','conversion':'torch 2.6.0 / onnx 1.17.0'}
    output.with_suffix('.json').write_text(json.dumps(metadata,indent=2)+'\n')
    print(json.dumps(metadata))
