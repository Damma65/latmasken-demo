# Latmasken Demo (statisk PWA)

Detta är en enkel demo av Latmasken som kan köras lokalt eller deployas till Vercel.

## Filer

- index.html – hela appen
- manifest.webmanifest – PWA-manifest
- sw.js – service worker (cache-first)
- icons/icon-192.png, icons/icon-512.png – app-ikoner

## Lokalt test

```bash
cd latmasken_demo
python3 -m http.server 5173
# öppna http://localhost:5173
```

## Deploy på Vercel

1. Ladda upp denna mapp som ett GitHub-repo.
2. Gå till vercel.com → New Project → Importera repo → Deploy.
3. Klart. Testa PWA-installation via Chrome/Android eller Safari (Lägg till på hemskärmen).
