# BTP Connect — Latest (Electron + Backend)

Ce projet regroupe :
- **Electron** (lance l'UI en local)
- **Frontend** : `src/index.html` (UI BTP Connect)
- **Backend** : `backend/` (Fastify + Prisma + SQLite + Admin UI)

## Prérequis
- Node.js + npm (Windows)
- (Optionnel) Git

## Installation (1ère fois)
### 1) Installer les dépendances Electron
```powershell
cd btp-connect-electron-v9
npm install
```

### 2) Installer + préparer le backend (SQLite)
```powershell
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run build
cd ..
```

> Le backend est **auto-démarré** par Electron **si** `backend/dist/server.js` existe.

## A2 — Modes d'exécution (Local / LAN / Cloud)

La configuration **non secrète** est stockée dans le dossier utilisateur de l'app (Electron `userData`) dans un fichier :

- `app.config.json`

Exemple :

```json
{
  "mode": "local",
  "apiUrl": "http://127.0.0.1:3000",
  "backendPort": 3000,
  "lanExpose": false
}
```

## A3 — Réseau & sécurité (Local vs LAN)

Le backend Fastify **n'est exposé sur le réseau** que si :

- `mode = "lan"` **ET** `lanExpose = true`

Dans ce cas, Electron démarre le backend avec `HOST=0.0.0.0`.

En mode `local` (par défaut), le backend est bind sur `127.0.0.1`.

### CORS (par défaut)
- Si `HOST=127.0.0.1` : seules les origines `localhost/127.0.0.1` sont acceptées (hors requêtes sans Origin).
- Si `HOST!=127.0.0.1` (LAN) : CORS est permissif **sauf** si `CORS_ORIGIN` est fourni (allow-list stricte).

Règle **validée** : le changement de mode est possible depuis l'UI (Admin) mais il est **appliqué uniquement après redémarrage contrôlé**.

## Lancer
### Option A — Electron (auto-start backend si build OK)
```powershell
npm run dev
```

### Option B — Backend en dev + Electron
Dans un terminal :
```powershell
cd backend
npm run dev
```

Dans un autre terminal :
```powershell
cd ..
npm run dev
```

## Build Windows (win-unpacked sans NSIS)
```powershell
npm run pack
```

Le binaire se trouve dans `dist/win-unpacked/`.

## Variables utiles

Les variables d'environnement restent utilisables pour le backend, mais le **mode** et l'URL API côté UI sont pilotés par `app.config.json`.

## Documentation (audit / release / cloud)
- Audit final : `docs/AUDIT_FINAL.md`
- Release : `docs/RELEASE.md`
- Signature : `docs/SIGNING.md`
- Déploiement Cloud : `docs/DEPLOY_CLOUD.md`
