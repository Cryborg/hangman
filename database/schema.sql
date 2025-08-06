-- =============================================================================
-- PENDU GAME - SCHÉMA DE BASE DE DONNÉES MySQL
-- =============================================================================
-- Version: 1.0.0
-- Auteur: Système de migration depuis JSON vers MySQL
-- Description: Tables pour gérer les catégories, mots et tags du jeu du pendu
-- =============================================================================

-- Suppression des tables si elles existent (pour recreation propre)
DROP TABLE IF EXISTS `hangman_words`;
DROP TABLE IF EXISTS `hangman_category_tag`;  
DROP TABLE IF EXISTS `hangman_tags`;
DROP TABLE IF EXISTS `hangman_categories`;

-- =============================================================================
-- TABLE: hangman_categories
-- Description: Stocke les catégories de mots (ex: Animaux, Fruits, etc.)
-- =============================================================================
CREATE TABLE `hangman_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) NOT NULL COMMENT 'Nom de la catégorie (ex: "Animaux")',
  `icone` varchar(10) NOT NULL DEFAULT '📂' COMMENT 'Icône emoji de la catégorie',
  `slug` varchar(100) NOT NULL COMMENT 'Slug pour URL (ex: "animaux")',
  `description` text NULL COMMENT 'Description optionnelle de la catégorie',
  `ordre` int(11) NOT NULL DEFAULT 0 COMMENT 'Ordre d\'affichage',
  `active` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Catégorie active (1) ou désactivée (0)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_nom` (`nom`),
  UNIQUE KEY `unique_slug` (`slug`),
  KEY `idx_active` (`active`),
  KEY `idx_ordre` (`ordre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catégories de mots du jeu du pendu';

-- =============================================================================
-- TABLE: hangman_words
-- Description: Stocke tous les mots du jeu, liés à leurs catégories
-- =============================================================================
CREATE TABLE `hangman_words` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mot` varchar(100) NOT NULL COMMENT 'Le mot à deviner (en majuscules)',
  `category_id` int(11) NOT NULL COMMENT 'ID de la catégorie parente',
  `difficulte` enum('facile','moyen','difficile') NOT NULL DEFAULT 'moyen' COMMENT 'Niveau de difficulté du mot',
  `longueur` int(11) NOT NULL COMMENT 'Nombre de caractères du mot (calculé automatiquement)',
  `contient_accents` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Le mot contient des accents (1) ou non (0)', 
  `contient_chiffres` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Le mot contient des chiffres (1) ou non (0)',
  `contient_special` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Le mot contient des caractères spéciaux (1) ou non (0)',
  `popularite` int(11) NOT NULL DEFAULT 0 COMMENT 'Score de popularité (pour tri/recommandations)',
  `active` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Mot actif (1) ou désactivé (0)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_mot_category` (`mot`, `category_id`),
  KEY `idx_category` (`category_id`),
  KEY `idx_difficulte` (`difficulte`),
  KEY `idx_longueur` (`longueur`),
  KEY `idx_active` (`active`),
  KEY `idx_contient_accents` (`contient_accents`),
  KEY `idx_contient_chiffres` (`contient_chiffres`),
  KEY `idx_popularite` (`popularite`),
  CONSTRAINT `fk_words_category` FOREIGN KEY (`category_id`) REFERENCES `hangman_categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Mots du jeu du pendu';

-- =============================================================================
-- TABLE: hangman_tags
-- Description: Système de tags pour catégoriser les catégories (meta-categories)
-- =============================================================================
CREATE TABLE `hangman_tags` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nom` varchar(50) NOT NULL COMMENT 'Nom du tag (ex: "enfant", "nature", "retro")',
  `slug` varchar(50) NOT NULL COMMENT 'Slug pour URL (ex: "enfant")',
  `couleur` varchar(7) DEFAULT '#f39c12' COMMENT 'Couleur hexadécimale du tag',
  `description` text NULL COMMENT 'Description du tag',
  `ordre` int(11) NOT NULL DEFAULT 0 COMMENT 'Ordre d\'affichage',
  `active` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Tag actif (1) ou désactivé (0)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_nom` (`nom`),
  UNIQUE KEY `unique_slug` (`slug`),
  KEY `idx_active` (`active`),
  KEY `idx_ordre` (`ordre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tags pour catégoriser les catégories';

-- =============================================================================
-- TABLE: hangman_category_tag
-- Description: Table de liaison many-to-many entre catégories et tags
-- =============================================================================
CREATE TABLE `hangman_category_tag` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_category_tag` (`category_id`, `tag_id`),
  KEY `idx_category` (`category_id`),
  KEY `idx_tag` (`tag_id`),
  CONSTRAINT `fk_category_tag_category` FOREIGN KEY (`category_id`) REFERENCES `hangman_categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_category_tag_tag` FOREIGN KEY (`tag_id`) REFERENCES `hangman_tags` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Association catégories <-> tags';

-- =============================================================================
-- TRIGGERS AUTOMATIQUES
-- =============================================================================

-- Trigger pour calculer automatiquement les métadonnées des mots
DELIMITER //
CREATE TRIGGER `trigger_hangman_words_metadata` 
BEFORE INSERT ON `hangman_words` 
FOR EACH ROW 
BEGIN
    -- Calculer la longueur
    SET NEW.longueur = CHAR_LENGTH(NEW.mot);
    
    -- Détecter les accents
    SET NEW.contient_accents = CASE 
        WHEN NEW.mot REGEXP '[ÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜŸÇ]' THEN 1 
        ELSE 0 
    END;
    
    -- Détecter les chiffres
    SET NEW.contient_chiffres = CASE 
        WHEN NEW.mot REGEXP '[0-9]' THEN 1 
        ELSE 0 
    END;
    
    -- Détecter les caractères spéciaux (hors accents et chiffres)
    SET NEW.contient_special = CASE 
        WHEN NEW.mot REGEXP '[^A-ZÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜŸÇ0-9 ]' THEN 1 
        ELSE 0 
    END;
    
    -- Déterminer la difficulté automatiquement basée sur la longueur et les caractères
    SET NEW.difficulte = CASE 
        WHEN NEW.longueur <= 5 AND NEW.contient_accents = 0 AND NEW.contient_chiffres = 0 THEN 'facile'
        WHEN NEW.longueur >= 12 OR NEW.contient_accents = 1 OR NEW.contient_chiffres = 1 THEN 'difficile'
        ELSE 'moyen'
    END;
END//

-- Trigger pour mettre à jour les métadonnées lors de modification
CREATE TRIGGER `trigger_hangman_words_metadata_update` 
BEFORE UPDATE ON `hangman_words` 
FOR EACH ROW 
BEGIN
    -- Recalculer seulement si le mot change
    IF OLD.mot != NEW.mot THEN
        SET NEW.longueur = CHAR_LENGTH(NEW.mot);
        
        SET NEW.contient_accents = CASE 
            WHEN NEW.mot REGEXP '[ÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜŸÇ]' THEN 1 
            ELSE 0 
        END;
        
        SET NEW.contient_chiffres = CASE 
            WHEN NEW.mot REGEXP '[0-9]' THEN 1 
            ELSE 0 
        END;
        
        SET NEW.contient_special = CASE 
            WHEN NEW.mot REGEXP '[^A-ZÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜŸÇ0-9 ]' THEN 1 
            ELSE 0 
        END;
        
        SET NEW.difficulte = CASE 
            WHEN NEW.longueur <= 5 AND NEW.contient_accents = 0 AND NEW.contient_chiffres = 0 THEN 'facile'
            WHEN NEW.longueur >= 12 OR NEW.contient_accents = 1 OR NEW.contient_chiffres = 1 THEN 'difficile'
            ELSE 'moyen'
        END;
    END IF;
END//

DELIMITER ;

-- =============================================================================
-- VUES UTILES POUR L'APPLICATION
-- =============================================================================

-- Vue pour récupérer les catégories avec leurs statistiques
CREATE VIEW `v_hangman_categories_stats` AS
SELECT 
    c.id,
    c.nom,
    c.icone,
    c.slug,
    c.description,
    c.ordre,
    c.active,
    COUNT(m.id) as total_mots,
    COUNT(CASE WHEN m.difficulte = 'facile' THEN 1 END) as mots_faciles,
    COUNT(CASE WHEN m.difficulte = 'moyen' THEN 1 END) as mots_moyens,
    COUNT(CASE WHEN m.difficulte = 'difficile' THEN 1 END) as mots_difficiles,
    COUNT(CASE WHEN m.contient_accents = 1 THEN 1 END) as mots_avec_accents,
    COUNT(CASE WHEN m.contient_chiffres = 1 THEN 1 END) as mots_avec_chiffres,
    GROUP_CONCAT(t.nom ORDER BY t.ordre ASC SEPARATOR ',') as tags
FROM `hangman_categories` c
LEFT JOIN `hangman_words` m ON c.id = m.category_id AND m.active = 1
LEFT JOIN `hangman_category_tag` ct ON c.id = ct.category_id  
LEFT JOIN `hangman_tags` t ON ct.tag_id = t.id AND t.active = 1
WHERE c.active = 1
GROUP BY c.id, c.nom, c.icone, c.slug, c.description, c.ordre, c.active
ORDER BY c.ordre ASC, c.nom ASC;

-- Vue pour récupérer les mots avec leurs catégories et tags
CREATE VIEW `v_hangman_words_complete` AS
SELECT 
    m.id,
    m.mot,
    m.difficulte,
    m.longueur,
    m.contient_accents,
    m.contient_chiffres,
    m.contient_special,
    m.popularite,
    m.active,
    c.nom as category_nom,
    c.icone as category_icone,
    c.slug as category_slug,
    GROUP_CONCAT(t.nom ORDER BY t.ordre ASC SEPARATOR ',') as category_tags
FROM `hangman_words` m
INNER JOIN `hangman_categories` c ON m.category_id = c.id
LEFT JOIN `hangman_category_tag` ct ON c.id = ct.category_id  
LEFT JOIN `hangman_tags` t ON ct.tag_id = t.id AND t.active = 1
WHERE m.active = 1 AND c.active = 1
GROUP BY m.id, m.mot, m.difficulte, m.longueur, m.contient_accents, m.contient_chiffres, 
         m.contient_special, m.popularite, m.active, c.nom, c.icone, c.slug
ORDER BY c.ordre ASC, m.popularite DESC, m.mot ASC;

-- =============================================================================
-- INDEX DE PERFORMANCE
-- =============================================================================

-- Index composite pour les requêtes fréquentes
CREATE INDEX `idx_words_category_active_difficulte` ON `hangman_words` (`category_id`, `active`, `difficulte`);
CREATE INDEX `idx_categories_active_ordre` ON `hangman_categories` (`active`, `ordre`);
CREATE INDEX `idx_tags_active_ordre` ON `hangman_tags` (`active`, `ordre`);

-- =============================================================================
-- COMMENTAIRES DE FIN
-- =============================================================================

-- Structure terminée ! 
-- 
-- Prochaines étapes :
-- 1. Exécuter ce script sur votre serveur MySQL
-- 2. Utiliser le script de migration pour importer les données JSON
-- 3. Configurer l'API PHP pour accéder aux données
-- 
-- Fonctionnalités incluses :
-- ✅ Gestion complète des catégories, mots et tags
-- ✅ Système de difficulté automatique 
-- ✅ Détection automatique des caractères spéciaux
-- ✅ Vues optimisées pour l'application
-- ✅ Triggers pour maintenir la cohérence
-- ✅ Index de performance
-- ✅ Contraintes d'intégrité référentielle