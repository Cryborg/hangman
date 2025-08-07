-- Migration pour ajouter des pays de niveau Hard
-- Ajout de vrais pays difficiles (les républiques d'Asie centrale)

-- D'abord, insérer les nouveaux pays s'ils n'existent pas
INSERT INTO hangman_words (word, category_id, difficulty, active, popularity) 
SELECT word, (SELECT id FROM hangman_categories WHERE name = 'Pays'), 'hard', 1, 0
FROM (
    SELECT 'AZERBAÏDJAN' as word UNION
    SELECT 'KIRGHIZISTAN' UNION
    SELECT 'OUZBÉKISTAN' UNION
    SELECT 'TURKMÉNISTAN' UNION
    SELECT 'TADJIKISTAN'
) AS new_words
WHERE NOT EXISTS (
    SELECT 1 FROM hangman_words w2 
    WHERE w2.word = new_words.word 
    AND w2.category_id = (SELECT id FROM hangman_categories WHERE name = 'Pays')
);

-- Ensuite, s'assurer qu'ils sont bien en niveau Hard
UPDATE hangman_words 
SET difficulty = 'hard' 
WHERE category_id = (SELECT id FROM hangman_categories WHERE name = 'Pays')
AND word IN (
    'AZERBAÏDJAN',
    'KIRGHIZISTAN',
    'OUZBÉKISTAN', 
    'TURKMÉNISTAN',
    'TADJIKISTAN'
);

-- Cette migration corrige le problème de la catégorie Pays qui n'avait aucun mot Hard
-- Après migration : 8 Easy, 20 Medium, 5 Hard (les vrais pays difficiles !)