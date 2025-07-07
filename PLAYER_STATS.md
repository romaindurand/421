# 📊 Statistiques des joueurs - Taux de défaite

## ✨ **Nouvelle fonctionnalité**

L'encart "Informations" affiche maintenant une liste verticale des joueurs avec leurs statistiques de défaite.

## 🎯 **Fonctionnalités**

### 1. **Calcul automatique du taux de défaite**
- Analyse toutes les parties jouées par chaque joueur
- Calcule le pourcentage de parties perdues
- Formule : `(nombre de défaites / nombre total de parties) × 100`

### 2. **Tri par performance**
- ✅ **Liste triée par taux de défaite croissant**
- Les meilleurs joueurs (moins de défaites) apparaissent en haut
- Les joueurs avec plus de défaites apparaissent en bas

### 3. **Affichage visuel enrichi**
- **Nom du joueur** en évidence
- **Nombre de parties jouées** en sous-texte
- **Taux de défaite** en pourcentage (1 décimale)
- **Barre de progression colorée** : vert (bon) → rouge (mauvais)

### 4. **Interface responsive**
```
┌─────────────────────────────────────────┐
│ 👤 Alice        2 parties    12.5% ████ │
│ 👤 Bob          3 parties    33.3% ████ │  
│ 👤 Charlie      1 partie     100%  ████ │
└─────────────────────────────────────────┘
```

## 🔢 **Logique de calcul**

```typescript
function calculateDefeatRate(playerName: string): number {
    let totalGames = 0;
    let defeats = 0;

    group.games.forEach(game => {
        const player = game.players.find(p => p.name === playerName);
        if (player) {
            totalGames++;
            if (player.lost) {
                defeats++;
            }
        }
    });

    return totalGames === 0 ? 0 : (defeats / totalGames) * 100;
}
```

## 📈 **Cas d'usage**

### **Quand un groupe n'a pas encore de parties :**
- Affiche un message informatif
- "Aucune statistique disponible - créez une partie pour voir les taux de défaite"

### **Quand des parties existent :**
- Calcul en temps réel des statistiques
- Mise à jour automatique après chaque partie
- Tri dynamique par performance

## 🎨 **Design**

- **Arrière-plan** : Cartes grises sur fond sombre
- **Typographie** : Noms en gras, détails en gris clair
- **Couleurs** : Gradient vert→rouge pour les barres de progression
- **Espacement** : Layout vertical aéré et lisible

## 🔄 **Mise à jour dynamique**

Les statistiques se mettent à jour automatiquement :
- ✅ Après création d'une nouvelle partie
- ✅ Après modification d'une partie existante
- ✅ Grâce au système SSE (Server-Sent Events)

---

**💡 Cette fonctionnalité transforme l'encart statique en un véritable tableau de bord des performances !**
