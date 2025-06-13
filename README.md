# CodeLibrary

Une application web pour stocker et gérer vos snippets de code.

## 🚀 Déploiement sur Vercel

### Prérequis
- Un compte GitHub
- Un compte Vercel

### Étapes de déploiement

1. **Push sur GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/votre-username/votre-repo.git
   git push -u origin main
   ```

2. **Connecter à Vercel**
   - Allez sur [vercel.com](https://vercel.com)
   - Connectez votre compte GitHub
   - Importez votre repository
   - Configurez les variables d'environnement (voir ci-dessous)

3. **Variables d'environnement Vercel**
   ```
   NODE_ENV=production
   JWT_SECRET=votre-secret-jwt-tres-securise
   DATA_DIRECTORY=/tmp
   ```

### 🛠️ Développement local

```bash
# Installation des dépendances
npm install

# Démarrage en développement
npm run dev

# Build de production
npm run build
```

## 📁 Structure du projet

```
├── src/                    # Code source React
├── server/                 # API Express
├── public/                 # Assets statiques
├── dist/                   # Build de production
├── vercel.json            # Configuration Vercel
└── package.json
```

## 🔧 Technologies utilisées

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js
- **Base de données**: SQLite avec Kysely
- **Authentification**: JWT
- **Déploiement**: Vercel

## 📝 Fonctionnalités

- ✅ Authentification utilisateur
- ✅ Création et gestion de snippets
- ✅ Filtrage par langage
- ✅ Recherche dans les snippets
- ✅ Interface responsive
- ✅ Thème sombre/clair automatique

## 🔐 Sécurité

- Authentification JWT
- Hachage des mots de passe avec bcrypt
- Validation des entrées
- Protection CORS

## 📄 Licence

MIT
