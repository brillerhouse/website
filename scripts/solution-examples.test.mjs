import fs from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const examples = read('content/solutions/examples.json');
const media = read('content/solutions/media.json');
const budgets = read('content/solutions/budgets.json');
const advice = read('content/solutions/advice.json');
const sparks = read('content/solutions/sparks.json');
const pages = read('content/solutions/en.json').pages;
const tipsFor = (locale, slug) => advice.pages[slug].map(id => {
  const shared = advice.sharedHomeTips[id];
  return shared ? read(`content/${locale}.json`).home.brillDemo.tips[shared.index] : advice.topics[id][locale];
});
const escape = text => text.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' }[character]));

test('every Solution has its own complete bilingual example and a real WebP asset', () => {
  assert.deepEqual(Object.keys(examples).sort(), pages.map(page => page.slug).sort());
  assert.deepEqual(Object.keys(media).sort(), pages.map(page => page.slug).sort());
  for (const { slug } of pages) {
    const asset = fs.readFileSync(`public/images/solutions/${slug}.webp`);
    assert.equal(asset.toString('ascii', 0, 4), 'RIFF', `${slug}: invalid image`);
    assert.equal(asset.toString('ascii', 8, 12), 'WEBP', `${slug}: invalid image`);
    assert.ok(media[slug].width > 0 && media[slug].height > 0, `${slug}: missing intrinsic dimensions`);
    assert.ok(Number.isFinite(media[slug].focusY) && media[slug].focusY >= 0 && media[slug].focusY <= 100, `${slug}: missing or invalid comparison framing`);
    for (const locale of ['en', 'uk']) {
      const example = examples[slug][locale];
      for (const key of ['title', 'before', 'after', 'keep', 'check']) assert.ok(example[key]?.trim(), `${locale}/${slug}: missing ${key}`);
      assert.equal(example.advice.length, 3, `${locale}/${slug}: incomplete advice`);
      for (const entry of example.advice) {
        assert.equal(entry.length, 2);
        assert.ok(entry.every(text => typeof text === 'string' && text.trim()), `${locale}/${slug}: empty advice`);
      }
    }
  }
  for (const locale of ['en', 'uk']) {
    assert.equal(new Set(Object.values(examples).map(example => example[locale].title)).size, pages.length, 'Examples must be specific to each solution');
    assert.equal(new Set(Object.values(examples).flatMap(example => example[locale].advice.map(([, text]) => text))).size, pages.length * 3, 'Do not repeat generic advice between solutions');
  }
});

test('all Solutions have distinct Economy, Standard and Premium advice in both languages', () => {
  assert.deepEqual(Object.keys(budgets).sort(), pages.map(page => page.slug).sort());
  for (const { slug } of pages) for (const locale of ['en', 'uk']) {
    const options = budgets[slug][locale];
    assert.deepEqual(Object.keys(options), ['economy', 'standard', 'premium']);
    for (const field of ['summary', 'materials', 'installation', 'tradeoff']) {
      const values = Object.values(options).map(option => option[field]);
      assert.ok(values.every(value => typeof value === 'string' && value.trim()), `${locale}/${slug}: missing ${field}`);
      assert.equal(new Set(values).size, 3, `${locale}/${slug}: budget options repeat ${field}`);
    }
  }
});

test('every Solution has localized feature advice with three fully distinct budget specifications', () => {
  assert.deepEqual(Object.keys(advice.pages).sort(), pages.map(page => page.slug).sort());
  const referenced = new Set(Object.values(advice.pages).flat());
  assert.deepEqual([...referenced].sort(), [...Object.keys(advice.topics), ...Object.keys(advice.sharedHomeTips)].sort(), 'No missing or unused feature topics');
  for (const { slug } of pages) {
    const ids = advice.pages[slug];
    assert.ok(ids.length >= 3, `${slug}: provide several relevant feature options`);
    assert.equal(new Set(ids).size, ids.length, `${slug}: repeated feature`);
    for (const id of ids) assert.ok(advice.topics[id] || advice.sharedHomeTips[id], `${slug}: unknown feature ${id}`);
    for (const locale of ['en', 'uk']) for (const tip of tipsFor(locale, slug)) {
      assert.ok(tip.category.trim() && tip.title.trim(), `${locale}/${slug}: missing feature label`);
      assert.deepEqual(Object.keys(tip.budgets), ['economy', 'standard', 'premium']);
      for (const field of ['specification', 'detail', 'difference']) {
        const values = Object.values(tip.budgets).map(option => option[field]);
        assert.ok(values.every(value => typeof value === 'string' && value.trim()), `${locale}/${slug}/${tip.title}: missing ${field}`);
        assert.equal(new Set(values).size, 3, `${locale}/${slug}/${tip.title}: repeated budget ${field}`);
      }
    }
  }
});

test('each Solution has image hotspots linked to its own advice features', () => {
  assert.deepEqual(Object.keys(sparks).sort(), pages.map(page => page.slug).sort());
  for (const { slug } of pages) {
    assert.ok(Object.keys(sparks[slug]).length >= 2, `${slug}: provide several image hotspots`);
    for (const [id, coordinates] of Object.entries(sparks[slug])) {
      assert.ok(advice.pages[slug].includes(id), `${slug}: image hotspot has no matching advice`);
      assert.equal(coordinates.length, 2);
      assert.ok(coordinates.every(value => Number.isFinite(value) && value >= 5 && value <= 95), `${slug}/${id}: hotspot outside image`);
    }
  }
});

test('all localized exports render feature cards instead of old rows and preserve the slider and original sections', () => {
  for (const locale of ['en', 'uk']) {
    for (const page of read(`content/solutions/${locale}.json`).pages) {
      const html = fs.readFileSync(`out/${locale}/solutions/${page.slug}/index.html`, 'utf8');
      const example = examples[page.slug][locale];
      assert.equal((html.match(/id="before-after"/g) || []).length, 1);
      assert.ok(html.includes('href="#before-after"'));
      assert.ok(html.includes(`/images/solutions/${page.slug}.webp`));
      assert.ok(html.includes('type="range"'), `${locale}/${page.slug}: missing comparison control`);
      assert.ok(html.includes(`aria-label="${locale === 'uk' ? 'Порівняти до та після' : 'Compare before and after'}"`), `${locale}/${page.slug}: missing accessible slider name`);
      assert.ok(html.includes('aria-describedby="solution-example-disclosure"'));
      assert.ok(html.includes('class="solution-smart-sparks"'), `${locale}/${page.slug}: missing Smart Sparks heading`);
      assert.equal((html.match(/class="spark-hotspot solution-spark-hotspot/g) || []).length, Object.keys(sparks[page.slug]).length, `${locale}/${page.slug}: missing image hotspots`);
      for (const id of Object.keys(sparks[page.slug])) {
        assert.ok(html.includes(`aria-controls="solution-advice-${id}"`), `${locale}/${page.slug}: hotspot is not linked to ${id}`);
        assert.ok(html.includes(`id="solution-advice-${id}"`), `${locale}/${page.slug}: missing hotspot destination ${id}`);
      }
      assert.equal((html.match(/<input[^>]*name="solution-project-budget"[^>]*>/g) || []).length, 3, `${locale}/${page.slug}: missing budget choices`);
      assert.ok(html.includes('id="solution-technical-advice"'));
      assert.ok(html.includes(escape(budgets[page.slug][locale].standard.summary)), `${locale}/${page.slug}: missing initial Briller summary`);
      for (const oldClass of ['solution-example-captions', 'solution-project-technical', 'solution-example-kept', 'solution-project-consideration']) {
        assert.ok(!html.includes(`class="${oldClass}"`), `${locale}/${page.slug}: obsolete row still present`);
      }
      assert.ok(html.includes('id="solution-advice-options"'));
      assert.equal((html.match(/data-advice="/g) || []).length, advice.pages[page.slug].length);
      for (const tip of tipsFor(locale, page.slug)) for (const text of [tip.category, tip.title, ...Object.values(tip.budgets.standard)]) {
        assert.ok(html.includes(escape(text)), `${locale}/${page.slug}: missing feature specification ${text}`);
      }
      assert.ok(html.includes(locale === 'uk' ? 'Ілюстративна концепція' : 'Illustrative AI-generated design concept'));
      for (const text of [example.title, example.before, example.after, example.check]) {
        assert.ok(html.includes(escape(text)), `${locale}/${page.slug}: missing example text ${text}`);
      }
      for (const id of ['overview', 'workflow', 'insights', 'briefs', 'questions']) assert.ok(html.includes(`id="${id}"`), `${locale}/${page.slug}: lost ${id}`);
      for (const text of [page.title, page.problem, ...page.pains, ...page.benefits.flat(), ...page.steps.flat(), ...page.advice.flat(), ...page.directions.flat(), ...page.briefs, ...page.faqs.flat(), page.note]) {
        assert.ok(html.includes(escape(text)), `${locale}/${page.slug}: missing existing content ${text}`);
      }
    }
  }
});
