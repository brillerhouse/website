import fs from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const examples = read('content/solutions/examples.json');
const media = read('content/solutions/media.json');
const budgets = read('content/solutions/budgets.json');
const pages = read('content/solutions/en.json').pages;
const escape = text => text.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' }[character]));

test('every Solution has its own complete bilingual example and a real WebP asset', () => {
  assert.deepEqual(Object.keys(examples).sort(), pages.map(page => page.slug).sort());
  assert.deepEqual(Object.keys(media).sort(), pages.map(page => page.slug).sort());
  for (const { slug } of pages) {
    const asset = fs.readFileSync(`public/images/solutions/${slug}.webp`);
    assert.equal(asset.toString('ascii', 0, 4), 'RIFF', `${slug}: invalid image`);
    assert.equal(asset.toString('ascii', 8, 12), 'WEBP', `${slug}: invalid image`);
    assert.ok(media[slug].width > 0 && media[slug].height > 0, `${slug}: missing intrinsic dimensions`);
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

test('all localized exports render the matching pair, advice, disclosure and existing sections', () => {
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
      assert.equal((html.match(/<input[^>]*name="solution-project-budget"[^>]*>/g) || []).length, 3, `${locale}/${page.slug}: missing budget choices`);
      assert.ok(html.includes('id="solution-technical-advice"'));
      for (const text of Object.values(budgets[page.slug][locale].standard)) assert.ok(html.includes(escape(text)), `${locale}/${page.slug}: missing initial budget advice`);
      assert.ok(html.includes(locale === 'uk' ? 'Ілюстративна концепція' : 'Illustrative AI-generated design concept'));
      for (const text of [example.title, example.before, example.after, example.keep, example.check, ...example.advice.flat()]) {
        assert.ok(html.includes(escape(text)), `${locale}/${page.slug}: missing example text ${text}`);
      }
      for (const id of ['overview', 'workflow', 'insights', 'briefs', 'questions']) assert.ok(html.includes(`id="${id}"`), `${locale}/${page.slug}: lost ${id}`);
      for (const text of [page.title, page.problem, ...page.pains, ...page.benefits.flat(), ...page.steps.flat(), ...page.advice.flat(), ...page.directions.flat(), ...page.briefs, ...page.faqs.flat(), page.note]) {
        assert.ok(html.includes(escape(text)), `${locale}/${page.slug}: missing existing content ${text}`);
      }
    }
  }
});
