// Chụp avatar.html, cover.html -> ../avatar.png (960x960), ../cover.png (1640x624). Chạy: node build.mjs (cần playwright)
import {createRequire} from 'module';const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
import path from 'path';import {fileURLToPath} from 'url';
const d=path.dirname(fileURLToPath(import.meta.url));
const b=await chromium.launch();
for(const [n,w,h] of [['avatar',960,960],['cover',1640,624]]){
 const p=await b.newPage({viewport:{width:w,height:h}});
 await p.goto('file://'+d+'/'+n+'.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(400);
 await p.screenshot({path:path.join(d,'..',n+'.png')});await p.close();}
await b.close();
