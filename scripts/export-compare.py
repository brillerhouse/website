#!/usr/bin/env python3
"""Package the built EN/UK comparison pages and their local assets."""
import hashlib
from html import unescape
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import unquote, urlsplit
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'out'
DESTINATION = ROOT / 'exports' / 'briller-compare-pages.zip'

SERVER = '''#!/usr/bin/env python3
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = urlsplit(self.path).path
        if path == '/':
            self.send_response(302)
            self.send_header('Location', '/en/compare/')
            self.end_headers()
        elif path.startswith(('/en/', '/uk/')) and not path.startswith(('/en/compare/', '/uk/compare/')) and path not in ('/en/compare', '/uk/compare'):
            self.send_response(302)
            self.send_header('Location', 'https://briller.house' + self.path)
            self.end_headers()
        else:
            super().do_GET()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='View the Briller comparison archive locally.')
    parser.add_argument('--port', type=int, default=8040)
    options = parser.parse_args()
    handler = partial(Handler, directory=str(Path(__file__).resolve().parent / 'site'))
    server = ThreadingHTTPServer(('127.0.0.1', options.port), handler)
    print(f'English: http://localhost:{options.port}/en/compare/', flush=True)
    print(f'Українська: http://localhost:{options.port}/uk/compare/', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
'''


def main():
    products = json.loads((ROOT / 'content/compare/catalog.json').read_text())['products']
    routes = [f'/{locale}/compare/{suffix}' for locale in ('en', 'uk')
              for suffix in ['', *[p['slug'] + '/' for p in products]]]
    files = {}

    def include(path, destination):
        if not path.is_file():
            raise SystemExit(f'Missing built file: {path}. Build the website before exporting.')
        files[destination] = path.read_bytes()

    for route in routes:
        include(OUT / route.lstrip('/') / 'index.html', 'site' + route + 'index.html')
        # Next's static navigation payloads accompany each page when present.
        for payload in (OUT / route.lstrip('/')).glob('*.txt'):
            include(payload, 'site' + route + payload.name)

    # Include shared runtime chunks (including lazy chunks), artwork and typography.
    for directory in ('_next', 'brand', 'fonts'):
        for path in sorted((OUT / directory).rglob('*')):
            if path.is_file():
                include(path, 'site/' + path.relative_to(OUT).as_posix())

    # Include asset URLs found in HTML and CSS, without copying the gallery.
    for name, data in list(files.items()):
        if not name.endswith(('.html', '.css')):
            continue
        text = data.decode('utf-8')
        references = re.findall(r'(?:src|href)="(/[^"]+)"', text)
        references += re.findall(r'url\([\"\x27]?(/[^)\"\x27]+)', text)
        for reference in references:
            relative = unquote(urlsplit(unescape(reference)).path).lstrip('/')
            path = (OUT / relative).resolve()
            if not path.is_relative_to(OUT.resolve()):
                raise SystemExit(f'Asset outside build directory: {reference}')
            if path.is_file() and path.suffix != '.html':
                include(path, 'site/' + relative)

    source_files = [
        'components/ComparisonPages.tsx', 'lib/compare.ts', 'app/compare.css',
        'app/design-tokens.css', 'app/design-system.css', 'content/plans.json',
        'app/[locale]/compare/page.tsx', 'app/[locale]/compare/[competitor]/page.tsx',
    ]
    source_files += [path.relative_to(ROOT).as_posix()
                     for path in sorted((ROOT / 'content/compare').glob('*')) if path.is_file()]
    for source in source_files:
        include(ROOT / source, 'source/' + source)

    revision = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    readme = f'''# Briller — усі сторінки Compare / Порівняння

20 готових HTML-сторінок: по одному огляду та дев'ять порівнянь EN/UK.
Версія вмісту сайту: {revision}

## Перегляд

Розпакуйте ZIP, відкрийте термінал у його папці й запустіть:

    python3 serve.py --port 8040

Англійська: http://localhost:8040/en/compare/
Українська: http://localhost:8040/uk/compare/

Для іншого порту змініть 8040 у команді й адресі браузера.
Зупинка: Ctrl+C лише в терміналі цього архіву.
Запускайте через локальний сервер: відкриття HTML через file:// не підтримує
абсолютні шляхи до стилів і скриптів. Node.js та npm для перегляду не потрібні.

## Що включено

- site/: готові сторінки, локальні стилі, скрипти, шрифти й зображення.
- source/: дані й основні вихідні файли розділу порівнянь для редагування;
  це витяг з проєкту, а не повний самостійний Next.js-проєкт.
- manifest.json: перелік сторінок, версія та SHA-256 файлів.
- serve.py: локальний сервер на 127.0.0.1.

Порівняння, FAQ, таблиці та перемикання мови доступні локально.
Інші розділи сайту не включено: serve.py перенаправляє їхні посилання на
https://briller.house. Зовнішні посилання та геолокація потребують мережі.
Усі сторінки експорту мають preview noindex; canonical залишається briller.house.

## Сторінки

''' + '\n'.join('- ' + route for route in routes) + '\n'
    files['README.md'] = readme.encode('utf-8')
    files['serve.py'] = SERVER.encode('utf-8')
    files['site/index.html'] = b'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Briller Compare</title></head><body><a href="/en/compare/">English</a> | <a href="/uk/compare/">Ukrainian</a></body></html>'
    manifest = {'websiteRevision': revision, 'pages': routes,
                'files': {name: hashlib.sha256(data).hexdigest() for name, data in sorted(files.items())}}
    files['manifest.json'] = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
    DESTINATION.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(DESTINATION, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, data in sorted(files.items()):
            entry = zipfile.ZipInfo(name, date_time=(2026, 11, 2, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.external_attr = 0o644 << 16
            archive.writestr(entry, data)
    with zipfile.ZipFile(DESTINATION) as archive:
        if archive.testzip() is not None:
            raise SystemExit('ZIP integrity check failed.')
    print(f'{DESTINATION}: {len(routes)} pages, {len(files)} files, {DESTINATION.stat().st_size:,} bytes')


if __name__ == '__main__':
    main()
