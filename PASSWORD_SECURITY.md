# 🔐 Amélioration de sécurité : Hachage des mots de passe

## ✅ Fonctionnalités implémentées

### 1. **Hachage sécurisé avec SHA-256 + Salt**
- **Algorithme** : SHA-256 avec salt aléatoire
- **Salt unique** : 16 bytes aléatoires par mot de passe
- **Stockage** : Hash + salt séparés dans la base de données
- **Pas de mot de passe en clair** : Impossible de récupérer le mot de passe original

### 2. **Migration automatique**
- **Détection automatique** : Les mots de passe en clair sont détectés au démarrage
- **Migration transparente** : Conversion automatique des anciens mots de passe
- **Compatibilité** : Les groupes existants continuent de fonctionner
- **Logging** : Affichage du nombre de groupes migrés

### 3. **API de sécurité**
```typescript
// Fonctions disponibles :
generateSalt()                    // Génère un salt aléatoire
hashPassword(password, salt)      // Hache avec salt existant  
hashPasswordWithSalt(password)    // Hache avec nouveau salt
verifyPassword(password, hash, salt) // Vérifie un mot de passe
migratePasswordsToHash()         // Migre les mots de passe existants
```

## 🔒 **Niveau de sécurité atteint**

| Aspect | Avant | Après |
|--------|-------|--------|
| **Stockage** | ❌ Mot de passe en clair | ✅ Hash SHA-256 + salt |
| **Réversibilité** | ❌ Facile à lire | ✅ Impossible à reverser |
| **Rainbow tables** | ❌ Vulnérable | ✅ Salt unique protège |
| **Fuite de données** | ❌ Catastrophique | ✅ Hash inutilisable seul |
| **Migration** | ❌ N/A | ✅ Automatique et transparente |

## 📋 **Exemple de transformation**

### Avant (db.json) :
```json
{
  "id": "abc123",
  "name": "Mon Groupe",
  "password": "motdepasse123", // ❌ EN CLAIR !
  "playerNames": ["Alice", "Bob"]
}
```

### Après (db.json) :
```json
{
  "id": "abc123", 
  "name": "Mon Groupe",
  "password": "a7b8c9d...", // ✅ Hash SHA-256
  "passwordSalt": "f1e2d3c...", // ✅ Salt unique
  "playerNames": ["Alice", "Bob"]
}
```

## 🧪 **Test de la migration**

Au prochain démarrage de l'application, vous verrez dans les logs :
```
Migration du mot de passe pour le groupe: Mon Groupe
Migration terminée: 1 groupe(s) migré(s)
```

## 🚀 **Compatibilité**

- ✅ **Groupes existants** : Migrés automatiquement
- ✅ **Nouveaux groupes** : Hachés dès la création  
- ✅ **Authentification** : Fonctionne normalement
- ✅ **Performance** : Impact minimal (hachage rapide)

## 🔐 **Sécurité renforcée**

1. **Mots de passe irréversibles** : Même avec accès à la DB
2. **Salt unique** : Protection contre les rainbow tables
3. **SHA-256** : Algorithme de hachage robuste et rapide
4. **Migration transparente** : Pas d'interruption de service

---

**🎉 Vos mots de passe sont maintenant sécurisés !**

Plus aucun mot de passe n'est stocké en clair. Même en cas d'accès non autorisé à la base de données, les mots de passe restent protégés.
