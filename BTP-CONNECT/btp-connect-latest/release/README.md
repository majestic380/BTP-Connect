# Release Candidate – procédure

Cette RC est conçue pour être reproductible (audit-ready).

## Pré-requis
- Node.js 18+
- Windows: PowerShell + outil de signature optionnel
- macOS: Xcode Command Line Tools (pour codesign/notarization si utilisé)

## Build local
Depuis `btp-connect-latest` :

### 1) Compiler le backend
```bash
npm install
npm run setup:backend
```

### 2) Construire l'app desktop
- Windows:
  ```bash
  npm run dist:win
  ```
- macOS:
  ```bash
  npm run dist:mac
  ```

### 3) Générer les checksums
- Windows:
  ```bash
  npm run release:checksums:win
  ```
- macOS:
  ```bash
  npm run release:checksums:mac
  ```

Les artefacts sont dans `dist/`.

## Release GitHub (CI)
1. Commit les changements.
2. Créer un tag `v0.2.0-rc.1`:
   ```bash
   git tag v0.2.0-rc.1
   git push origin v0.2.0-rc.1
   ```
3. Le workflow `.github/workflows/release.yml` construit (Win+mac), génère les checksums et crée une GitHub Release.
