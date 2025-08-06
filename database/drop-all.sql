-- =============================================================================
-- HANGMAN GAME - DROP ALL TABLES SCRIPT
-- =============================================================================
-- WARNING: This script will completely drop all tables and data!
-- Use with extreme caution in production environments.
-- =============================================================================

-- Disable foreign key checks to allow dropping tables with dependencies
SET FOREIGN_KEY_CHECKS = 0;

-- Drop all views first (if they exist)
DROP VIEW IF EXISTS `v_hangman_words_complete`;
DROP VIEW IF EXISTS `v_hangman_categories_stats`;

-- Drop all tables
DROP TABLE IF EXISTS `hangman_word_tags`;
DROP TABLE IF EXISTS `hangman_category_tag`;
DROP TABLE IF EXISTS `hangman_words`;
DROP TABLE IF EXISTS `hangman_categories`;
DROP TABLE IF EXISTS `hangman_tags`;
DROP TABLE IF EXISTS `hangman_game_stats`;
DROP TABLE IF EXISTS `hangman_user_progress`;
DROP TABLE IF EXISTS `hangman_sessions`;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Optional: Drop the entire database (uncomment if needed)
-- DROP DATABASE IF EXISTS `hangman_db`;

-- Confirmation message
SELECT 'All tables have been successfully dropped!' AS status;