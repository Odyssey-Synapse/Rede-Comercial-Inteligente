import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const publicHtml=fs.readdirSync(root).filter(name=>name.endsWith('.html')).sort();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const exists=file=>fs.existsSync(path.join(root,file));

function localTarget(raw,source){
  const value=String(raw||'').trim();
  if(!value||value.startsWith('#')||/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(value))return null;
  const clean=value.split('#')[0].split('?')[0];
  if(!clean)return null;
  if(clean.startsWith('/api/'))return null;
  let candidate=clean.startsWith('/')?clean.slice(1):path.normalize(path.join(path.dirname(source),clean)).replaceAll('\\','/');
  if(!candidate)return 'index.html';
  if(exists(candidate))return candidate;
  if(!path.extname(candidate)&&exists(`${candidate}.html`))return `${candidate}.html`;
  if(candidate.endsWith('/')&&exists(`${candidate}index.html`))return `${candidate}index.html`;
  return candidate;
}

function anchors(html){
  const out=new Set();
  for(const match of html.matchAll(/\bid=["']([^"']+)["']/gi))out.add(match[1]);
  return out;
}

test('todos os href e src locais das páginas públicas apontam para arquivos existentes',()=>{
  const broken=[];
  for(const file of publicHtml){
    const html=read(file);
    for(const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)){
      const raw=match[1];
      const target=localTarget(raw,file);
      if(target&&!exists(target))broken.push(`${file} -> ${raw} (esperado ${target})`);
    }
  }
  assert.deepEqual(broken,[],'Referências locais quebradas:\n'+broken.join('\n'));
});

test('âncoras locais em links para páginas estáticas realmente existem',()=>{
  const cache=new Map(publicHtml.map(file=>[file,anchors(read(file))]));
  const broken=[];
  for(const file of publicHtml){
    const html=read(file);
    for(const match of html.matchAll(/\bhref=["']([^"']*#[^"']+)["']/gi)){
      const raw=match[1];
      if(/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(raw))continue;
      const [beforeHash,fragmentRaw]=raw.split('#');
      const fragment=decodeURIComponent(fragmentRaw||'');
      if(!fragment)continue;
      let targetFile=file;
      if(beforeHash){
        const resolved=localTarget(beforeHash,file);
        if(!resolved||!resolved.endsWith('.html')||!exists(resolved))continue;
        targetFile=resolved;
      }
      const ids=cache.get(targetFile)??anchors(read(targetFile));
      if(!ids.has(fragment))broken.push(`${file} -> ${raw} (âncora ausente em ${targetFile})`);
    }
  }
  assert.deepEqual(broken,[],'Âncoras quebradas:\n'+broken.join('\n'));
});

test('CSS público não referencia assets locais inexistentes',()=>{
  const assetsDir=path.join(root,'assets');
  const cssFiles=fs.readdirSync(assetsDir).filter(name=>name.endsWith('.css')).sort();
  const broken=[];
  for(const name of cssFiles){
    const source=`assets/${name}`;
    const css=read(source);
    for(const match of css.matchAll(/url\(([^)]+)\)/gi)){
      const raw=match[1].trim().replace(/^["']|["']$/g,'');
      if(!raw||raw.startsWith('data:')||raw.startsWith('#')||/^https?:/i.test(raw))continue;
      const target=localTarget(raw,source);
      if(target&&!exists(target))broken.push(`${source} -> ${raw} (esperado ${target})`);
    }
  }
  assert.deepEqual(broken,[],'Assets CSS quebrados:\n'+broken.join('\n'));
});
