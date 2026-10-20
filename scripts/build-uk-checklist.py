"""Rebuild the Ukrainian A4 companion PDF; requires reportlab and PyMuPDF.
The user-supplied English PDF is deliberately preserved.
"""
from pathlib import Path
from io import BytesIO
import fitz
import subprocess
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle

ROOT = Path(__file__).resolve().parents[1]
for name, suffix in [('Manrope', '0'), ('ManropeBold', '3')]:
    pdfmetrics.registerFont(TTFont(name, str(ROOT / f'public/fonts/manrope-{suffix}.ttf')))
navy = colors.HexColor('#294b61'); ink = colors.HexColor('#202d35')
muted = colors.HexColor('#596b7b'); pale = colors.HexColor('#dfe8ee'); line = colors.HexColor('#cad6df')
output = ROOT / 'public/downloads/briller-builder-checklist-uk.pdf'
c = canvas.Canvas(str(output), pagesize=A4, invariant=1)
c.setTitle('Перед початком робіт — чекліст Briller'); c.setAuthor('Briller.House'); c.setSubject('Перевірка ШІ-візуалізації на об’єкті')
W,H = A4; left=30; right=W-30
style = ParagraphStyle('copy',fontName='Manrope',fontSize=7.2,leading=9.8,textColor=ink)
def para(text,x,y,width,size=7.2,leading=9.8,bold=False,color=ink):
    s=ParagraphStyle('p',parent=style,fontName='ManropeBold' if bold else 'Manrope',fontSize=size,leading=leading,textColor=color)
    p=Paragraph(text,s); _,h=p.wrap(width,H);p.drawOn(c,x,y-h);return h
c.setFillColor(navy);c.rect(0,H-104,W,104,fill=1,stroke=0)
# Rasterize the official orb SVG without altering its artwork.
raster = subprocess.run(['node', '--input-type=module', '-e', "import sharp from 'sharp'; const chunks=[];for await(const c of process.stdin)chunks.push(c);process.stdout.write(await sharp(Buffer.concat(chunks)).resize(128,128).png().toBuffer());"], input=(ROOT/'public/brand/briller-foreground.svg').read_bytes(), stdout=subprocess.PIPE, check=True, cwd=ROOT)
from reportlab.lib.utils import ImageReader
c.drawImage(ImageReader(BytesIO(raster.stdout)),left-3,H-38,28,28,mask='auto')
para('briller',left+29,H-17,100,12,15,True,colors.white)
para('briller.house',right-65,H-20,65,7,9,color=colors.white)
para('Перед початком робіт',left,H-44,W-60,22,25,True,colors.white)
para('Перевірка ШІ-візуалізації. Чекліст для зустрічі з будівельником.',left,H-77,W-60,8.5,11,color=colors.white)
y=H-116
y-=para('Візьміть оригінальні фото, обрану візуалізацію, наявні креслення та фактичні розміри виробів. За потреби залучіть дизайнера, інженера, сантехніка чи електрика.',left,y,W-60)+9
for text in ['Проєкт: _______________________________________    Дата перевірки: __________________', 'Приміщення / версія візуалізації: __________________________________________________']:
    y-=para(text,left,y,W-60)+10
para('Позначте один статус:  П — підтверджено   З — потрібні зміни   Д — потрібне дослідження',left,y,W-60,7,9);y-=19
# One wide action column, three printable status boxes, and space for ownership/references.
action_end=left+335; status_x=[action_end+7,action_end+23,action_end+39]; owner=action_end+57; ref=owner+64
para('ПЕРЕВІРКА / ДІЯ',left,y,325,6.5,8,True,muted)
for x,t in zip(status_x,['П','З','Д']):para(t,x,y,10,6.5,8,True,muted)
para('ВІДПОВІДАЛЬНИЙ',owner,y,64,5.5,8,True,muted);para('КРЕСЛЕННЯ',ref,y,right-ref,5.5,8,True,muted);y-=15
sections=[
('A. ГЕОМЕТРІЯ ТА ГАБАРИТИ',[
'Перевірте обміри. Зафіксуйте розбіжності в прорізах, розташуванні стін і нерухомих перешкодах.',
'Перевірте габарити меблів і техніки, відкривання дверцят, проходи та робочий простір на плані.']),
('B. КОНСТРУКЦІЇ',[
'Визначте конструктивні зміни. Отримайте необхідне обстеження та проєктне рішення до початку робіт.',
'Покажіть потрібні балки, опори й пов’язані короби на кресленнях і в кошторисі.']),
('C. ТРУБИ, ЕЛЕКТРИКА ТА ВЕНТИЛЯЦІЯ',[
'Уточніть точки підключення води й каналізації, траси та потрібний доступ.',
'Перевірте електричну потужність, схеми кіл, розташування обладнання, потрібні перевірки й випробування.',
'Уточніть траси вентиляції, місце для обладнання, точки викиду повітря та доступ для обслуговування.']),
('D. ВИСОТА СТЕЛІ ТА ОЗДОБЛЕННЯ',[
'Зафіксуйте наявну висоту у просвіті та найнижчу балку чи короб.',
'Накресліть майбутні шари підлоги й стелі. Укажіть чистову висоту в найнижчій точці.',
'Перевірте чинні вимоги до висоти й монтажні зазори для виробів.',
'Оберіть конкретні світильники й системи матеріалів. Узгодьте зразки, підготовку основи та монтажні деталі.']),
('E. ОБСЯГ РОБІТ, ВАРТІСТЬ І ПОГОДЖЕННЯ',[
'Визначте потрібні дозволи, технічні погодження та відповідальних за їх отримання.',
'Перелічіть неперевірені приховані умови. Узгодьте порядок досліджень і можливих змін вартості.',
'Додайте до кошторису посилання на погоджені плани, розрізи й специфікації. Укажіть виключення та резерви.'])]
for title,rows in sections:
    c.setFillColor(pale);c.rect(left,y-16,W-60,16,fill=1,stroke=0)
    para(title,left+5,y-3,W-70,7,9,True);y-=19
    for i,text in enumerate(rows,1):
        h=para(f'{i}.',left+1,y,13,7,10)
        h=max(h,para(text,left+15,y,action_end-left-21,7.2,9.8));row_h=max(23,h+7)
        c.setStrokeColor(line);c.setLineWidth(.4)
        for x in status_x:c.rect(x,y-10,6,6,fill=0,stroke=1)
        c.line(left,y-row_h,right,y-row_h)
        y-=row_h
    y-=3
assert y>100, f'Checklist content overruns notes area: {y}'
para('Відкриті питання / рішення:',left,y-3,W-60,7,10,True)
c.setStrokeColor(line)
for offset in [22,36]:c.line(left,y-offset,right,y-offset)
para('Погоджуйте початок робіт, коли розміри, опори, інженерні траси й чистові висоти узгоджені в проєктній документації.',left,y-44,W-60,7,10,True)
para('briller.house',left,30,90,7,9,True,navy)
para('/uk/blog/how-to-read-an-ai-render-before-you-build/',left+80,30,W-150,6.3,9,color=muted)
para('1 / 1',right-24,30,24,7,9,color=muted)
c.showPage();c.save()
doc=fitz.open(output);assert len(doc)==1
assert 'Перед початком робіт' in doc[0].get_text()
pix=doc[0].get_pixmap(matrix=fitz.Matrix(1.334,1.334),alpha=False)
from PIL import Image
image=Image.frombytes('RGB',[pix.width,pix.height],pix.samples)
image.save(ROOT/'public/images/blog/builder-checklist-preview-uk.webp',format='WEBP',quality=90)
print(f'Generated Ukrainian A4 checklist and preview; notes start at {y:.0f} pt.')
