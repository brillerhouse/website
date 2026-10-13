# Локальна перевірка до Dev-деплою

`preview` — зміни з чату для локального перегляду. Push до цієї гілки не запускає workflow або Google Cloud deployment.

`dev` — перевірена версія для онлайн Cloud Run. Зміни переносяться сюди після явного прохання користувача опублікувати переглянутий результат.

`main` — окремий код для production/release; не оновлюється автоматично з preview.

## Перший запуск на Mac

Потрібні Git і Node.js 22 LTS. У Terminal перейдіть у каталог, де хочете зберігати сайт (наприклад Downloads), та виконайте:

```bash
git clone --branch preview https://github.com/brillerhouse/website.git
cd website
npm ci
npm run dev
```

Відкрийте http://localhost:3000/en/ або http://localhost:3000/uk/. Якщо порт зайнятий, використайте Local URL, надрукований Next.js. Тримайте цей термінал запущеним.

## Якщо репозиторій уже скопійований

У папці `website`:

```bash
git fetch origin
git switch --track origin/preview
npm ci
npm run dev
```

Якщо локальна гілка preview вже є, використайте `git switch preview`. Якщо у вас є незбережені локальні зміни, спочатку збережіть їх окремим комітом або stash; не використовуйте reset --hard.

## Після змін у чаті

Асистент комітить і публікує в preview, не деплоїть. У другому терміналі, у тій самій папці:

```bash
git pull --ff-only
```

Next.js автоматично оновлює сторінку. Якщо змінилися package.json/package-lock.json, зупиніть сервер Ctrl+C, виконайте `npm ci` та знову `npm run dev`. Код із чату не синхронізується на Mac, доки ви не виконаєте git pull.

Для перевірки build-версії за потреби:

```bash
BRILLER_PREVIEW=1 npm run build
npm run check
BRILLER_PREVIEW=1 npm test
```

## Після перевірки

Напишіть у чаті «Деплой цієї версії». Асистент переносить саме перевірений commit до dev та запускає наявну автоматизацію. Онлайн-адреса залишається:

https://briller-website-dev-1097780641970.europe-west1.run.app/en/

Внутрішні команди асистента:

- Звичайні зміни: `bash scripts/publish-preview.sh`.
- Схвалена версія: `bash scripts/promote-preview.sh <повний-перевірений-SHA>`.

Promotion зупиняється, якщо preview змінився після перевірки або dev розійшовся з preview. Cloud Run deploy застарілого чи неперевіреного коміту не виконується.
