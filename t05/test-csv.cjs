// Frozen T05 checks: exercise the actual page's CSV button handler in a DOM shim.
// This is deterministic functional testing, not a real-browser layout/download test.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
function setup(records){
 const elements=new Map();
 const element=()=>({textContent:'',innerHTML:'',hidden:false,setAttribute(){},getAttribute(){return 'true'},replaceChildren(){},appendChild(){},focus(){},click(){if(this.onclick)this.onclick()},addEventListener(event,fn){if(event==='click')this.onclick=fn}});
 for(const match of html.matchAll(/id="([^"]+)"/g))elements.set(match[1],element());
 for(const match of html.matchAll(/<script id="([^"]+)" type="application\/json">([\s\S]*?)<\/script>/g))elements.get(match[1]).textContent=match[2];
 const document={getElementById:id=>elements.get(id)||null,querySelector:()=>element(),querySelectorAll:()=>[],createElement:element};
 const ctx=vm.createContext({document,window:{},localStorage:{getItem:()=>null,setItem(){}},URL,Intl,Date,JSON,structuredClone,TextEncoder,setTimeout:()=>0,clearTimeout(){},console});
 for(const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g))if(!match[1].includes('application/json'))vm.runInContext(match[2],ctx);
 ctx.input=structuredClone(records);ctx.outputs=[];
 vm.runInContext('live.daily_readings=input.map(reading=>({reading,record_date:reading.record_date})); download=(filename,body,type)=>outputs.push({filename,body,type});',ctx);
 function click(){const b=elements.get('export-csv');assert.ok(b,'CSV 다운로드 버튼(export-csv)이 아직 없음');assert.equal(typeof b.onclick,'function','CSV 버튼 연결이 아직 없음');b.click()}
 return {ctx,elements,click,outputs:ctx.outputs};
}
function reading(date='2026-09-30',value=24){return {signal_id:'seoul-temperature-2m',record_date:date,normalized_value:value,unit:'°C',source_name:'서울 기온',source_url:'https://example.org/weather',source_time:'2026-10-01T10:00+09:00',fetched_at:'2026-10-01T01:05:32.854Z',record_timezone:'Asia/Seoul'}}
// Independent CSV parser: handles quoted delimiters, doubled quotes and embedded newlines.
function parse(s){s=s.replace(/^\uFEFF/,'');let rows=[],row=[],field='',quoted=false;for(let i=0;i<s.length;i++){const c=s[i];if(c==='"'){if(quoted&&s[i+1]==='"'){field+='"';i++}else quoted=!quoted}else if(c===','&&!quoted){row.push(field);field=''}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&s[i+1]==='\n')i++;row.push(field);rows.push(row);row=[];field=''}else field+=c}assert.equal(quoted,false);if(field||row.length){row.push(field);rows.push(row)}return rows}
const header=['날짜','기온','단위','출처','출처 URL','출처 시각','조회 시각'];
function result(h){h.click();assert.equal(h.outputs.length,1);assert.match(h.outputs[0].filename,/\.csv$/);const rows=parse(h.outputs[0].body);assert.deepEqual(rows[0],header);rows.forEach(r=>assert.equal(r.length,7));return rows.slice(1)}
const pair=()=>[reading(),reading('2026-10-01',17.3)];
const cases=[
 ['CSV-01',()=>{const h=setup([]);h.click();assert.equal(h.outputs.length,0);assert.equal(h.elements.get('toast').textContent,'내려받을 실제 기록이 없습니다')}],
 ['CSV-02',()=>{const rows=result(setup([reading()]));assert.equal(rows.length,1);assert.deepEqual(rows[0].slice(0,2),['2026-09-30','24'])}],
 ['CSV-03',()=>assert.deepEqual(result(setup(pair())).map(r=>r.slice(0,2)),[['2026-09-30','24'],['2026-10-01','17.3']])],
 ['CSV-04',()=>assert.deepEqual(result(setup(pair().reverse())).map(r=>r[0]),['2026-09-30','2026-10-01'])],
 ['CSV-05',()=>assert.equal(result(setup([reading()]))[0][5],'2026-10-01T10:00+09:00')],
 ['CSV-06',()=>assert.deepEqual(result(setup([reading('2026-09-30',0),reading('2026-10-01',-3.5)])).map(r=>r[1]),['0','-3.5'])],
 ['CSV-07',()=>{const r=reading();r.source_name='서울, "기온"\n정보';assert.equal(result(setup([r]))[0][3],r.source_name)}],
 ['CSV-08',()=>{const h=setup([reading()]);const rows=result(h);assert.equal(h.outputs[0].body.charCodeAt(0),0xFEFF);assert.equal(rows[0][3],'서울 기온');assert.equal(rows[0][2],'°C')}],
 ['CSV-09',()=>{const h=setup(pair());vm.runInContext("applyReplay('T04-NORMAL-D1-A');applyReplay('T04-NORMAL-D2')",h.ctx);assert.deepEqual(result(h).map(r=>r.slice(0,2)),[['2026-09-30','24'],['2026-10-01','17.3']])}],
 ['CSV-10',()=>{const h=setup(pair().reverse());const before=vm.runInContext('JSON.stringify(live)',h.ctx);h.click();h.click();assert.equal(h.outputs.length,2);assert.equal(h.outputs[0].body,h.outputs[1].body);assert.equal(vm.runInContext('JSON.stringify(live)',h.ctx),before)}]
];
const results=cases.map(([id,fn])=>{try{fn();return {id,status:'PASS'}}catch(e){return {id,status:'FAIL',reason:e.message}}});
console.log(JSON.stringify({executed_at:new Date().toISOString(),environment:'Node.js '+process.version+' / DOM shim (not real browser)',passed:results.filter(r=>r.status==='PASS').length,total:10,results},null,2));
process.exitCode=results.every(r=>r.status==='PASS')?0:1;
