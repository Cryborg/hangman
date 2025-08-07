-- Migration rapide pour les niveaux de difficulté - version simple
-- Mise à jour des mots existants selon leur complexité

-- ANIMAUX
-- Easy: mots simples, familiers pour enfants  
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'CHIEN', 'CHEVAL', 'VACHE', 'COCHON', 'MOUTON', 'POULE', 'CANARD', 'LAPIN', 'SOURIS', 'TIGRE'
);

-- Medium: animaux plus exotiques
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'ÉLÉPHANT', 'GIRAFE', 'ZÈBRE', 'RENARD', 'SINGE', 'DAUPHIN', 'BALEINE', 'REQUIN', 'AIGLE', 'CORBEAU', 'HIBOU', 'SERPENT', 'TORTUE'
);

-- Hard: mots longs ou très complexes
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'KANGOUROU', 'GRENOUILLE', 'PAPILLON'
);

-- FRUITS ET LÉGUMES  
-- Easy: fruits très communs
UPDATE hangman_words SET difficulty = 'easy' WHERE word IN (
    'POMME', 'BANANE', 'ORANGE', 'FRAISE', 'CERISE', 'RAISIN', 'POIRE', 'PÊCHE', 'PRUNE', 'CAROTTE', 'TOMATE', 'SALADE', 'RADIS', 'OIGNON', 'CITRON'
);

-- Medium: plus longs ou moins familiers  
UPDATE hangman_words SET difficulty = 'medium' WHERE word IN (
    'ANANAS', 'COURGETTE', 'AUBERGINE', 'POIVRON', 'CONCOMBRE', 'BROCOLI', 'ÉPINARD', 'HARICOT', 'AVOCAT'
);

-- Hard: mots composés
UPDATE hangman_words SET difficulty = 'hard' WHERE word IN (
    'POMME DE TERRE', 'PETIT POIS', 'CHAMPIGNON'
);

-- Vérification finale
SELECT difficulty, COUNT(*) as nombre_mots 
FROM hangman_words 
GROUP BY difficulty 
ORDER BY difficulty;