-- Migration pour ajouter des pays de niveau Hard
-- Reclassification de certains pays medium en hard pour équilibrer

UPDATE hangman_words 
SET difficulty = 'hard' 
WHERE category_id = (SELECT id FROM hangman_categories WHERE name = 'Pays')
AND word IN (
    'AUSTRALIE',
    'DANEMARK', 
    'COLOMBIE',
    'ARGENTINE',
    'PORTUGAL'
);

-- Cette migration corrige le problème de la catégorie Pays qui n'avait aucun mot Hard
-- Après migration : 8 Easy, 15 Medium, 5 Hard