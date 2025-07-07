# Tests de sécurité des groupes

Ce document décrit les tests de sécurité implémentés pour la protection par mot de passe des groupes.

## Fonctionnalités implémentées

### 1. Protection côté serveur 
- ✅ Les pages de groupes (`/group/[id]`) nécessitent maintenant une authentification
- ✅ Redirection automatique vers la page d'accueil si l'utilisateur n'est pas authentifié
- ✅ Paramètres URL pour ouvrir automatiquement la modal de mot de passe

### 2. Système de session
- ✅ Cookies httpOnly pour gérer les sessions d'authentification
- ✅ Durée de session de 1 heure par groupe
- ✅ Cookies liés à un groupe spécifique (`group_access_{groupId}`)

### 3. Protection des APIs
- ✅ `/api/groups/[id]` - GET et DELETE protégés
- ✅ `/api/groups/[id]/games` - POST protégé
- ✅ `/api/games/[id]` - GET et DELETE protégés  
- ✅ `/api/games/[id]/players/[playerName]` - PATCH protégé
- ✅ `/api/groups/[id]/verify-password` - Définit le cookie de session
- ✅ `/api/groups/[id]/logout` - Supprime le cookie de session

### 4. Masquage des mots de passe
- ✅ Les mots de passe ne sont jamais renvoyés dans les réponses API
- ✅ Propriété `password` supprimée des objets groupe côté client
- ✅ Protection dans toutes les APIs : GET groups, GET group, POST group

### 5. Interface utilisateur
- ✅ Modal de saisie de mot de passe sur la page d'accueil
- ✅ Bouton de déconnexion sur les pages de groupe
- ✅ Gestion des erreurs et messages utilisateur
- ✅ Ouverture automatique de la modal en cas de redirection

## Tests recommandés

### Test 1: Accès direct sans authentification
1. Aller sur `/group/[id]` sans être authentifié
2. ✅ Devrait rediriger vers `/?group=[id]&auth=required`
3. ✅ Devrait ouvrir automatiquement la modal de mot de passe

### Test 2: Authentification par mot de passe
1. Entrer le bon mot de passe dans la modal
2. ✅ Devrait rediriger vers la page du groupe
3. ✅ Devrait définir un cookie de session

### Test 3: Persistance de session
1. Se connecter à un groupe
2. Naviguer ailleurs puis revenir
3. ✅ Devrait rester connecté pendant 1 heure

### Test 4: Protection des APIs
1. Essayer d'accéder aux APIs sans cookie de session
2. ✅ Devrait retourner une erreur 401
3. ✅ Devrait empêcher toute modification des données

### Test 5: Déconnexion
1. Cliquer sur le bouton "Se déconnecter"
2. ✅ Devrait supprimer le cookie de session
3. ✅ Devrait rediriger vers la page d'accueil

### Test 6: Sécurité des mots de passe
1. Examiner les réponses des APIs
2. ✅ Aucun mot de passe ne devrait être visible
3. ✅ Mots de passe stockés en plaintext (peut être amélioré avec hashing)

## Améliorations futures possibles

1. **Hashing des mots de passe** : Utiliser bcrypt ou similaire
2. **Sessions plus sécurisées** : Utiliser des tokens JWT ou sessions Redis
3. **Rate limiting** : Limiter les tentatives de mot de passe
4. **Audit logs** : Enregistrer les tentatives d'accès
5. **2FA** : Authentification à deux facteurs optionnelle
