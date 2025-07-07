# Test de session persistante

Pour tester que le cookie fonctionne correctement :

1. **Ouvrir http://localhost:5173**
2. **Créer un nouveau groupe** avec un nom et un mot de passe
3. **Cliquer sur "Accéder au groupe"** et entrer le mot de passe
4. **Vérifier que vous accédez au groupe** sans redirection
5. **Dans un nouvel onglet, aller directement sur l'URL du groupe** (ex: http://localhost:5173/group/abc123)
6. **Vérifier que vous n'avez PAS besoin de re-entrer le mot de passe**

## Ce qui devrait se passer :

✅ **Premier accès** : Modal de mot de passe s'affiche
✅ **Accès réussi** : Page du groupe s'affiche
✅ **Accès suivant** : Aucune demande de mot de passe (cookie valide)

## Si le problème persiste :

Vérifier les logs dans la console du navigateur et la console du serveur pour voir :
- Si le cookie est bien défini
- Si le cookie est bien lu lors de l'accès suivant

## Logs à surveiller :

**Console serveur :**
```
Cookie défini pour groupe [id]: { name: ..., value: ..., maxAge: ... }
Vérification cookie pour groupe [id]: { cookieValue: ..., allCookies: [...] }
```

**Console navigateur :**
```
Mot de passe correct, redirection vers le groupe...
```
