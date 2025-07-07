# Statistiques Avancées de Jeu - 421, Relances et Nenettes

## Fonctionnalité ajoutée

Ajout de statistiques détaillées pour chaque joueur dans une partie :
- **421 réussis** : Nombre de fois où le joueur a fait un 421
- **421 relancés** : Nombre de fois où le joueur a dû relancer un 421
- **Nenettes (2/2/1)** : Nombre de fois où le joueur a fait une nenette

## Implémentation technique

### 1. **Extension de la structure de données** (`/src/lib/database.ts`)

```typescript
export interface PlayerInGame {
    name: string;
    lost: boolean;
    hooked: boolean;
    // Nouvelles statistiques
    four21Count: number;      // 421 réussis
    four21Rerolls: number;    // 421 relancés  
    nenetteCount: number;     // Nenettes (2/2/1)
}
```

### 2. **Fonction de mise à jour** (`/src/lib/database.ts`)

```typescript
export async function updatePlayerGameStats(
    gameId: string, 
    playerName: string, 
    statType: 'four21Count' | 'four21Rerolls' | 'nenetteCount',
    increment: number
): Promise<boolean>
```

**Validation** :
- ✅ Incréments de +1 ou -1 uniquement
- ✅ Prévention des valeurs négatives
- ✅ Mise à jour automatique de `updatedAt`

### 3. **Route API** (`/src/routes/api/games/[id]/players/[playerName]/stats/+server.ts`)

**Endpoint** : `PATCH /api/games/[id]/players/[playerName]/stats`

**Authentification** : Respecte la configuration dev/prod

**Paramètres** :
```json
{
  "statType": "four21Count|four21Rerolls|nenetteCount",
  "increment": 1 | -1
}
```

**Validation** :
- ✅ Types de statistiques valides uniquement
- ✅ Incréments limités à ±1
- ✅ Vérification existence partie/joueur
- ✅ Prévention valeurs négatives

### 4. **Interface utilisateur** (`/src/routes/game/[id]/+page.svelte`)

#### Affichage compact des statistiques
```svelte
<div class="grid grid-cols-3 gap-3 text-xs">
    <div class="bg-green-900/30 text-green-200">421: {count}</div>
    <div class="bg-yellow-900/30 text-yellow-200">Relancés: {rerolls}</div>  
    <div class="bg-purple-900/30 text-purple-200">Nenettes: {nenettes}</div>
</div>
```

#### Contrôles interactifs
- **Boutons +/-** pour chaque statistique
- **Couleurs thématiques** : Vert (421), Jaune (relances), Violet (nenettes)
- **Désactivation intelligente** : Bouton "-" désactivé quand valeur = 0
- **Feedback visuel** immédiat via SSE

### 5. **Migration automatique** (`/src/lib/database.ts`)

```typescript
export async function migrateGameStats(): Promise<number> {
    // Initialise les nouvelles propriétés à 0 pour les parties existantes
    // Migration transparente au démarrage de l'application
}
```

**Processus** :
- ✅ Détection automatique des parties sans statistiques
- ✅ Initialisation à 0 pour tous les joueurs
- ✅ Aucune perte de données existantes
- ✅ Log du nombre de joueurs migrés

### 6. **Design et UX**

#### Codes couleurs
- 🟢 **Vert** : 421 réussis (succès)
- 🟡 **Jaune** : 421 relancés (avertissement)
- 🟣 **Violet** : Nenettes (spécial)

#### Interactions
- **Boutons +/-** ronds avec hover effects
- **Valeurs centrées** en gras pour visibilité
- **Grid responsive** s'adapte à l'espace disponible
- **Mise à jour temps réel** via Server-Sent Events

### 7. **Intégration avec l'existant**

- ✅ **SSE** : Mise à jour automatique de tous les clients connectés
- ✅ **Authentification** : Même logique que les autres actions
- ✅ **Validation** : Double validation client/serveur
- ✅ **Performance** : Mise à jour atomique par statistique

### 8. **Cas d'usage typiques**

1. **Joueur fait un 421** → Clic sur "+" pour 421 réussis
2. **Joueur doit relancer un 421** → Clic sur "+" pour 421 relancés  
3. **Joueur fait une nenette** → Clic sur "+" pour nenettes
4. **Correction d'erreur** → Clic sur "-" pour décrémenter

### 9. **Sécurité et validation**

- ✅ **Authentification** requise selon la config
- ✅ **Validation stricte** des types et valeurs
- ✅ **Prévention manipulation** via validation serveur
- ✅ **Atomicité** : Une seule statistique modifiée par appel

Cette fonctionnalité permet un suivi précis et détaillé des performances de chaque joueur, enrichissant significativement l'expérience de jeu du 421.
