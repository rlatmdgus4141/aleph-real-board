// T05 B: real-browser (Chromium via Playwright) check of CSV download. Does not alter fixed tests.
const {chromium}=require('playwright');const fs=require('fs'),os=require('os'),path=require('path'),assert=require('assert/strict');
(async()=>{
 const exe=process.env.PW_EXE||undefined;
 const browser=await chromium.launch({executablePath:exe});const out={executed_at:new Date().toISOString(),browser:browser.version(),checks:[]};
 const rec=(id,ok,detail)=>out.checks.push({id,status:ok?'PASS':'FAIL',detail});
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'t05b-'));
 const open=async(file)=>{const ctx=await browser.newContext({acceptDownloads:true});const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e)));await page.goto('file://'+path.resolve(file));return {ctx,page,errs}};
 const dl=async(page,sel)=>{const [d]=await Promise.all([page.waitForEvent('download',{timeout:5000}),page.click(sel)]);const p=path.join(tmp,d.suggestedFilename());await d.saveAs(p);return {name:d.suggestedFilename(),buf:fs.readFileSync(p)}};
 const showEvidence=p=>p.click('#tab-evidence');
 // B1 real download from preserved real records
 {const {ctx,page,errs}=await open('index.html');await showEvidence(page);const d=await dl(page,'#export-csv');const t=d.buf.toString('utf8');
  const lines=t.replace(/^﻿/,'').split('\r\n').filter(Boolean);
  rec('B1-download',d.name.endsWith('.csv')&&d.buf[0]===0xEF&&d.buf[1]===0xBB&&d.buf[2]===0xBF&&lines.length===3&&lines[0]==='날짜,기온,단위,출처,출처 URL,출처 시각,조회 시각'&&lines[1].startsWith('2026-09-30,24,°C,')&&lines[2].startsWith('2026-10-01,17.3,°C,'),{filename:d.name,lines});
  rec('B1-no-page-error',errs.length===0,errs);await ctx.close()}
 // B2 empty records -> toast, no download
 {const h=fs.readFileSync('index.html','utf8').replace(/(id="public-evidence" type="application\/json">)[\s\S]*?(<\/script>)/,'$1[]$2');fs.writeFileSync(path.join(tmp,'empty.html'),h);
  const {ctx,page}=await open(path.join(tmp,'empty.html'));let got=false;page.on('download',()=>got=true);await showEvidence(page);await page.click('#export-csv');await page.waitForTimeout(500);
  const toast=await page.textContent('#toast');rec('B2-empty',toast==='내려받을 실제 기록이 없습니다'&&!got,{toast,downloaded:got});await ctx.close()}
 // B3 Korean preserved in header via UTF-8 decode of real file (checked in B1); plus HTML export keeps CSV feature
 {const {ctx,page}=await open('index.html');await showEvidence(page);const d=await dl(page,'#export-html');const f=path.join(tmp,'exported.html');fs.writeFileSync(f,d.buf);
  const {ctx:c2,page:p2,errs}=await open(f);await showEvidence(p2);const has=await p2.$('#export-csv');const d2=await dl(p2,'#export-csv');
  rec('B3-public-html-keeps-csv',!!has&&d2.buf.toString('utf8').includes('2026-10-01,17.3')&&errs.length===0,{htmlName:d.name,csvName:d2.name,errs});await ctx.close();await c2.close()}
 // B4 existing JSON download and replay/synthetic isolation
 {const {ctx,page}=await open('index.html');await showEvidence(page);const j=await dl(page,'#export-json');const jj=JSON.parse(j.buf.toString('utf8'));
  rec('B4-json-still-works',j.name==='seoul-real-records.json'&&jj.records.length===2,{name:j.name,n:jj.records.length});
  await page.click('#tab-replay');await page.evaluate(()=>{applyReplay('T04-NORMAL-D1-A')});await showEvidence(page);
  const d=await dl(page,'#export-csv');const t=d.buf.toString('utf8');rec('B4-synthetic-excluded',!t.includes('T04-NORMAL')&&t.split('\r\n').filter(Boolean).length===3,{rows:t.split('\r\n').filter(Boolean).length});await ctx.close()}
 await browser.close();fs.rmSync(tmp,{recursive:true,force:true});
 out.passed=out.checks.filter(c=>c.status==='PASS').length;out.total=out.checks.length;console.log(JSON.stringify(out,null,2));process.exitCode=out.passed===out.total?0:1;
})().catch(e=>{console.log(JSON.stringify({error:String(e)}));process.exit(2)});
