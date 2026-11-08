'use client';
import {useState,useRef,useEffect} from 'react';
const PRIMARY='#1a1a2e'; const ACCENT='#e94560';
type Msg={role:string,content:string};
type Task={id:number,text:string,date:string,done:boolean};
type Check={id:number,title:string,items:{text:string,done:boolean}[]};
const HABILIDADES=[
  {label:'🇺🇸 Enséñame inglés básico', prompt:'Enséñame inglés básico'},
  {label:'🇮🇹 Enséñame italiano', prompt:'Enséñame italiano'},
  {label:'👨‍👩‍👧 Dame poses para familia', prompt:'Dame poses para familia'},
  {label:'📷 ¿Qué lente uso para retrato?', prompt:'¿Qué lente uso para retrato?'},
  {label:'✅ Hazme un checklist para sesión de fotos', prompt:'Hazme un checklist para sesión de fotos'},
  {label:'🇫🇷 Enséñame francés', prompt:'Enséñame francés básico'},
  {label:'🇵🇹 Enséñame portugués', prompt:'Enséñame portugués básico'},
  {label:'📸 Dame poses para retrato profesional', prompt:'Dame poses para retrato profesional'},
  {label:'🎨 ¿Cómo hago foto blanco y negro?', prompt:'¿Cómo hago foto blanco y negro perfecta?'},
  {label:'🟤 ¿Cómo hago efecto sepia?', prompt:'¿Cómo hago efecto sepia?'},
];

export default function Page(){
  const [tab,setTab]=useState<'chat'|'agenda'|'checklist'|'foto'>('chat');
  const [msgs,setMsgs]=useState<Msg[]>(()=>{ if(typeof window==='undefined') return [{role:'assistant',content:'¡Hola Juan! Soy Alex-Zarzalito, tu asistente personal. ¿Qué hacemos hoy?'}]; try{ const s=localStorage.getItem('alex-chat'); return s?JSON.parse(s):[{role:'assistant',content:'¡Hola Juan! Soy Alex-Zarzalito, tu asistente personal. ¿Qué hacemos hoy? Puedo ayudarte con todo, enseñarte inglés, francés, portugués o italiano, organizar tu agenda, y ayudarte con fotografía profesional.'}]; }catch{ return [{role:'assistant',content:'¡Hola Juan! Soy Alex-Zarzalito'}]; } });
  const [input,setInput]=useState(''); const [loading,setLoading]=useState(false);
  const [listening,setListening]=useState(false); const [speaking,setSpeaking]=useState(false);
  const [showHabilidades,setShowHabilidades]=useState(false);
  const [tasks,setTasks]=useState<Task[]>(()=>{ try{ return JSON.parse(localStorage.getItem('alex-tasks')||'[]'); }catch{ return []; } });
  const [checks,setChecks]=useState<Check[]>(()=>{ try{ return JSON.parse(localStorage.getItem('alex-checks')||'[]'); }catch{ return []; } });
  const [newTask,setNewTask]=useState(''); const [newTaskDate,setNewTaskDate]=useState('');
  const [newCheckTitle,setNewCheckTitle]=useState(''); const [newCheckItem,setNewCheckItem]=useState('');
  const [foto,setFoto]=useState<string|null>(null); const [fotoInstr,setFotoInstr]=useState('');
  const endRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{ localStorage.setItem('alex-chat', JSON.stringify(msgs)); endRef.current?.scrollIntoView({behavior:'smooth'}); },[msgs]);
  useEffect(()=>{ localStorage.setItem('alex-tasks', JSON.stringify(tasks)); },[tasks]);
  useEffect(()=>{ localStorage.setItem('alex-checks', JSON.stringify(checks)); },[checks]);

  async function send(text?:string, isFoto=false){
    const content = text || input; if(!content.trim() && !isFoto) return;
    let finalContent = content;
    if(isFoto) finalContent = '[FOTO] ' + fotoInstr;
    const newMsgs=[...msgs,{role:'user',content: isFoto? `📸 Foto: ${fotoInstr}` : content}]; setMsgs(newMsgs); setInput(''); setFotoInstr(''); setLoading(true); setShowHabilidades(false);
    try{ const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:newMsgs, contexto: ''})}); const d=await res.json(); if(d.error) throw new Error(d.error); setMsgs([...newMsgs,{role:'assistant',content:d.message}]); }catch(e:any){ setMsgs([...newMsgs,{role:'assistant',content:'Error: '+e.message}]); } setLoading(false);
  }
  function copyAll(){ const txt=msgs.map(m=>(m.role==='user'?'Tú: ':'Alex-Zarzalito: ')+m.content).join('\n\n'); navigator.clipboard.writeText(txt); alert('¡Copiado!'); }
  function printChat(){ const w=window.open('','_blank'); if(!w) return; let h='<html><head><title>Alex-Zarzalito</title><style>body{font-family:sans-serif;padding:20px} .h{text-align:center;border-bottom:3px solid #1a1a2e;padding-bottom:12px} .m{margin:12px 0;padding:10px;border-radius:12px} .u{background:#1a1a2e;color:white;text-align:right} .a{background:#f5f5f0;border:1px solid #ddd}</style></head><body>'; h+='<div class="h"><h1>Alex-Zarzalito</h1><div>Asistente Personal de Juan • '+new Date().toLocaleString()+'</div></div>'; msgs.forEach(m=>{ h+='<div class="m '+(m.role==='user'?'u':'a')+'"><b>'+(m.role==='user'?'Juan':'Alex-Zarzalito')+':</b><br/>'+m.content.replace(/\n/g,'<br/>')+'</div>'; }); h+='</body></html>'; w.document.write(h); w.document.close(); w.print(); }
  function startVoice(){
    const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
    if(!SR){ alert('Tu navegador no tiene voz. Usa Chrome.'); return; }
    const rec=new SR(); rec.lang='es-ES'; rec.interimResults=false; setListening(true);
    rec.onresult=(e:any)=>{ const txt=e.results[0][0].transcript; setInput(txt); setListening(false); send(txt); };
    rec.onerror=()=>setListening(false); rec.onend=()=>setListening(false); rec.start();
  }
  function speakLast(){ const last=[...msgs].reverse().find(m=>m.role==='assistant'); if(!last) return; const u=new SpeechSynthesisUtterance(last.content); u.lang='es-ES'; setSpeaking(true); u.onend=()=>setSpeaking(false); speechSynthesis.speak(u); }
  function stopSpeak(){ speechSynthesis.cancel(); setSpeaking(false); }
  function addTask(){ if(!newTask.trim()) return; setTasks([...tasks,{id:Date.now(),text:newTask,date:newTaskDate||'Sin fecha',done:false}]); setNewTask(''); setNewTaskDate(''); }
  function addCheck(){ if(!newCheckTitle.trim()) return; setChecks([...checks,{id:Date.now(),title:newCheckTitle,items:[]}]); setNewCheckTitle(''); }
  function addItemToCheck(id:number){ if(!newCheckItem.trim()) return; setChecks(checks.map(c=>c.id===id?{...c,items:[...c.items,{text:newCheckItem,done:false}]}:c)); setNewCheckItem(''); }

  return (
    <div style={{minHeight:'100vh', background:'#f6f5f0', display:'flex', justifyContent:'center', padding:14}}>
      <div style={{width:'100%', maxWidth:820, display:'flex', flexDirection:'column', gap:12, position:'relative'}}>
        <div style={{background:PRIMARY, color:'white', borderRadius:20, padding:'18px 20px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap'}}>
          <div style={{width:52, height:52, borderRadius:16, background:ACCENT, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26}}>🤖</div>
          <div style={{flex:1, minWidth:160}}>
            <div style={{fontSize:22, fontWeight:800}}>Alex-Zarzalito</div>
            <div style={{fontSize:12, opacity:0.8}}>Tu asistente personal • Voz • Idiomas • Foto • Agenda</div>
          </div>
          <button onClick={copyAll} style={{padding:'10px 14px', borderRadius:12, border:'none', cursor:'pointer', background:'white', fontWeight:700}}>📋 Copiar</button>
          <button onClick={printChat} style={{padding:'10px 14px', borderRadius:12, border:'none', cursor:'pointer', background:ACCENT, color:'white', fontWeight:700}}>🖨️ Imprimir</button>
          <button onClick={()=>setTab('checklist')} style={{padding:'10px 14px', borderRadius:12, border:'none', cursor:'pointer', background:'#0f3460', color:'white', fontWeight:700}}>✅ Checklists</button>
          <div style={{position:'relative'}}>
            <button onClick={()=>setShowHabilidades(!showHabilidades)} style={{padding:'10px 14px', borderRadius:12, border:'none', cursor:'pointer', background:'#f5c518', color:'#1a1a2e', fontWeight:800}}>✨ Habilidades {showHabilidades?'▲':'▼'}</button>
            {showHabilidades && (
              <div style={{position:'absolute', right:0, top:44, width:300, background:'white', color:'#222', borderRadius:14, boxShadow:'0 10px 30px rgba(0,0,0,0.2)', zIndex:50, overflow:'hidden', border:'1px solid #eee'}}>
                <div style={{padding:'12px 14px', fontWeight:800, fontSize:13, background:'#f6f5f0', borderBottom:'1px solid #eee'}}>✨ Habilidades de Alex</div>
                {HABILIDADES.map(h=>(
                  <button key={h.label} onClick={()=>{ setTab('chat'); send(h.prompt); }} style={{display:'block', width:'100%', textAlign:'left', padding:'12px 14px', border:'none', borderBottom:'1px solid #f0f0f0', background:'white', cursor:'pointer', fontSize:13}}>{h.label}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
          {(['chat','agenda','checklist','foto'] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:'10px 16px', borderRadius:20, border:'none', cursor:'pointer', background:tab===t?PRIMARY:'#fff', color:tab===t?'white':'#333', fontWeight:700, border: tab===t?'none':'1px solid #ddd'}}>{t==='chat'?'💬 Chat':t==='agenda'?'📅 Agenda':t==='checklist'?'✅ Checklists':'📸 Foto / Retoque'}</button>
          ))}
        </div>

        {tab==='chat' && (
          <div style={{background:'white', borderRadius:20, border:'1px solid #e8e5de', display:'flex', flexDirection:'column', overflow:'hidden', height:560}}>
            <div style={{flex:1, overflowY:'auto', padding:18, display:'flex', flexDirection:'column', gap:12, background:'#fdfcf8'}}>
              {msgs.map((m,i)=>(
                <div key={i} style={{display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                  <div style={{maxWidth:'82%', padding:'12px 16px', borderRadius:m.role==='user'?'18px 18px 4px 18px':'4px 18px 18px 18px', background:m.role==='user'?PRIMARY:'white', color:m.role==='user'?'white':'#222', border:m.role==='user'?'none':'1px solid #e8e5de', fontSize:14, whiteSpace:'pre-wrap'}}>{m.content}</div>
                </div>
              ))}
              {loading && <div style={{padding:'12px 16px', background:'white', border:'1px solid #e8e5de', borderRadius:'4px 18px 18px 18px'}}>Alex está pensando...</div>}
              <div ref={endRef}></div>
            </div>
            <div style={{padding:12, borderTop:'1px solid #e8e5de', background:'white', display:'flex', gap:8, alignItems:'center'}}>
              <button onClick={startVoice} title="Hablar" style={{width:44, height:44, borderRadius:22, background:listening?'#e94560':'#f0f0f0', border:'none', cursor:'pointer', fontSize:20}}>{listening?'🔴':'🎤'}</button>
              <button onClick={speaking?stopSpeak:speakLast} title="Que Alex hable" style={{width:44, height:44, borderRadius:22, background:'#e8e5de', border:'none', cursor:'pointer'}}>{speaking?'⏹️':'🔊'}</button>
              <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder={listening?'Te estoy escuchando...':'Escríbele a Alex o háblale con 🎤'} style={{flex:1, padding:'12px 16px', borderRadius:24, border:'1px solid #e8e5de', background:'#f6f5f0'}} />
              <button onClick={()=>send()} style={{width:44, height:44, borderRadius:12, background:PRIMARY, color:'white', border:'none', cursor:'pointer'}}>↑</button>
            </div>
          </div>
        )}

        {tab==='agenda' && (
          <div style={{background:'white', borderRadius:20, padding:20, border:'1px solid #e8e5de'}}>
            <h3 style={{margin:'0 0 12px'}}>📅 Agenda / Tareas</h3>
            <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
              <input value={newTask} onChange={e=>setNewTask(e.target.value)} placeholder="Ej: Sesión de fotos familia López" style={{flex:1, padding:'12px', borderRadius:12, border:'1px solid #ddd'}} />
              <input type="date" value={newTaskDate} onChange={e=>setNewTaskDate(e.target.value)} style={{padding:'12px', borderRadius:12, border:'1px solid #ddd'}} />
              <button onClick={addTask} style={{padding:'12px 18px', borderRadius:12, background:PRIMARY, color:'white', border:'none', cursor:'pointer'}}>＋ Agregar</button>
            </div>
            <div style={{marginTop:14, display:'flex', flexDirection:'column', gap:8}}>
              {tasks.length===0 && <div style={{color:'#888'}}>No tienes tareas aún.</div>}
              {tasks.map(t=>(
                <div key={t.id} style={{display:'flex', gap:10, alignItems:'center', padding:'12px', borderRadius:12, background:t.done?'#e8f5e9':'#f6f5f0', border:'1px solid #eee'}}>
                  <input type="checkbox" checked={t.done} onChange={()=>setTasks(tasks.map(x=>x.id===t.id?{...x,done:!x.done}:x))} style={{width:20,height:20}} />
                  <div style={{flex:1, textDecoration:t.done?'line-through':'none'}}>{t.text}</div>
                  <div style={{fontSize:12, color:'#888'}}>{t.date}</div>
                  <button onClick={()=>setTasks(tasks.filter(x=>x.id!==t.id))} style={{border:'none', background:'none', cursor:'pointer'}}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='checklist' && (
          <div style={{background:'white', borderRadius:20, padding:20, border:'1px solid #e8e5de'}}>
            <h3 style={{margin:'0 0 6px'}}>✅ Checklists</h3>
            <div style={{display:'flex', gap:8}}>
              <input value={newCheckTitle} onChange={e=>setNewCheckTitle(e.target.value)} placeholder="Título: Ej: Sesión Retrato" style={{flex:1, padding:'12px', borderRadius:12, border:'1px solid #ddd'}} />
              <button onClick={addCheck} style={{padding:'12px 18px', borderRadius:12, background:ACCENT, color:'white', border:'none', cursor:'pointer'}}>＋ Nuevo Checklist</button>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:14, marginTop:14}}>
              {checks.length===0 && <div style={{color:'#888'}}>No hay checklists aún.</div>}
              {checks.map(c=>(
                <div key={c.id} style={{border:'1px solid #eee', borderRadius:14, padding:14, background:'#fdfcf8'}}>
                  <div style={{fontWeight:800, display:'flex', justifyContent:'space-between'}}><span>{c.title}</span><button onClick={()=>setChecks(checks.filter(x=>x.id!==c.id))} style={{border:'none', background:'none', cursor:'pointer'}}>🗑️</button></div>
                  {c.items.map((it,idx)=>(
                    <div key={idx} style={{display:'flex', gap:8, alignItems:'center', padding:'8px 0'}}>
                      <input type="checkbox" checked={it.done} onChange={()=>setChecks(checks.map(x=>x.id===c.id?{...x,items:x.items.map((y,j)=>j===idx?{...y,done:!y.done}:y)}:x))} style={{width:18,height:18}} />
                      <span style={{textDecoration:it.done?'line-through':'none'}}>{it.text}</span>
                    </div>
                  ))}
                  <div style={{display:'flex', gap:8, marginTop:8}}>
                    <input value={newCheckItem} onChange={e=>setNewCheckItem(e.target.value)} placeholder="Agregar ítem" style={{flex:1, padding:'10px', borderRadius:10, border:'1px solid #ddd'}} onKeyDown={e=>e.key==='Enter'&&addItemToCheck(c.id)} />
                    <button onClick={()=>addItemToCheck(c.id)} style={{padding:'10px 14px', borderRadius:10, background:PRIMARY, color:'white', border:'none', cursor:'pointer'}}>＋</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='foto' && (
          <div style={{background:'white', borderRadius:20, padding:20, border:'1px solid #e8e5de'}}>
            <h3 style={{margin:'0 0 6px'}}>📸 Fotografía Profesional + Retoque con IA</h3>
            <input type="file" accept="image/*" onChange={e=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=>setFoto(r.result as string); r.readAsDataURL(f); }} style={{margin:'10px 0'}} />
            {foto && <img src={foto} style={{width:'100%', maxHeight:360, objectFit:'cover', borderRadius:14}} />}
            <div style={{display:'flex', gap:8, marginTop:12}}>
              <input value={fotoInstr} onChange={e=>setFotoInstr(e.target.value)} placeholder='Ej: Quítale a la persona de atrás' style={{flex:1, padding:'12px', borderRadius:12, border:'1px solid #ddd'}} />
              <button onClick={()=>send('', true)} style={{padding:'12px 18px', borderRadius:12, background:ACCENT, color:'white', border:'none', cursor:'pointer'}}>✨ Retocar con Alex</button>
            </div>
          </div>
        )}
        <div style={{fontSize:11, color:'#888', textAlign:'center'}}>Alex-Zarzalito • Asistente personal de Juan</div>
      </div>
    </div>
  );
}
