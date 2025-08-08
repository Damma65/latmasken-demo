// /api/diagnostics.js — testar att env-nycklar finns och att API:er svarar
export const config = { runtime: "nodejs18.x" };

const withTimeout = (p, ms=8000) => Promise.race([p, new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')), ms))]);

export default async function handler(req, res){
  try{
    const out = {
      env: {
        OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
        USDA_API_KEY: !!process.env.USDA_API_KEY
      },
      openai: { ok:false, status:null, error:null },
      usda: { ok:false, status:null, error:null }
    };

    // Test OpenAI (modeller)
    if(process.env.OPENAI_API_KEY){
      try{
        const r = await withTimeout(fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
        }));
        out.openai.status = r.status;
        out.openai.ok = r.ok;
        if(!r.ok){ out.openai.error = `HTTP ${r.status}`; }
      }catch(e){
        out.openai.error = String(e.message||e);
      }
    } else {
      out.openai.error = "OPENAI_API_KEY saknas";
    }

    // Test USDA (apple sök)
    if(process.env.USDA_API_KEY){
      try{
        const r = await withTimeout(fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?query=apple&pageSize=1&api_key=${process.env.USDA_API_KEY}`));
        out.usda.status = r.status;
        out.usda.ok = r.ok;
        if(!r.ok){ out.usda.error = `HTTP ${r.status}`; }
      }catch(e){
        out.usda.error = String(e.message||e);
      }
    } else {
      out.usda.error = "USDA_API_KEY saknas";
    }

    res.status(200).json(out);
  }catch(err){
    res.status(500).json({ error: String(err) });
  }
}
