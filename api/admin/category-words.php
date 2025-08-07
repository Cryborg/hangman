<?php
/**
 * API ADMIN - Gestion des mots par catégorie
 * Endpoint pour récupérer et gérer les mots d'une catégorie spécifique
 * 
 * GET /api/admin/category-words.php?category_id=X - Récupérer les mots d'une catégorie
 * POST /api/admin/category-words.php - Ajouter un mot à une catégorie
 * PUT /api/admin/category-words.php - Modifier un mot
 * DELETE /api/admin/category-words.php - Supprimer un mot
 * 
 * @version 1.0.0
 */

require_once '../config.php';
require_once __DIR__ . '/auth.php';

// Vérifier l'authentification
AdminAuth::requireAuth();

$db = Database::getInstance()->getConnection();

// Traitement selon la méthode HTTP
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        handleGetWords($db);
        break;
        
    case 'POST':
        handleAddWord($db);
        break;
        
    case 'PUT':
        handleUpdateWord($db);
        break;
        
    case 'DELETE':
        handleDeleteWord($db);
        break;
        
    default:
        sendErrorResponse(405, 'Method not allowed');
}

/**
 * GET - Récupérer les mots d'une catégorie
 */
function handleGetWords($db) {
    $categoryId = $_GET['category_id'] ?? null;
    
    if (!$categoryId) {
        sendErrorResponse(400, 'Parameter category_id is required');
        return;
    }
    
    try {
        // Vérifier que la catégorie existe
        $categoryStmt = $db->prepare("
            SELECT id, name, icon, slug 
            FROM hangman_categories 
            WHERE id = ? AND active = 1
        ");
        $categoryStmt->execute([$categoryId]);
        $category = $categoryStmt->fetch();
        
        if (!$category) {
            sendErrorResponse(404, 'Category not found');
            return;
        }
        
        // Récupérer les mots de la catégorie avec pagination
        $page = (int) ($_GET['page'] ?? 1);
        $limit = (int) ($_GET['limit'] ?? 50);
        $offset = ($page - 1) * $limit;
        $search = $_GET['search'] ?? '';
        
        // Construction de la requête avec recherche optionnelle
        $whereClause = "w.category_id = ? AND w.active = 1";
        $params = [$categoryId];
        
        if ($search) {
            $whereClause .= " AND w.word LIKE ?";
            $params[] = "%{$search}%";
        }
        
        // Compter le total
        $countStmt = $db->prepare("
            SELECT COUNT(*) 
            FROM hangman_words w 
            WHERE {$whereClause}
        ");
        $countStmt->execute($params);
        $totalWords = $countStmt->fetchColumn();
        
        // Récupérer les mots
        $wordsStmt = $db->prepare("
            SELECT 
                w.id, w.word, w.difficulty, w.length,
                w.has_accents, w.has_numbers, w.has_special_chars,
                w.popularity, w.active, w.created_at, w.updated_at
            FROM hangman_words w 
            WHERE {$whereClause}
            ORDER BY w.word ASC
            LIMIT ? OFFSET ?
        ");
        $params[] = $limit;
        $params[] = $offset;
        $wordsStmt->execute($params);
        $words = $wordsStmt->fetchAll();
        
        // Post-traitement des données
        foreach ($words as &$word) {
            $word['id'] = (int) $word['id'];
            $word['length'] = (int) $word['length'];
            $word['popularity'] = (int) $word['popularity'];
            $word['active'] = (bool) $word['active'];
            $word['has_accents'] = (bool) $word['has_accents'];
            $word['has_numbers'] = (bool) $word['has_numbers'];
            $word['has_special_chars'] = (bool) $word['has_special_chars'];
        }
        
        // Statistiques de la catégorie
        $statsStmt = $db->prepare("
            SELECT 
                COUNT(*) as total_words,
                COUNT(CASE WHEN difficulty = 'easy' THEN 1 END) as easy_words,
                COUNT(CASE WHEN difficulty = 'medium' THEN 1 END) as medium_words,
                COUNT(CASE WHEN difficulty = 'hard' THEN 1 END) as hard_words,
                COUNT(CASE WHEN has_accents = 1 THEN 1 END) as words_with_accents,
                COUNT(CASE WHEN has_numbers = 1 THEN 1 END) as words_with_numbers
            FROM hangman_words 
            WHERE category_id = ? AND active = 1
        ");
        $statsStmt->execute([$categoryId]);
        $stats = $statsStmt->fetch();
        
        // Réponse
        $response = [
            'category' => [
                'id' => (int) $category['id'],
                'name' => $category['name'],
                'icon' => $category['icon'],
                'slug' => $category['slug']
            ],
            'words' => $words,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => (int) $totalWords,
                'total_pages' => ceil($totalWords / $limit),
                'has_more' => ($offset + $limit) < $totalWords
            ],
            'stats' => [
                'total_words' => (int) $stats['total_words'],
                'easy_words' => (int) $stats['easy_words'],
                'medium_words' => (int) $stats['medium_words'],
                'hard_words' => (int) $stats['hard_words'],
                'words_with_accents' => (int) $stats['words_with_accents'],
                'words_with_numbers' => (int) $stats['words_with_numbers']
            ],
            'search' => $search
        ];
        
        sendSuccessResponse($response);
        
    } catch (PDOException $e) {
        sendErrorResponse(500, 'Database error occurred', $e->getMessage());
    }
}

/**
 * POST - Ajouter un mot à une catégorie
 */
function handleAddWord($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['word']) || !isset($input['category_id'])) {
        sendErrorResponse(400, 'Missing required fields: word, category_id');
        return;
    }
    
    try {
        $word = strtoupper(trim($input['word']));
        $categoryId = (int) $input['category_id'];
        $difficulty = $input['difficulty'] ?? 'medium';
        
        // Vérifier que la catégorie existe
        $categoryStmt = $db->prepare("SELECT id FROM hangman_categories WHERE id = ? AND active = 1");
        $categoryStmt->execute([$categoryId]);
        if (!$categoryStmt->fetch()) {
            sendErrorResponse(404, 'Category not found');
            return;
        }
        
        // Vérifier que le mot n'existe pas déjà dans cette catégorie
        $existingStmt = $db->prepare("SELECT id FROM hangman_words WHERE word = ? AND category_id = ?");
        $existingStmt->execute([$word, $categoryId]);
        if ($existingStmt->fetch()) {
            sendErrorResponse(409, 'Word already exists in this category');
            return;
        }
        
        // Insérer le nouveau mot (les triggers calculent automatiquement les métadonnées)
        $insertStmt = $db->prepare("
            INSERT INTO hangman_words (word, category_id, difficulty) 
            VALUES (?, ?, ?)
        ");
        $insertStmt->execute([$word, $categoryId, $difficulty]);
        
        $newWordId = $db->lastInsertId();
        
        // Récupérer le mot créé avec toutes ses métadonnées
        $newWordStmt = $db->prepare("
            SELECT id, word, difficulty, length, has_accents, has_numbers, has_special_chars, popularity, active
            FROM hangman_words 
            WHERE id = ?
        ");
        $newWordStmt->execute([$newWordId]);
        $newWord = $newWordStmt->fetch();
        
        // Post-traitement
        $newWord['id'] = (int) $newWord['id'];
        $newWord['length'] = (int) $newWord['length'];
        $newWord['popularity'] = (int) $newWord['popularity'];
        $newWord['active'] = (bool) $newWord['active'];
        $newWord['has_accents'] = (bool) $newWord['has_accents'];
        $newWord['has_numbers'] = (bool) $newWord['has_numbers'];
        $newWord['has_special_chars'] = (bool) $newWord['has_special_chars'];
        
        sendSuccessResponse([
            'word' => $newWord,
            'message' => 'Word added successfully'
        ]);
        
    } catch (PDOException $e) {
        sendErrorResponse(500, 'Database error occurred', $e->getMessage());
    }
}

/**
 * PUT - Modifier un mot
 */
function handleUpdateWord($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['id'])) {
        sendErrorResponse(400, 'Missing required field: id');
        return;
    }
    
    try {
        $wordId = (int) $input['id'];
        
        // Vérifier que le mot existe
        $existingStmt = $db->prepare("SELECT * FROM hangman_words WHERE id = ?");
        $existingStmt->execute([$wordId]);
        $existingWord = $existingStmt->fetch();
        
        if (!$existingWord) {
            sendErrorResponse(404, 'Word not found');
            return;
        }
        
        // Préparer les champs à mettre à jour
        $updates = [];
        $params = [];
        
        if (isset($input['word'])) {
            $updates[] = "word = ?";
            $params[] = strtoupper(trim($input['word']));
        }
        
        if (isset($input['difficulty'])) {
            $updates[] = "difficulty = ?";
            $params[] = $input['difficulty'];
        }
        
        if (isset($input['popularity'])) {
            $updates[] = "popularity = ?";
            $params[] = (int) $input['popularity'];
        }
        
        if (isset($input['active'])) {
            $updates[] = "active = ?";
            $params[] = $input['active'] ? 1 : 0;
        }
        
        if (empty($updates)) {
            sendErrorResponse(400, 'No fields to update');
            return;
        }
        
        $params[] = $wordId;
        
        // Exécuter la mise à jour
        $updateStmt = $db->prepare("
            UPDATE hangman_words 
            SET " . implode(', ', $updates) . "
            WHERE id = ?
        ");
        $updateStmt->execute($params);
        
        // Récupérer le mot mis à jour
        $updatedStmt = $db->prepare("
            SELECT id, word, difficulty, length, has_accents, has_numbers, has_special_chars, popularity, active
            FROM hangman_words 
            WHERE id = ?
        ");
        $updatedStmt->execute([$wordId]);
        $updatedWord = $updatedStmt->fetch();
        
        // Post-traitement
        $updatedWord['id'] = (int) $updatedWord['id'];
        $updatedWord['length'] = (int) $updatedWord['length'];
        $updatedWord['popularity'] = (int) $updatedWord['popularity'];
        $updatedWord['active'] = (bool) $updatedWord['active'];
        $updatedWord['has_accents'] = (bool) $updatedWord['has_accents'];
        $updatedWord['has_numbers'] = (bool) $updatedWord['has_numbers'];
        $updatedWord['has_special_chars'] = (bool) $updatedWord['has_special_chars'];
        
        sendSuccessResponse([
            'word' => $updatedWord,
            'message' => 'Word updated successfully'
        ]);
        
    } catch (PDOException $e) {
        sendErrorResponse(500, 'Database error occurred', $e->getMessage());
    }
}

/**
 * DELETE - Supprimer un mot
 */
function handleDeleteWord($db) {
    $wordId = $_GET['id'] ?? null;
    
    if (!$wordId) {
        sendErrorResponse(400, 'Parameter id is required');
        return;
    }
    
    try {
        // Vérifier que le mot existe
        $existingStmt = $db->prepare("SELECT word FROM hangman_words WHERE id = ?");
        $existingStmt->execute([$wordId]);
        $existingWord = $existingStmt->fetch();
        
        if (!$existingWord) {
            sendErrorResponse(404, 'Word not found');
            return;
        }
        
        // Supprimer le mot
        $deleteStmt = $db->prepare("DELETE FROM hangman_words WHERE id = ?");
        $deleteStmt->execute([$wordId]);
        
        sendSuccessResponse([
            'message' => 'Word deleted successfully',
            'deleted_word' => $existingWord['word']
        ]);
        
    } catch (PDOException $e) {
        sendErrorResponse(500, 'Database error occurred', $e->getMessage());
    }
}
?>