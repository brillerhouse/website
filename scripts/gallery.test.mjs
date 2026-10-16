import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
import ts from 'typescript';
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const catalogue = read('content/gallery-catalogue.json');
const originals = read('content/gallery.json');
const { outputText } = ts.transpileModule(fs.readFileSync('lib/gallery.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
const scope = { exports: {}, require: id => {
  if (id === '@/content/gallery-catalogue.json') return { default: catalogue };
  if (id === '@/content/gallery.json') return { default: originals };
  throw new Error(`Unexpected dependency: ${id}`);
}};
vm.runInNewContext(outputText, scope);
const { galleryConcepts, galleryReferences, galleryPrompt, galleryTileStyle } = scope.exports;

test('the inspiration library covers every one of seven rooms in twelve styles exactly once', () => {
  assert.equal(catalogue.rooms.length, 7);
  assert.equal(catalogue.styles.length, 12);
  assert.deepEqual(catalogue.rooms.map(room => room.id), ['living','bedroom','bathroom','kitchen','office','dining','workspace']);
  assert.equal(galleryConcepts.length, 84);
  assert.equal(new Set(galleryConcepts.map(item => item.id)).size, 84);
  for (const room of catalogue.rooms) for (const style of catalogue.styles) {
    const items = galleryConcepts.filter(item => item.room === room.id && item.style === style.id);
    assert.equal(items.length, 1, `${room.id}/${style.id}`);
    assert.equal(items[0].tile, catalogue.rooms.indexOf(room));
    assert.equal(items[0].image, style.image);
  }
});
test('every inspiration has a substantive, unique prompt in both languages with room constraints', () => {
  for (const locale of ['en','uk']) {
    const prompts = galleryConcepts.map(item => galleryPrompt(item, locale));
    assert.equal(new Set(prompts).size, 84);
    for (const item of galleryConcepts) {
      const prompt = galleryPrompt(item, locale);
      assert.ok(prompt.length > 450, item.id);
      assert.ok(prompt.includes(locale === 'en' ? 'windows, doors' : 'вікна, двері'), item.id);
      assert.ok(prompt.includes(locale === 'en' ? 'uploaded photo' : 'завантаженому фото'), item.id);
      assert.ok(!/undefined|null|TODO|placeholder/.test(prompt), item.id);
      if (item.room === 'bathroom') assert.ok(prompt.includes(locale === 'en' ? 'slip-resistant' : 'неслизьке'), item.id);
      if (item.room === 'kitchen') assert.ok(prompt.includes(locale === 'en' ? 'appliance positions' : 'розташування мийки'), item.id);
      if (item.room === 'office') assert.ok(prompt.includes(locale === 'en' ? 'ergonomic' : 'ергономічне'), item.id);
      if (item.room === 'workspace') assert.ok(prompt.includes(locale === 'en' ? 'workbench' : 'робочою поверхнею'), item.id);
    }
  }
});
test('all twelve generated image sets are real WebP assets and tile positions address seven distinct scenes', () => {
  for (const style of catalogue.styles) {
    const data = fs.readFileSync('public' + style.image);
    assert.equal(data.toString('ascii', 0, 4), 'RIFF', style.id);
    assert.equal(data.toString('ascii', 8, 12), 'WEBP', style.id);
    assert.ok(data.length > 10000, style.id);
  }
  for (const style of catalogue.styles) {
    assert.equal(new Set(style.crops.map(crop => JSON.stringify(galleryTileStyle(crop)))).size, 7);
    for (const crop of style.crops) {
      assert.ok(crop.x >= 0 && crop.y >= 0 && crop.width > 0 && crop.height > 0);
      assert.ok(crop.x + crop.width <= 1 && crop.y + crop.height <= 1);
      assert.ok(Math.abs(crop.width * 1024 / (crop.height * 1536) - 4/3) < 0.0001);
    }
  }
});
test('original references remain available with localized prompts', () => {
  assert.equal(galleryReferences.length, 6);
  for (const item of galleryReferences) {
    assert.ok(fs.existsSync('public' + item.image), item.id);
    for (const locale of ['en','uk']) assert.ok(galleryPrompt(item, locale).length > 450, item.id);
  }
});
