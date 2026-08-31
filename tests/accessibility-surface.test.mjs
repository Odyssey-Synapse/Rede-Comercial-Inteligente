import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const pages=fs.readdirSync(root).filter(name=>name.endsWith('.html')).sort();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const staticMarkup=html=>html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');

function attrs(tag){
  const out={};
  for(const m of tag.matchAll(/\b([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))out[m[1].toLowerCase()]=m[2]??m[3]??m[4]??'';
  return out;
}
function isRedirectPage(html){
  return /<meta\b[^>]*http-equiv=["']refresh["']/i.test(html)||/\blocation\.replace\s*\(/i.test(html);
}
function nestedLabelledIds(html){
  const ids=new Set();
  for(const label of html.match(/<label\b[^>]*>[\s\S]*?<\/label>/gi)||[]){
    for(const tag of label.match(/<(?:input|select|textarea)\b[^>]*>/gi)||[]){
      const id=attrs(tag).id;if(id)ids.add(id);
    }
  }
  return ids;
}

test('páginas públicas possuem idioma, viewport, título e heading principal',()=>{
  const bad=[];
  for(const file of pages){
    const html=read(file);
    if(!/<html[^>]+lang=["']pt-BR["']/i.test(html))bad.push(`${file}: lang pt-BR ausente`);
    if(!/<meta[^>]+name=["']viewport["']/i.test(html))bad.push(`${file}: viewport ausente`);
    if(!/<title>[^<]+<\/title>/i.test(html))bad.push(`${file}: title vazio/ausente`);
    if(!isRedirectPage(html)&&!/<h1\b/i.test(staticMarkup(html)))bad.push(`${file}: h1 ausente`);
  }
  assert.deepEqual(bad,[],bad.join('\n'));
});

test('IDs estáticos não se repetem dentro da mesma página',()=>{
  const bad=[];
  for(const file of pages){
    const ids=[];
    for(const m of staticMarkup(read(file)).matchAll(/\bid=["']([^"']+)["']/gi))ids.push(m[1]);
    const seen=new Set(),dup=new Set();
    for(const id of ids){if(seen.has(id))dup.add(id);seen.add(id)}
    if(dup.size)bad.push(`${file}: ${[...dup].join(', ')}`);
  }
  assert.deepEqual(bad,[],bad.join('\n'));
});

test('imagens estáticas sempre declaram alt, inclusive decorativas',()=>{
  const bad=[];
  for(const file of pages){
    for(const tag of staticMarkup(read(file)).match(/<img\b[^>]*>/gi)||[]){
      if(!Object.hasOwn(attrs(tag),'alt'))bad.push(`${file}: ${tag.slice(0,120)}`);
    }
  }
  assert.deepEqual(bad,[],bad.join('\n'));
});

test('links target blank usam rel noopener ou noreferrer',()=>{
  const bad=[];
  for(const file of pages){
    for(const tag of staticMarkup(read(file)).match(/<a\b[^>]*>/gi)||[]){
      const a=attrs(tag);
      if(String(a.target).toLowerCase()==='_blank'&&!/\b(?:noopener|noreferrer)\b/i.test(a.rel||''))bad.push(`${file}: ${tag.slice(0,160)}`);
    }
  }
  assert.deepEqual(bad,[],bad.join('\n'));
});

test('campos estáticos com id têm label correspondente ou nome acessível explícito',()=>{
  const bad=[];
  for(const file of pages){
    const html=staticMarkup(read(file));
    const labelled=new Set([...html.matchAll(/<label\b[^>]*\bfor=["']([^"']+)["']/gi)].map(m=>m[1]));
    const nested=nestedLabelledIds(html);
    for(const tag of html.match(/<(?:input|select|textarea)\b[^>]*>/gi)||[]){
      const a=attrs(tag),id=a.id;
      if(!id)continue;
      const type=String(a.type||'').toLowerCase();
      if(type==='hidden')continue;
      const explicit=Object.hasOwn(a,'aria-label')||Object.hasOwn(a,'aria-labelledby');
      if(!labelled.has(id)&&!nested.has(id)&&!explicit)bad.push(`${file}: ${id}`);
    }
  }
  assert.deepEqual(bad,[],bad.join('\n'));
});

test('controle dinâmico de contexto do Consumer recebe nome acessível',()=>{
  const html=read('testar.html');
  assert.match(html,/Complete o contexto[\s\S]*?<textarea id="more"[^>]*(?:aria-label="[^"]+"|aria-labelledby="[^"]+")/);
});

test('feedback crítico dos fluxos transacionais usa região viva',()=>{
  const founder=read('fundador.html'),contact=read('contato.html'),participation=read('participar.html');
  for(const id of ['company-feedback','accept-feedback','payment-feedback','onboarding-feedback'])assert.match(founder,new RegExp(`id=["']${id}["'][^>]*role=["']status["'][^>]*aria-live=["']polite["']`),id);
  assert.match(contact,/id="contact-feedback" role="status" aria-live="polite"/);
  assert.match(participation,/id="consumer-feedback" role="status" aria-live="polite"/);
  assert.match(participation,/id="company-feedback" role="status" aria-live="polite"/);
});
