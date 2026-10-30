import sharp from 'sharp';
export async function normalizeImage(bytes, target, { allowEnlarge = false } = {}) {
  if (!allowEnlarge) {
    const native = await sharp(bytes).metadata();
    if (Math.min(target.width / native.width, target.height / native.height) > 1) throw new Error('Native AI output is below target; ordinary enlargement is not allowed');
  }
  const resized = await sharp(bytes).resize(target.width,target.height,{fit:'inside',kernel:'lanczos3',withoutEnlargement:!allowEnlarge}).toBuffer({resolveWithObject:true});
  const dx=target.width-resized.info.width,dy=target.height-resized.info.height;
  const padding={left:Math.floor(dx/2),right:Math.ceil(dx/2),top:Math.floor(dy/2),bottom:Math.ceil(dy/2)};
  const data=await sharp(resized.data).extend({...padding,background:'#f1f3f4'}).jpeg({quality:95,chromaSubsampling:'4:4:4',mozjpeg:true}).toBuffer();
  return {data,width:target.width,height:target.height,contentWidth:resized.info.width,contentHeight:resized.info.height,padding};
}
