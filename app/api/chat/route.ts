export async function POST(req: Request){
  try{
    const { messages, contexto } = await req.json();
    if(!process.env.GROQ_API_KEY) return Response.json({ error: 'Falta GROQ_API_KEY en Vercel' }, { status: 500 });
    const lastUser = [...messages].reverse().find((m:any)=>m.role==='user')?.content || '';
    // Si es retoque de foto
    if(lastUser.includes('[FOTO]')){
      const instruccion = lastUser.replace('[FOTO]','').trim();
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST', headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'openai/gpt-oss-20b', temperature: 0.3, max_tokens: 1200,
          messages: [{ role: 'system', content: 'Eres Alex-Zarzalito, asistente personal de fotografía profesional de Juan. El usuario subió una foto y pide: '+instruccion+'. Responde en 3 partes cortas: 1) Qué vas a hacer a la foto, 2) Prompt listo para IA de retoque, 3) Pasos en Photoshop / Lightroom. Sé claro, paso a paso, en español.' }, { role: 'user', content: instruccion }] })
      });
      const d = await res.json();
      if(!res.ok){
        if(d?.error?.code === 'rate_limit_exceeded') return Response.json({ message: '⏳ Alex está descansando 30 segundos por límite de Groq. Espera un poquito y pregúntame de nuevo.' });
        return Response.json({ error: d?.error?.message || 'Error en Groq' }, { status: 500 });
      }
      return Response.json({ message: d.choices?.[0]?.message?.content || 'Sin respuesta' });
    }
    const system = `Eres Alex-Zarzalito, el asistente personal de Juan. Tu nombre es Alex-Zarzalito.
MEMORIA: ${contexto || 'Sin temas guardados aún.'}
Eres experto en TODO. Profesor de inglés, francés, portugués e italiano. Ayuda con agenda, tareas, checklists. Experto en fotografía profesional: equipo, técnicas, retratos, poses de modelos y familias, retoque, color, blanco y negro, sepia. Da consejos prácticos y cortos. Si no sabes algo, dilo, nunca inventes. Responde claro y corto para voz.`;
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'openai/gpt-oss-20b', temperature: 0.4, max_tokens: 1500,
        messages: [{ role: 'system', content: system }, ...messages.slice(-4).map((m:any)=>({ role: m.role, content: m.content }))] })
    });
    const data = await res.json();
    if(!res.ok){
      if(data?.error?.code === 'rate_limit_exceeded') return Response.json({ message: '⏳ Alex está descansando 30 segundos por límite de Groq. Espera un poquito y pregúntame de nuevo, ya casi estoy listo.' });
      return Response.json({ error: data?.error?.message || 'Error en Groq' }, { status: 500 });
    }
    return Response.json({ message: data.choices?.[0]?.message?.content || 'Sin respuesta' });
  }catch(e:any){ return Response.json({ error: e.message || 'Error' }, { status: 500 }); }
}
