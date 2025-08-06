<?php
/**
 * API Endpoint: Récupération des mots
 * 
 * GET /api/words.php?category=1 - Mots d'une catégorie
 * GET /api/words.php?category=animaux - Mots d'une catégorie (par slug)
 * GET /api/words.php?random=true&category=1 - Mot aléatoire d'une catégorie
 * GET /api/words.php?difficulty=facile&category=1 - Mots par difficulté
 * GET /api/words.php?length=5-8&category=1 - Mots par longueur (min-max)
 * GET /api/words.php?accents=true&category=1 - Filtrer par accents
 * GET /api/words.php?numbers=true&category=1 - Filtrer par chiffres
 * GET /api/words.php?limit=10&category=1 - Limiter le nombre de résultats
 * 
 * @version 1.0.0
 */

require_once 'config.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Paramètres obligatoires
    validateRequest(['category']);
    
    // Paramètres de requête
    $category = sanitizeString($_GET['category']);
    $random = isset($_GET['random']) && $_GET['random'] === 'true';
    $difficulty = isset($_GET['difficulty']) ? sanitizeString($_GET['difficulty']) : null;
    $lengthRange = isset($_GET['length']) ? sanitizeString($_GET['length']) : null;
    $withAccents = isset($_GET['accents']) ? ($_GET['accents'] === 'true') : null;
    $withNumbers = isset($_GET['numbers']) ? ($_GET['numbers'] === 'true') : null;
    $limit = isset($_GET['limit']) ? sanitizeInt($_GET['limit'], 1, 1000) : null;
    
    // Déterminer si la catégorie est un ID ou un slug
    $categoryId = null;
    if (is_numeric($category)) {
        $categoryId = (int) $category;
    } else {
        // Récupérer l'ID par le slug
        $slugQuery = "SELECT id FROM hangman_categories WHERE slug = :slug AND active = 1";
        $slugStmt = $db->prepare($slugQuery);
        $slugStmt->execute(['slug' => $category]);
        $categoryData = $slugStmt->fetch();
        
        if (!$categoryData) {
            sendErrorResponse(404, 'Category not found');
            exit();
        }
        
        $categoryId = (int) $categoryData['id'];
    }
    
    // Construction de la requête SQL
    $sql = "SELECT w.id, w.mot, w.difficulte, w.longueur, w.contient_accents, w.contient_chiffres, 
                   w.contient_special, w.popularite, c.nom as category_nom, c.icone as category_icone
            FROM hangman_words w
            INNER JOIN hangman_categories c ON w.category_id = c.id
            WHERE w.category_id = :category_id AND w.active = 1 AND c.active = 1";
    
    $params = ['category_id' => $categoryId];
    
    // Filtres conditionnels
    if ($difficulty !== null) {
        $allowedDifficulties = ['facile', 'moyen', 'difficile'];
        if (!in_array($difficulty, $allowedDifficulties)) {
            sendErrorResponse(400, 'Invalid difficulty. Allowed values: ' . implode(', ', $allowedDifficulties));
            exit();
        }
        $sql .= " AND w.difficulte = :difficulty";
        $params['difficulty'] = $difficulty;
    }
    
    if ($lengthRange !== null) {
        if (preg_match('/^(\d+)-(\d+)$/', $lengthRange, $matches)) {
            $minLength = (int) $matches[1];
            $maxLength = (int) $matches[2];
            if ($minLength <= $maxLength && $minLength > 0 && $maxLength <= 100) {
                $sql .= " AND w.longueur BETWEEN :min_length AND :max_length";
                $params['min_length'] = $minLength;
                $params['max_length'] = $maxLength;
            } else {
                sendErrorResponse(400, 'Invalid length range format. Use: min-max (e.g., 5-8)');
                exit();
            }
        } else {
            sendErrorResponse(400, 'Invalid length range format. Use: min-max (e.g., 5-8)');
            exit();
        }
    }
    
    if ($withAccents !== null) {
        $sql .= " AND w.contient_accents = :with_accents";
        $params['with_accents'] = $withAccents ? 1 : 0;
    }
    
    if ($withNumbers !== null) {
        $sql .= " AND w.contient_chiffres = :with_numbers";
        $params['with_numbers'] = $withNumbers ? 1 : 0;
    }
    
    // Ordre et limitation
    if ($random) {
        $sql .= " ORDER BY RAND()";
        if (!$limit) {
            $limit = 1; // Par défaut, un seul mot aléatoire
        }
    } else {
        $sql .= " ORDER BY w.popularite DESC, w.mot ASC";
    }
    
    if ($limit !== null) {
        $sql .= " LIMIT :limit";
        $params['limit'] = $limit;
    }
    
    // Exécuter la requête
    $stmt = $db->prepare($sql);
    
    // Bind des paramètres (PDO nécessite un traitement spécial pour LIMIT)
    foreach ($params as $key => $value) {
        if ($key === 'limit') {
            $stmt->bindValue(":$key", $value, PDO::PARAM_INT);
        } else {
            $stmt->bindValue(":$key", $value);
        }
    }
    
    $stmt->execute();
    $words = $stmt->fetchAll();
    
    if (empty($words)) {
        sendErrorResponse(404, 'No words found with the specified criteria');
        exit();
    }
    
    // Post-traitement des résultats
    foreach ($words as &$word) {
        // Convertir les valeurs numériques
        $word['id'] = (int) $word['id'];
        $word['longueur'] = (int) $word['longueur'];
        $word['popularite'] = (int) $word['popularite'];
        
        // Convertir les booléens
        $word['contient_accents'] = (bool) $word['contient_accents'];
        $word['contient_chiffres'] = (bool) $word['contient_chiffres'];
        $word['contient_special'] = (bool) $word['contient_special'];
    }
    
    // Préparer les métadonnées
    $meta = [
        'category_id' => $categoryId,
        'filters_applied' => []
    ];
    
    if ($difficulty) {
        $meta['filters_applied']['difficulty'] = $difficulty;
    }
    
    if ($lengthRange) {
        $meta['filters_applied']['length_range'] = $lengthRange;
    }
    
    if ($withAccents !== null) {
        $meta['filters_applied']['with_accents'] = $withAccents;
    }
    
    if ($withNumbers !== null) {
        $meta['filters_applied']['with_numbers'] = $withNumbers;
    }
    
    if ($random) {
        $meta['random_selection'] = true;
    }
    
    // Retourner le résultat
    if ($random && count($words) === 1) {
        // Retourner un seul mot aléatoire
        sendSuccessResponse($words[0], $meta);
    } else {
        // Retourner la liste des mots
        sendSuccessResponse($words, $meta);
    }
    
} catch (PDOException $e) {
    sendErrorResponse(500, 'Database error occurred', $e->getMessage());
} catch (Exception $e) {
    sendErrorResponse(500, 'An unexpected error occurred', $e->getMessage());
}
?>