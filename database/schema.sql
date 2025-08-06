-- =============================================================================
-- HANGMAN GAME - MySQL DATABASE SCHEMA
-- =============================================================================
-- Version: 2.0.0
-- Author: Gemini AI Refactoring
-- Description: Tables for managing categories, words, and tags for the Hangman game.
-- =============================================================================

-- Drop tables if they exist (for clean recreation)
DROP TABLE IF EXISTS `hangman_words`;
DROP TABLE IF EXISTS `hangman_category_tag`;  
DROP TABLE IF EXISTS `hangman_tags`;
DROP TABLE IF EXISTS `hangman_categories`;

-- =============================================================================
-- TABLE: hangman_categories
-- Description: Stores word categories (e.g., Animals, Fruits, etc.)
-- =============================================================================
CREATE TABLE `hangman_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT 'Category name (e.g., "Animals")',
  `icon` varchar(10) NOT NULL DEFAULT '📂' COMMENT 'Category emoji icon',
  `slug` varchar(100) NOT NULL COMMENT 'URL-friendly slug (e.g., "animals")',
  `description` text NULL COMMENT 'Optional category description',
  `display_order` int(11) NOT NULL DEFAULT 0 COMMENT 'Display order',
  `active` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Category is active (1) or disabled (0)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_name` (`name`),
  UNIQUE KEY `unique_slug` (`slug`),
  KEY `idx_active` (`active`),
  KEY `idx_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hangman game word categories';

-- =============================================================================
-- TABLE: hangman_words
-- Description: Stores all game words, linked to their categories
-- =============================================================================
CREATE TABLE `hangman_words` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `word` varchar(100) NOT NULL COMMENT 'The word to guess (uppercase)',
  `category_id` int(11) NOT NULL COMMENT 'Parent category ID',
  `difficulty` enum('easy','medium','hard') NOT NULL DEFAULT 'medium' COMMENT 'Word difficulty level',
  `length` int(11) NOT NULL COMMENT 'Word length (calculated automatically)',
  `has_accents` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Word contains accents (1) or not (0)', 
  `has_numbers` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Word contains numbers (1) or not (0)',
  `has_special_chars` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Word contains special characters (1) or not (0)',
  `popularity` int(11) NOT NULL DEFAULT 0 COMMENT 'Popularity score (for sorting/recommendations)',
  `active` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Word is active (1) or disabled (0)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_word_category` (`word`, `category_id`),
  KEY `idx_category` (`category_id`),
  KEY `idx_difficulty` (`difficulty`),
  KEY `idx_length` (`length`),
  KEY `idx_active` (`active`),
  KEY `idx_has_accents` (`has_accents`),
  KEY `idx_has_numbers` (`has_numbers`),
  KEY `idx_popularity` (`popularity`),
  CONSTRAINT `fk_words_category` FOREIGN KEY (`category_id`) REFERENCES `hangman_categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hangman game words';

-- =============================================================================
-- TABLE: hangman_tags
-- Description: Tag system for categorizing categories (meta-categories)
-- =============================================================================
CREATE TABLE `hangman_tags` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT 'Tag name (e.g., "kids", "nature", "retro")',
  `slug` varchar(50) NOT NULL COMMENT 'URL-friendly slug (e.g., "kids")',
  `color` varchar(7) DEFAULT '#f39c12' COMMENT 'Tag hex color',
  `description` text NULL COMMENT 'Tag description',
  `display_order` int(11) NOT NULL DEFAULT 0 COMMENT 'Display order',
  `active` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Tag is active (1) or disabled (0)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_name` (`name`),
  UNIQUE KEY `unique_slug` (`slug`),
  KEY `idx_active` (`active`),
  KEY `idx_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tags for categorizing categories';

-- =============================================================================
-- TABLE: hangman_category_tag
-- Description: Many-to-many link table between categories and tags
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Category <-> Tag associations';

-- =============================================================================
-- AUTOMATIC TRIGGERS
-- =============================================================================

-- Trigger to automatically calculate word metadata
DELIMITER //
CREATE TRIGGER `trigger_hangman_words_metadata` 
BEFORE INSERT ON `hangman_words` 
FOR EACH ROW 
BEGIN
    -- Calculate length
    SET NEW.length = CHAR_LENGTH(NEW.word);
    
    -- Detect accents
    SET NEW.has_accents = CASE 
        WHEN NEW.word REGEXP '[ÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜŸÇ]' THEN 1 
        ELSE 0 
    END;
    
    -- Detect numbers
    SET NEW.has_numbers = CASE 
        WHEN NEW.word REGEXP '[0-9]' THEN 1 
        ELSE 0 
    END;
    
    -- Detect special characters (excluding accents and numbers)
    SET NEW.has_special_chars = CASE 
        WHEN NEW.word REGEXP '[^A-ZÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜŸÇ0-9 ]' THEN 1 
        ELSE 0 
    END;
    
    -- Automatically determine difficulty based on length and characters
    SET NEW.difficulty = CASE 
        WHEN NEW.length <= 5 AND NEW.has_accents = 0 AND NEW.has_numbers = 0 THEN 'easy'
        WHEN NEW.length >= 12 OR NEW.has_accents = 1 OR NEW.has_numbers = 1 THEN 'hard'
        ELSE 'medium'
    END;
END//

-- Trigger to update metadata on modification
CREATE TRIGGER `trigger_hangman_words_metadata_update` 
BEFORE UPDATE ON `hangman_words` 
FOR EACH ROW 
BEGIN
    -- Recalculate only if the word changes
    IF OLD.word != NEW.word THEN
        SET NEW.length = CHAR_LENGTH(NEW.word);
        
        SET NEW.has_accents = CASE 
            WHEN NEW.word REGEXP '[ÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜŸÇ]' THEN 1 
            ELSE 0 
        END;
        
        SET NEW.has_numbers = CASE 
            WHEN NEW.word REGEXP '[0-9]' THEN 1 
            ELSE 0 
        END;
        
        SET NEW.has_special_chars = CASE 
            WHEN NEW.word REGEXP '[^A-ZÀÁÂÄÈÉÊËÌÍÎÏÒÓÔÖÙÚÛÜŸÇ0-9 ]' THEN 1 
            ELSE 0 
        END;
        
        SET NEW.difficulty = CASE 
            WHEN NEW.length <= 5 AND NEW.has_accents = 0 AND NEW.has_numbers = 0 THEN 'easy'
            WHEN NEW.length >= 12 OR NEW.has_accents = 1 OR NEW.has_numbers = 1 THEN 'hard'
            ELSE 'medium'
        END;
    END IF;
END//

DELIMITER ;

-- =============================================================================
-- USEFUL VIEWS FOR THE APPLICATION
-- =============================================================================

-- View to retrieve categories with their statistics
CREATE VIEW `v_hangman_categories_stats` AS
SELECT 
    c.id,
    c.name,
    c.icon,
    c.slug,
    c.description,
    c.display_order,
    c.active,
    COUNT(m.id) as total_words,
    COUNT(CASE WHEN m.difficulty = 'easy' THEN 1 END) as easy_words,
    COUNT(CASE WHEN m.difficulty = 'medium' THEN 1 END) as medium_words,
    COUNT(CASE WHEN m.difficulty = 'hard' THEN 1 END) as hard_words,
    COUNT(CASE WHEN m.has_accents = 1 THEN 1 END) as words_with_accents,
    COUNT(CASE WHEN m.has_numbers = 1 THEN 1 END) as words_with_numbers,
    GROUP_CONCAT(t.name ORDER BY t.display_order ASC SEPARATOR ',') as tags
FROM `hangman_categories` c
LEFT JOIN `hangman_words` m ON c.id = m.category_id AND m.active = 1
LEFT JOIN `hangman_category_tag` ct ON c.id = ct.category_id  
LEFT JOIN `hangman_tags` t ON ct.tag_id = t.id AND t.active = 1
WHERE c.active = 1
GROUP BY c.id, c.name, c.icon, c.slug, c.description, c.display_order, c.active
ORDER BY c.display_order ASC, c.name ASC;

-- View to retrieve words with their categories and tags
CREATE VIEW `v_hangman_words_complete` AS
SELECT 
    m.id,
    m.word,
    m.difficulty,
    m.length,
    m.has_accents,
    m.has_numbers,
    m.has_special_chars,
    m.popularity,
    m.active,
    c.name as category_name,
    c.icon as category_icon,
    c.slug as category_slug,
    GROUP_CONCAT(t.name ORDER BY t.display_order ASC SEPARATOR ',') as category_tags
FROM `hangman_words` m
INNER JOIN `hangman_categories` c ON m.category_id = c.id
LEFT JOIN `hangman_category_tag` ct ON c.id = ct.category_id  
LEFT JOIN `hangman_tags` t ON ct.tag_id = t.id AND t.active = 1
WHERE m.active = 1 AND c.active = 1
GROUP BY m.id, m.word, m.difficulty, m.length, m.has_accents, m.has_numbers, 
         m.has_special_chars, m.popularity, m.active, c.name, c.icon, c.slug
ORDER BY c.display_order ASC, m.popularity DESC, m.word ASC;

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================

-- Composite index for frequent queries
CREATE INDEX `idx_words_category_active_difficulty` ON `hangman_words` (`category_id`, `active`, `difficulty`);
CREATE INDEX `idx_categories_active_display_order` ON `hangman_categories` (`active`, `display_order`);
CREATE INDEX `idx_tags_active_display_order` ON `hangman_tags` (`active`, `display_order`);

-- =============================================================================
-- END COMMENTS
-- =============================================================================

-- Schema update complete!
-- 
-- Next steps:
-- 1. Run this script on your MySQL server.
-- 2. Use the migration script to import JSON data.
-- 3. Configure the PHP API to access the data.
-- 
-- Features included:
-- ✅ Complete management of categories, words, and tags
-- ✅ Automatic difficulty system
-- ✅ Automatic detection of special characters
-- ✅ Optimized views for the application
-- ✅ Triggers to maintain consistency
-- ✅ Performance indexes
-- ✅ Referential integrity constraints
