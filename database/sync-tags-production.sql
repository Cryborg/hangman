-- Script de synchronisation des Tags et Associations - VERSION PRODUCTION
-- À exécuter sur la base de données de production
-- Date: 2025-08-07
-- 
-- Ce script s'assure que tous les tags et leurs associations avec les catégories
-- sont correctement présents en production
--
-- ATTENTION: Ce script utilise INSERT IGNORE pour éviter les doublons
--           Il ne supprime pas les données existantes

-- ========================================
-- INSERTION DES TAGS
-- ========================================

-- Insérer tous les tags nécessaires (INSERT IGNORE évite les doublons)
INSERT IGNORE INTO hangman_tags (name, slug, color, description, display_order, active, created_at, updated_at) VALUES
('adulte', 'adulte', '#f39c12', 'Contenu adapté aux adultes', 0, 1, NOW(), NOW()),
('comics', 'comics', '#f39c12', 'Univers des bandes dessinées et comics', 0, 1, NOW(), NOW()),
('culture', 'culture', '#f39c12', 'Culture générale et divertissement', 0, 1, NOW(), NOW()),
('disney', 'disney', '#f39c12', 'Univers Disney', 0, 1, NOW(), NOW()),
('education', 'education', '#f39c12', 'Contenu éducatif et pédagogique', 0, 1, NOW(), NOW()),
('enfant', 'enfant', '#f39c12', 'Contenu adapté aux enfants', 0, 1, NOW(), NOW()),
('famille', 'famille', '#f39c12', 'Activités familiales', 0, 1, NOW(), NOW()),
('fantastique', 'fantastique', '#f39c12', 'Univers fantastique et imaginaire', 0, 1, NOW(), NOW()),
('geographie', 'geographie', '#f39c12', 'Géographie et lieux', 0, 1, NOW(), NOW()),
('harry-potter', 'harry-potter', '#f39c12', 'Univers Harry Potter', 0, 1, NOW(), NOW()),
('nature', 'nature', '#f39c12', 'Nature et environnement', 0, 1, NOW(), NOW()),
('pixar', 'pixar', '#f39c12', 'Studios Pixar', 0, 1, NOW(), NOW()),
('quotidien', 'quotidien', '#f39c12', 'Objets et activités du quotidien', 0, 1, NOW(), NOW()),
('retro', 'retro', '#f39c12', 'Nostalgie et rétro (années 80-90)', 0, 1, NOW(), NOW()),
('sport', 'sport', '#f39c12', 'Sports et activités physiques', 0, 1, NOW(), NOW());

-- ========================================
-- ASSOCIATIONS CATÉGORIES-TAGS
-- ========================================

-- Avant d'insérer les associations, nous devons nous assurer d'avoir les IDs corrects
-- des catégories et tags. Utilisons des sous-requêtes pour être sûrs.

-- Pour éviter les erreurs, on supprime d'abord les associations existantes qui pourraient être incorrectes
-- puis on les recrée proprement

-- ATTENTION: Décommentez la ligne suivante SEULEMENT si vous voulez refaire toutes les associations
-- DELETE FROM hangman_category_tag;

-- Insérer toutes les associations catégorie-tag
-- Format: (category_name, tag_name)

-- Animaux
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Animaux' AND t.name IN ('nature', 'famille', 'enfant');

-- Animaux préhistoriques  
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Animaux préhistoriques' AND t.name IN ('nature', 'enfant', 'education');

-- Appareils Électroménager
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Appareils Électroménager' AND t.name IN ('quotidien', 'adulte');

-- Chanteurs et Chanteuses
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Chanteurs et Chanteuses' AND t.name IN ('culture', 'adulte');

-- Couleurs
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Couleurs' AND t.name IN ('education', 'enfant');

-- Dessins Animés 80s
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Dessins Animés 80s' AND t.name IN ('culture', 'famille', 'retro');

-- Films classiques Disney
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Films classiques Disney' AND t.name IN ('culture', 'disney', 'enfant');

-- Films Cultes
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Films Cultes' AND t.name IN ('culture', 'famille', 'retro');

-- Fleurs
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Fleurs' AND t.name IN ('nature', 'famille');

-- Fruits et Légumes
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Fruits et Légumes' AND t.name IN ('nature', 'enfant', 'quotidien');

-- Groupes de Musique
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Groupes de Musique' AND t.name IN ('culture', 'adulte', 'retro');

-- Héros de dessins animés
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Héros de dessins animés' AND t.name IN ('culture', 'enfant', 'comics');

-- Instruments de Musique
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Instruments de Musique' AND t.name IN ('culture', 'education', 'famille');

-- Jeux de Société
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Jeux de Société' AND t.name IN ('famille', 'quotidien');

-- Jeux Vidéo
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Jeux Vidéo' AND t.name IN ('culture', 'famille', 'retro');

-- Jouets
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Jouets' AND t.name IN ('enfant', 'quotidien');

-- L'univers de Pixar
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'L\'univers de Pixar' AND t.name IN ('culture', 'enfant', 'pixar');

-- Lieux Harry Potter
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Lieux Harry Potter' AND t.name IN ('fantastique', 'enfant', 'harry-potter');

-- Métiers
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Métiers' AND t.name IN ('education', 'famille', 'quotidien');

-- Monuments
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Monuments' AND t.name IN ('culture', 'education', 'geographie');

-- Nourriture préférée des enfants
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Nourriture préférée des enfants' AND t.name IN ('enfant', 'quotidien');

-- Objets du Quotidien
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Objets du Quotidien' AND t.name IN ('famille', 'quotidien');

-- Objets scolaires
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Objets scolaires' AND t.name IN ('education', 'enfant', 'quotidien');

-- Parties du corps
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Parties du corps' AND t.name IN ('education', 'enfant', 'quotidien');

-- Pays
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Pays' AND t.name IN ('education', 'famille', 'geographie');

-- Personnages Disney
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Personnages Disney' AND t.name IN ('culture', 'disney', 'enfant', 'pixar');

-- Personnages Harry Potter
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Personnages Harry Potter' AND t.name IN ('fantastique', 'enfant', 'harry-potter');

-- Pièces de la Maison
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Pièces de la Maison' AND t.name IN ('famille', 'quotidien');

-- Séries TV
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Séries TV' AND t.name IN ('culture', 'adulte', 'retro');

-- Sports
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Sports' AND t.name IN ('famille', 'sport');

-- Véhicules
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Véhicules' AND t.name IN ('enfant', 'quotidien');

-- Villes
INSERT IGNORE INTO hangman_category_tag (category_id, tag_id)
SELECT c.id, t.id FROM hangman_categories c, hangman_tags t 
WHERE c.name = 'Villes' AND t.name IN ('education', 'famille', 'geographie');

-- ========================================
-- VÉRIFICATIONS POST-SYNCHRONISATION
-- ========================================

-- Compter les tags
SELECT 'Tags totaux' AS description, COUNT(*) AS count FROM hangman_tags;

-- Compter les associations
SELECT 'Associations totales' AS description, COUNT(*) AS count FROM hangman_category_tag;

-- Afficher les catégories sans tags (devrait être minimal)
SELECT 'Catégories sans tags' AS description, COUNT(*) AS count
FROM hangman_categories c
LEFT JOIN hangman_category_tag ct ON c.id = ct.category_id
WHERE ct.category_id IS NULL AND c.active = 1;

-- Afficher les tags les plus utilisés
SELECT t.name as tag_name, COUNT(ct.category_id) as categories_count
FROM hangman_tags t
LEFT JOIN hangman_category_tag ct ON t.id = ct.tag_id
GROUP BY t.id, t.name
ORDER BY categories_count DESC, t.name ASC;

-- ========================================
-- NOTES D'EXÉCUTION
-- ========================================
-- 
-- Résultat attendu après exécution:
-- - 15 tags actifs minimum
-- - 86+ associations catégorie-tag
-- - Toutes les catégories actives ont au moins un tag
-- - L'API admin affichera correctement les tags
-- 
-- Pour exécuter en production:
-- mysql -u [USER] -p [DATABASE] < sync-tags-production.sql
--
-- SÉCURITÉ: Ce script utilise INSERT IGNORE pour éviter les doublons
-- Il est sûr de l'exécuter plusieurs fois sans risquer la corruption des données