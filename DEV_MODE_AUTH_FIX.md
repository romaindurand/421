# Correction de l'authentification en mode développement

## Problème résolu
Les APIs protégées vérifiaient toujours le cookie d'authentification, même en mode développement quand la configuration `requirePasswordInDev` était définie sur `false`.

## APIs corrigées
Les routes suivantes ont été mises à jour pour respecter la configuration de développement :

### 1. `/api/groups/[id]/games/+server.ts`
- **Action** : Création de nouvelles parties dans un groupe
- **Correction** : Vérification du cookie seulement si `isPasswordRequired()` retourne `true`

### 2. `/api/games/[id]/+server.ts`
- **Actions** : 
  - GET : Récupération des détails d'une partie
  - DELETE : Suppression d'une partie
- **Correction** : Vérification du cookie seulement si `isPasswordRequired()` retourne `true`

### 3. `/api/games/[id]/players/[playerName]/+server.ts`
- **Action** : Modification du statut des joueurs (perdu/accroché)
- **Correction** : Vérification du cookie seulement si `isPasswordRequired()` retourne `true`

## Logique appliquée
```typescript
// Vérifier l'authentification pour le groupe (seulement si requis selon la config)
if (isPasswordRequired()) {
    const sessionCookie = cookies.get(`group_access_${groupId}`);
    
    if (!sessionCookie || sessionCookie !== 'authenticated') {
        return json(
            { success: false, error: 'Accès non autorisé' },
            { status: 401 }
        );
    }
}
```

## Configuration
Le comportement est contrôlé par la fonction `isPasswordRequired()` dans `/src/lib/config.ts` :
- **Production** : Toujours `true` - mot de passe requis
- **Développement** : Basé sur `requirePasswordInDev` (par défaut `false`)

## Impact
En mode développement avec `requirePasswordInDev = false`, il est maintenant possible de :
- ✅ Créer des parties sans authentification
- ✅ Modifier le statut des joueurs sans authentification  
- ✅ Supprimer des parties sans authentification
- ✅ Consulter les détails des parties sans authentification

La sécurité reste intacte en production où l'authentification est toujours requise.
