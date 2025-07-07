# Système d'onglets pour les statistiques de groupe

## Objectif
Transformer le panneau d'informations simple en un système d'onglets permettant de naviguer entre différents types de statistiques pour une meilleure UX et plus d'informations détaillées.

## Fonctionnalités ajoutées

### 1. Interface à onglets
- **Navigation par onglets** : Interface claire avec 3 onglets distincts
- **Indicateurs visuels** : Onglet actif mis en évidence avec une bordure bleue
- **Accessibilité** : Support des attributs `aria-selected` pour les lecteurs d'écran
- **Icônes descriptives** : Chaque onglet a une icône pour une identification rapide

### 2. Trois types de statistiques

#### Onglet 1 : Taux de défaite classique (📊)
- Affiche le taux de défaite global de chaque joueur
- Tri par taux décroissant (pire joueur en premier)
- Barre de progression verte à rouge
- Informations sur le nombre total de parties

#### Onglet 2 : Score normalisé (⚖️)
- Score ajusté selon le nombre de joueurs par partie
- Prend en compte la difficulté (plus difficile avec moins de joueurs)
- Affichage du taux brut en complément
- Explications détaillées avec code couleur
- Barre de progression adaptée (vert/jaune/rouge selon le score)

#### Onglet 3 : Défaites accrochées (🎣)
- **NOUVEAU** : Taux de défaite calculé uniquement sur les parties où le joueur a été accroché
- Affiche le nombre de parties accrochées vs défaites accrochées
- Comparaison avec le taux global en sous-texte
- Couleur spéciale (ambre à rouge) pour différencier
- Gestion des joueurs jamais accrochés

### 3. Améliorations techniques

#### Nouvelle fonction `calculateHookedDefeatRate()`
```typescript
function calculateHookedDefeatRate(playerName: string): {
    rate: number;           // Taux de défaite sur parties accrochées
    hookedGames: number;    // Nombre de parties accrochées
    hookedDefeats: number;  // Nombre de défaites accrochées
}
```

#### Tri intelligent
- Le tri s'adapte automatiquement selon l'onglet sélectionné
- Chaque statistique a sa propre logique de tri
- Maintien de la cohérence dans l'affichage

#### État persistant
- L'onglet sélectionné est mémorisé pendant la session
- Réactivité : le tri et l'affichage se mettent à jour automatiquement

## Interface utilisateur

### Navigation
- **Onglets horizontaux** avec bordures et états hover
- **Couleurs cohérentes** avec le thème existant
- **Transitions fluides** entre les onglets

### Affichage des données
- **Cartes joueur unifiées** : même structure pour tous les onglets
- **Informations contextuelles** : sous-textes adaptés à chaque statistique
- **Barres de progression** : couleurs et largeurs adaptées au type de donnée
- **Encadrés explicatifs** : aide contextuelle pour chaque type de statistique

### Gestion des cas particuliers
- **Aucune partie** : Message informatif unique
- **Joueurs jamais accrochés** : Indication "Jamais accroché" dans l'onglet 3
- **Parties sans données** : Gestion gracieuse des anciennes parties

## Avantages de cette approche

1. **UX améliorée** : Navigation claire entre différents types d'information
2. **Informations plus riches** : Chaque onglet apporte un angle d'analyse différent
3. **Évolutivité** : Facile d'ajouter de nouveaux onglets/statistiques
4. **Accessibilité** : Support des standards ARIA
5. **Performance** : Calculs à la demande, pas de surcharge
6. **Cohérence** : Design unifié avec le reste de l'application

## Utilisation

1. **Taux de défaite** : Vue d'ensemble classique pour comparer les joueurs
2. **Score normalisé** : Analyse plus fine tenant compte du contexte des parties
3. **Défaites accrochées** : Statistique spécialisée pour analyser les performances sous pression

Cette évolution enrichit considérablement l'analyse des performances tout en maintenant une interface claire et intuitive.
