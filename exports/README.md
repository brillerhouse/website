# Архів сторінок Compare

`briller-compare-pages.zip` містить 20 готових сторінок EN/UK: два огляди та по дев’ять порівнянь, локальні стилі, скрипти, шрифти й основні вихідні файли розділу.

Завантажте архів через `git pull --ff-only origin preview` у папці сайту. Потім:

```bash
unzip exports/briller-compare-pages.zip -d "$HOME/Briller-Compare-Export"
cd "$HOME/Briller-Compare-Export"
python3 serve.py --port 8040
```

Відкрийте http://localhost:8040/uk/compare/ або http://localhost:8040/en/compare/.
Цей сервер працює з окремої папки на окремому порту; він не перемикає гілок сайту чи застосунку. Для перегляду потрібен Python 3, без npm-встановлення.

У ZIP є `README.md` з інструкціями, `manifest.json` з версією вмісту й контрольними сумами та `source/` з даними порівнянь. Це знімок готового розділу: оновлення сайту не змінює вже розпакований архів. Посилання на інші розділи перенаправляються на briller.house.

Для повторного експорту після збірки актуального сайту:

```bash
BRILLER_PREVIEW=1 npm run build
python3 scripts/export-compare.py
```
