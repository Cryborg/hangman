-- Supprimer les colonnes display_order et description qui ne sont pas utilisées
-- Pour hangman_categories
ALTER TABLE hangman_categories DROP COLUMN display_order;
ALTER TABLE hangman_categories DROP COLUMN description;

-- Pour hangman_tags  
ALTER TABLE hangman_tags DROP COLUMN display_order;
ALTER TABLE hangman_tags DROP COLUMN description;