Latmasken – Diagnostics Update
================================
1) Lägg till fliken "Debug" i navigeringen i din index.html, t ex:
   <button data-tab="debug">Debug</button>

2) Lägg in markup + script för debug-delen före </body> i index.html:
   (Se filen index_debug_snippet.html i detta paket – kopiera in hela blocket)

3) Lägg till serverless-filen:
   api/diagnostics.js

4) Commit till main på GitHub → Vercel deployar → Öppna appen → fliken Debug → Kör test.
