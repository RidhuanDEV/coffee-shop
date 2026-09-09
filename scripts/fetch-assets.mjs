import fs from 'node:fs/promises';
const photos=[['cake','https://unsplash.com/photos/plate-of-cooked-food-lf5PSuLizSE'],['hero','https://unsplash.com/photos/croissant-and-coffee-on-a-rustic-table-h4KFXL9ljjg'],['interior','https://unsplash.com/photos/cafe-interior-with-hanging-bulbs-and-table-VobvKmG-StA'],['latte','https://unsplash.com/photos/latte-field-teacup-by-open-book-A8shBrquZZs'],['espresso','https://unsplash.com/photos/CAUgg2lxRk0'],['pastry','https://unsplash.com/photos/baked-croissants-93NV4sBJs_M'],['food','https://unsplash.com/photos/sandwich-on-white-surface-IZ0LRt1khgM'],['matcha','https://unsplash.com/photos/matcha-tea-being-prepared-on-a-digital-scale-QS7n8jR6m8s']];
await fs.mkdir('frontend/public/assets',{recursive:true});
const credits=[];
for(const [name,page] of photos){
 const response=await fetch(page);if(!response.ok)throw Error(page+': '+response.status);
 const html=await response.text();const image=html.match(/<meta property="og:image" content="([^"]+)"/);if(!image)throw Error('Image missing: '+page);
 const raw=new URL(image[1].replaceAll('&amp;','&'));raw.search='';raw.searchParams.set('fm','webp');raw.searchParams.set('w',name==='hero'||name==='interior'?'1200':'700');raw.searchParams.set('q','80');raw.searchParams.set('fit','max');
 const asset=await fetch(raw);if(!asset.ok)throw Error('Asset HTTP '+asset.status);const data=Buffer.from(await asset.arrayBuffer());await fs.writeFile(`frontend/public/assets/${name}.webp`,data);console.log(name,data.length);
 credits.push(`| ${name}.webp | [Original photo](${page}) | [Unsplash License](https://unsplash.com/license) |`);
}
await fs.writeFile('frontend/public/assets/LICENSES.md','# Asset credits\n\nDownloaded 2026-09-08. Local WebP derivatives for illustrative development content; these photos do not depict the actual Toko Kopi shop or its products.\n\n| File | Source | License |\n|---|---|---|\n'+credits.join('\n')+'\n\nFraunces and Inter fonts are self-hosted through @fontsource packages under SIL Open Font License. Lucide icons use ISC.\n');
