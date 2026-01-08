# Release v0.2.0-rc.1 – BTP Connect

## Nouveautés
- Desktop standalone multi-modes (local / LAN / cloud) : double-clic, backend embarqué, bascule via configuration + redémarrage.
- Console Admin BDD intégrée (CAT1_ADMIN/DB_ADMIN) : lecture, CRUD contrôlé, import/export (dry-run), backup/restore (rollback), audit trail UI.
- PWA iOS installable : interface mobile intégrée, sélecteur LAN/Cloud, offline contrôlé (assets uniquement), bandeau réseau + URL API.

## Correctifs
- Renforcement réseau (bind 127.0.0.1 par défaut, exposition LAN explicite).
- Ajustements UX : accessibilité clavier, gestion overflow, modales ESC.

## Sécurité
- RBAC strict, invisibilité totale des sections Admin pour non-admin.
- Aucun cache de données API côté PWA (network-only pour /api).

## Notes de déploiement
- Desktop : build via `npm run dist:win` ou `npm run dist:mac`.
- PWA : HTTPS requis (LAN via reverse proxy/cert, cloud via TLS standard).

## Checksums
- Générer après build : `npm run release:checksums:win` (Windows) ou `npm run release:checksums:mac` (macOS).
