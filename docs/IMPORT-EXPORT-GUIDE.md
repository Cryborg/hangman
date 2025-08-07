# Guide Import/Export - Jeu du Pendu

## 📤 Export de la base de données

### Via script bash (recommandé)
```bash
./export-database.sh
```
Crée un fichier JSON horodaté avec toutes les données.

### Via interface admin
1. Accéder à http://localhost:8090/admin.html
2. Onglet "Import/Export"
3. Cliquer sur "Export complet"

### Export SQL direct
```bash
docker exec hangman_mysql mysqldump -u hangman_user -phangman_password hangman_db > backup.sql
```

## 📥 Import de données

### Format JSON attendu

Le système supporte l'import avec **niveaux de difficulté** :

```json
{
  "mode": "merge",  // ou "replace" pour tout remplacer
  "data": {
    "categories": [
      {
        "name": "Nom Catégorie",
        "icon": "🎯",
        "description": "Description optionnelle",
        "words": [
          {
            "word": "MOTFACILE",
            "difficulty": "easy"    // easy, medium ou hard
          },
          {
            "word": "MOTMOYEN",
            "difficulty": "medium"
          },
          {
            "word": "MOTDIFFICILE",
            "difficulty": "hard"
          }
        ]
      }
    ]
  }
}
```

### Import via interface admin
1. Accéder à http://localhost:8090/admin.html
2. Onglet "Import/Export"
3. Coller le JSON ou uploader le fichier
4. Choisir le mode (merge ou replace)
5. Cliquer sur "Importer"

### Import via API
```bash
curl -X POST http://localhost:8090/api/admin/import-export.php \
  -H "Content-Type: application/json" \
  -d @import-file.json
```

## 🎯 Niveaux de difficulté

### Classification recommandée

**Easy (Facile)** :
- Mots courts (3-6 lettres)
- Mots du quotidien
- Sans accents ni caractères spéciaux
- Exemples : CHAT, CHIEN, MAISON

**Medium (Moyen)** :
- Mots moyens (7-10 lettres)
- Vocabulaire standard
- Peuvent avoir des accents
- Exemples : ÉLÉPHANT, ORDINATEUR, BIBLIOTHÈQUE

**Hard (Difficile)** :
- Mots longs (11+ lettres)
- Orthographe complexe
- Mots rares ou techniques
- Exemples : KIRGHIZISTAN, ORNITHORYNQUE, ANTICONSTITUTIONNELLEMENT

## 📊 Vérification après import

### Vérifier la répartition des niveaux
```sql
SELECT difficulty, COUNT(*) 
FROM hangman_words 
GROUP BY difficulty;
```

### Vérifier les catégories sans mots Hard
```sql
SELECT c.name, 
  SUM(CASE WHEN w.difficulty = 'hard' THEN 1 ELSE 0 END) as hard_count
FROM hangman_categories c 
LEFT JOIN hangman_words w ON c.id = w.category_id
GROUP BY c.id
HAVING hard_count = 0;
```

## 🔧 Scripts de migration disponibles

- `migration_quick.sql` : Migration initiale des 1141 mots
- `migration_add_hard_countries.sql` : Ajout des pays difficiles (les -stan)

## 💡 Conseils

1. **Toujours faire un backup avant import** : `./export-database.sh`
2. **Utiliser mode "merge"** pour ajouter sans écraser
3. **Vérifier les niveaux** après import avec l'API : 
   ```bash
   curl http://localhost:8090/api/categories-levels.php?levels=hard&format=legacy
   ```
4. **Équilibrer les niveaux** : Viser ~25% easy, ~50% medium, ~25% hard

## 🚨 Problèmes courants

### Catégorie sans mots dans un niveau
L'API filtre automatiquement les catégories vides. Si une catégorie n'a pas de mots Hard et que l'utilisateur sélectionne uniquement Hard, la catégorie ne sera pas affichée.

### Caractères spéciaux
Les accents et caractères spéciaux sont supportés. Utiliser UTF-8 pour l'import.

### Import échoue
Vérifier :
- Format JSON valide
- Pas de doublons de mots dans la même catégorie
- Serveur Docker lancé (`docker-compose ps`)