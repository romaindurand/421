# Score Normalisé - Calcul des Statistiques Équitables

## Problème identifié

Dans le système de statistiques original, le **taux de défaite brut** ne tenait pas compte du nombre de joueurs par partie, ce qui créait un biais :

- **Partie à 2 joueurs** : Probabilité théorique de perdre = 50%
- **Partie à 3 joueurs** : Probabilité théorique de perdre = 33.3%  
- **Partie à 4 joueurs** : Probabilité théorique de perdre = 25%
- **Partie à N joueurs** : Probabilité théorique de perdre = 100/N %

**Conséquence** : Un joueur qui joue principalement en parties à 4+ joueurs aura mathématiquement un meilleur taux de défaite qu'un joueur qui joue principalement en parties à 2-3 joueurs, même à niveau de jeu égal.

## Solution : Score Normalisé

### Principe

Le **score normalisé** ajuste chaque résultat de partie en fonction de la difficulté théorique (nombre de joueurs), puis calcule une moyenne pondérée pour obtenir un score comparable entre tous les joueurs.

### Formule de calcul

Pour chaque partie jouée par un joueur :

1. **Taux de défaite théorique** = `100 / nombre_de_joueurs_dans_la_partie`
2. **Résultat de la partie** = `100` si perdu, `0` si gagné
3. **Score normalisé de la partie** = `(Résultat / Taux_théorique) × 100`
4. **Pondération** = `nombre_de_joueurs_dans_la_partie`

Pour le score global du joueur :
**Score normalisé final** = `Σ(Score_partie × Pondération_partie) / Σ(Pondération_partie)`

### Exemples concrets

#### Exemple 1 : Joueur A
- Partie 1 (2 joueurs) : **Perdu**
  - Taux théorique : 50%
  - Score partie : (100 / 50) × 100 = **200**
  - Pondération : 2

- Partie 2 (4 joueurs) : **Gagné**  
  - Taux théorique : 25%
  - Score partie : (0 / 25) × 100 = **0**
  - Pondération : 4

**Score final** : (200×2 + 0×4) / (2+4) = 400/6 = **66.7**

#### Exemple 2 : Joueur B  
- Partie 1 (4 joueurs) : **Perdu**
  - Taux théorique : 25%
  - Score partie : (100 / 25) × 100 = **400**
  - Pondération : 4

- Partie 2 (4 joueurs) : **Gagné**
  - Taux théorique : 25%  
  - Score partie : (0 / 25) × 100 = **0**
  - Pondération : 4

**Score final** : (400×4 + 0×4) / (4+4) = 1600/8 = **200**

### Interprétation du score

- **Score < 100** : Le joueur perd **moins souvent** que la moyenne théorique → **Bon joueur**
- **Score = 100** : Le joueur perd **exactement** selon la moyenne théorique → **Niveau moyen**  
- **Score > 100** : Le joueur perd **plus souvent** que la moyenne théorique → **Niveau faible**

### Avantages de cette méthode

1. **Équité** : Compare objectivement les joueurs indépendamment du type de parties qu'ils jouent
2. **Pondération intelligente** : Les parties avec plus de joueurs ont plus de poids (elles génèrent plus de données)
3. **Intuitive** : Un score de 100 = performance moyenne théorique
4. **Scalable** : Fonctionne avec n'importe quel nombre de joueurs

### Implémentation

Le toggle permet de basculer entre :
- **Taux brut** : Pourcentage classique de défaites (ancien système)
- **Score normalisé** : Score ajusté prenant en compte la difficulté (nouveau système)

L'affichage montre également :
- Le nombre moyen de joueurs par partie pour chaque joueur
- Le taux brut en sous-information quand le score normalisé est affiché
- Une explication détaillée du système de scoring

Cette approche permet une comparaison équitable entre tous les joueurs du groupe, quelle que soit leur préférence pour des parties à 2, 3, 4 joueurs ou plus.
