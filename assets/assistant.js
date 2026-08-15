const form=document.querySelector('#assistant-form');
const input=document.querySelector('#assistant-input');
const sendButton=document.querySelector('#send-button');
const messagesElement=document.querySelector('#messages');
const typing=document.querySelector('#typing');
const resetButton=document.querySelector('#reset-chat');

const welcome='Olá! Me conta o que você precisa resolver. Pode falar naturalmente — se faltar algum detalhe, eu pergunto.';
const unavailable='O Uai Perto está temporariamente indisponível. Tente novamente em alguns instantes.';
let sessionReady=false;
let waiting=false;

function addMessage(role,content){
  const article=document.createElement('article');
  article.className=`message ${role==='user'?'user-message':'assistant-message'}`;
  const avatar=document.createElement('div');
  avatar.className='message-avatar';
  avatar.setAttribute('aria-hidden','true');
  avatar.textContent=role==='user'?'V':'U';
  const body=document.createElement('div');
  const label=document.createElement('span');
  label.textContent=role==='user'?'Você':'Uai Perto';
  const paragraph=document.createElement('p');
  paragraph.textContent=content;
  body.append(label,paragraph);
  article.append(avatar,body);
  messagesElement.append(article);
  messagesElement.scrollTop=messagesElement.scrollHeight;
}

function setWaiting(value){
  waiting=value;
  typing.hidden=!value;
  sendButton.disabled=value;
  input.disabled=value;
  if(value)messagesElement.scrollTop=messagesElement.scrollHeight;
}

function resizeInput(){
  input.style.height='auto';
  input.style.height=`${Math.min(input.scrollHeight,150)}px`;
}

async function ensureSession(){
  if(sessionReady)return;
  const response=await fetch('/api/assistant/session',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:'{}'
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok||data.ok!==true)throw new Error('session_unavailable');
  sessionReady=true;
}

async function requestAnswer(message,retry=true){
  await ensureSession();
  const response=await fetch('/api/assistant/message',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({message})
  });
  if(response.status===401&&retry){
    sessionReady=false;
    return requestAnswer(message,false);
  }
  const data=await response.json().catch(()=>({}));
  const publicMessage=typeof data.message==='string'&&data.message.trim()?data.message.trim():unavailable;
  return{ok:response.ok,message:publicMessage};
}

async function send(message){
  if(waiting)return;
  const clean=message.trim();
  if(clean.length<2)return;
  addMessage('user',clean);
  input.value='';
  resizeInput();
  setWaiting(true);

  try{
    const answer=await requestAnswer(clean);
    addMessage('assistant',answer.message);
  }catch{
    addMessage('assistant',unavailable);
  }finally{
    setWaiting(false);
    input.focus();
  }
}

form.addEventListener('submit',event=>{
  event.preventDefault();
  send(input.value);
});

input.addEventListener('input',resizeInput);
input.addEventListener('keydown',event=>{
  if(event.key==='Enter'&&!event.shiftKey){
    event.preventDefault();
    form.requestSubmit();
  }
});

document.querySelectorAll('[data-example]').forEach(button=>button.addEventListener('click',()=>{
  input.value=button.dataset.example||'';
  resizeInput();
  input.focus();
  input.setSelectionRange(input.value.length,input.value.length);
}));

resetButton.addEventListener('click',()=>{
  sessionReady=false;
  messagesElement.innerHTML='';
  addMessage('assistant',welcome);
  input.value='';
  resizeInput();
  input.focus();
});
