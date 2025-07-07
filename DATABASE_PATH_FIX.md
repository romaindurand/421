# Correction du chemin de base de données en production

## Problème identifié

En production, l'application SvelteKit créait le fichier de base de données dans `build/data/db.json` mais n'arrivait pas à le lire car la logique de chemin était basée sur `__dirname` qui change entre le développement et la production.

### Contexte technique
- **Développement** : `__dirname` = `/home/romain/421/src/lib`
- **Production** : `__dirname` = `/home/romain/421/build/server/chunks`

Le chemin relatif `../../data/db.json` depuis `__dirname` donnait donc :
- **Dev** : `/home/romain/421/data/db.json` ✅
- **Prod** : `/home/romain/421/build/data/db.json` ❌

## Solution implémentée

### 1. Détection automatique de l'environnement

```typescript
function getDatabasePath(): string {
    // En production, utiliser un chemin relatif au répertoire de travail
    const productionPath = join(process.cwd(), 'data/db.json');
    
    // En développement, utiliser le chemin relatif au fichier source
    const developmentPath = join(__dirname, '../../data/db.json');
    
    // Détection basée sur __dirname ou NODE_ENV
    if (__dirname.includes('build') || process.env.NODE_ENV === 'production') {
        return productionPath;
    } else {
        return developmentPath;
    }
}
```

### 2. Chemins finaux
- **Développement** : `/home/romain/421/data/db.json`
- **Production** : `/home/romain/421/data/db.json`

Maintenant les deux environnements utilisent le même fichier de base de données !

### 3. Logs de debug conditionnels

```typescript
// Debug uniquement en développement
if (process.env.NODE_ENV !== 'production') {
    console.log('🔍 Debug database path:', file);
}
```

## Résultat

✅ **Développement** : Base de données accessible et modifiable
✅ **Production** : Base de données partagée avec le développement
✅ **Pas de logs** en production pour éviter le spam
✅ **Migration automatique** des anciens formats de données

## Test de vérification

```bash
# Construire l'application
pnpm build

# Lancer en production
NODE_ENV=production node build/index.js

# L'application affiche maintenant tous les groupes créés !
```

Cette solution garantit que la base de données est accessible dans tous les environnements avec une détection automatique du bon chemin.
