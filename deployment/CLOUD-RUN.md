# Google Cloud Run

Сайт розгортається як окремий сервіс `briller-website`. Існуючий сервіс застосунку та DNS не змінюються. Спершу використовуємо URL `*.run.app` для перегляду. Юридичні чернетки й ілюстративна галерея залишаються позначеними як такі.

## Що потрібно

- Точний Google Cloud Project ID із Billing.
- Регіон: за замовчуванням europe-west1.
- Автентифікований gcloud у Cloud Shell або підключена identity у робочому середовищі. Не передавайте приватні ключі в чат.
- Перевірені права на Cloud Run deployment, Cloud Build і Artifact Registry, а також `iam.serviceAccounts.actAs` для runtime identity. Якщо API ще не ввімкнені або runtime account відсутній, потрібні права на їх створення; ці підготовчі дії може виконати адміністратор.
- Перевірена build identity з правами на завантаження image в Artifact Registry, доступ до source і запис build logs. Фактична build identity залежить від налаштувань проєкту — не припускайте, що це legacy Cloud Build service account.
- Організаційна політика має дозволяти public Cloud Run invoker. Потрібен публічний marketing website, але не публічний доступ до backend застосунку.

## Cloud Shell

Завантажте архів briller-site.zip кнопкою Upload у Cloud Shell, розпакуйте та перейдіть у папку `briller`. Підставте реальний ID:

```bash
export PROJECT_ID='YOUR_PROJECT_ID'
export BRILLER_REGION='europe-west1'
bash deployment/cloudrun.sh
```

Скрипт використовує `gcloud run deploy --source`: Google Cloud Build збирає наявний Dockerfile. Cloud Run працює на 8080, memory 256 MiB, CPU 1, concurrency 80, min 0, max 1. Dedicated runtime service account не потребує доступу до Firebase, Stripe чи Vertex AI. Витрати на build, image storage, requests та traffic залежать від використання й умов Google Cloud; max 1 не є бюджетним лімітом.

Скрипт створює service account тільки після успішного read-only запиту. За браку прав на IAM його має створити адміністратор до запуску; не видавайте Owner/Editor лише для обходу помилки.

Після розгортання перевірте `/en/`, `/uk/`, `/uk/pricing/`, `/uk/gallery/`, `/sitemap.xml`, `/robots.txt`, 404 і доступність CTA на build.briller.house. Налаштування DNS та briller.house — окремий крок після перевірки.
