# Logique Automatique : Joueur Perdant = Automatiquement Accroché

## Problème identifié

Dans le système initial, un joueur pouvait être déclaré comme perdant sans être marqué comme accroché, ce qui créait un état incohérent dans le contexte du jeu de 421 où un joueur perdant est généralement accroché.

## Solution implémentée

### 1. **Modification de la logique côté serveur**

Dans `/src/lib/database.ts`, fonction `updatePlayerInGame` :

```typescript
if (lost === true) {
    // Si on marque ce joueur comme perdant, tous les autres deviennent gagnants
    // et le joueur perdant est automatiquement marqué comme accroché
    game.players.forEach(p => {
        if (p.name === playerName) {
            p.lost = true;
            p.hooked = true; // ← Automatiquement accroché quand perdant
        } else {
            p.lost = false;
        }
    });
}
```

**Logique** :
- ✅ Quand un joueur est déclaré **perdant** → il devient automatiquement **accroché**
- ✅ Quand un joueur est déclaré **gagnant** → son statut d'accrochage reste inchangé (choix manuel)

### 2. **Amélioration de l'interface utilisateur**

Dans `/src/routes/game/[id]/+page.svelte` :

**Bouton d'accrochage désactivé pour les perdants** :
```svelte
<button
    on:click={() => togglePlayerHooked(player.name)}
    disabled={player.lost}
    class="... {player.lost ? 'bg-gray-500 cursor-not-allowed' : '...'}"
    title={player.lost ? 'Les joueurs perdants sont automatiquement accrochés' : ''}
>
    {player.lost 
        ? 'Automatiquement accroché' 
        : player.hooked 
        ? "Retirer l'accrochage" 
        : 'Marquer comme accroché'
    }
</button>
```

**Indications visuelles** :
- 🔒 **Bouton désactivé** pour les joueurs perdants
- 💡 **Tooltip explicatif** au survol
- 📝 **Texte adaptatif** selon l'état du joueur

### 3. **Comportements résultants**

| Action | Résultat |
|--------|----------|
| Marquer comme **perdant** | → `lost: true` + `hooked: true` (automatique) |
| Marquer comme **gagnant** | → `lost: false` + `hooked: inchangé` |
| Marquer comme **accroché** | → `hooked: true` (si pas perdant) |
| Retirer **l'accrochage** | → `hooked: false` (si pas perdant) |

### 4. **Avantages**

✅ **Cohérence** : État logique entre perdant/accroché  
✅ **Simplicité** : Moins de clics pour les utilisateurs  
✅ **Prévention d'erreurs** : Impossible d'avoir un perdant non-accroché  
✅ **UX claire** : Interface explicite sur les contraintes  

### 5. **Cas d'usage typique**

1. **Début de partie** : Tous les joueurs sont `lost: false, hooked: false`
2. **Joueur se fait accrocher** : `lost: false, hooked: true` (action manuelle)
3. **Joueur perd** : `lost: true, hooked: true` (automatique)
4. **Joueur revient en jeu** : `lost: false, hooked: true` (reste accroché)

Cette logique reflète fidèlement les règles du 421 où un joueur qui perd une manche est naturellement considéré comme ayant été accroché durant cette manche.
