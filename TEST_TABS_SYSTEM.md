# Test du système d'onglets pour les statistiques

## Fonctionnalités à tester

### 1. Interface des onglets
- [ ] Navigation entre les 3 onglets
- [ ] Indicateur visuel de l'onglet actif
- [ ] Responsive design sur mobile/desktop
- [ ] Accessibilité (navigation clavier)

### 2. Onglet 1 : Taux de défaite
- [ ] Affichage correct du taux de défaite pour chaque joueur
- [ ] Tri décroissant (pire joueur en premier)
- [ ] Barre de progression verte à rouge
- [ ] Informations contextuelles (nombre de parties, moyenne de joueurs)

### 3. Onglet 2 : Score normalisé  
- [ ] Calcul correct du score normalisé
- [ ] Affichage du taux brut en complément
- [ ] Barre de progression adaptée (vert/jaune/rouge)
- [ ] Explications détaillées avec exemples
- [ ] Tri par score normalisé

### 4. Onglet 3 : Défaites accrochées
- [ ] Calcul uniquement sur les parties où le joueur a été accroché
- [ ] Affichage "Jamais accroché" pour les joueurs concernés
- [ ] Informations détaillées (X parties accrochées, Y défaites)
- [ ] Comparaison avec le taux global
- [ ] Couleur ambre/rouge spécifique
- [ ] Tri par taux accroché décroissant

### 5. Gestion des cas particuliers
- [ ] Aucune partie : message informatif
- [ ] Joueurs sans parties accrochées
- [ ] Parties sans données d'accrochage (migration)

### 6. Performance et réactivité
- [ ] Calculs rapides même avec beaucoup de données
- [ ] Transition fluide entre onglets
- [ ] Mise à jour automatique des statistiques

## Scénarios de test

### Scénario 1 : Groupe avec données variées
1. Créer un groupe avec plusieurs joueurs
2. Créer des parties avec différents nombres de joueurs
3. Marquer certains joueurs comme accrochés
4. Vérifier que chaque onglet affiche des données cohérentes

### Scénario 2 : Groupe nouveau (aucune partie)
1. Créer un nouveau groupe
2. Vérifier l'affichage du message informatif dans tous les onglets

### Scénario 3 : Joueurs jamais accrochés
1. Créer des parties sans marquer de joueurs comme accrochés
2. Vérifier l'affichage "Jamais accroché" dans l'onglet 3

### Scénario 4 : Navigation et UX
1. Tester la navigation clavier entre onglets
2. Vérifier les états hover et focus
3. Tester sur mobile/tablette

## Validation des calculs

### Taux de défaite classique
`défaites / total_parties * 100`

### Score normalisé  
`(défaites_réelles / défaites_théoriques) * 100`
Où défaites_théoriques = `100 / nombre_joueurs`

### Taux accrochées
`défaites_accrochées / parties_accrochées * 100`

## Points d'attention
- Cohérence des tris entre les onglets
- Performance avec de gros volumes de données
- Accessibilité et navigation clavier
- Responsive design
- Messages d'aide contextuels
