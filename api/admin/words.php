<?php
/**
 * API ADMIN - Gestion des mots
 * Endpoints CRUD pour l'administration des mots
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
        handleGet($db);
        break;
        
    case 'POST':
        handlePost($db);
        break;
        
    case 'PUT':
        handlePut($db);
        break;
        
    case 'DELETE':
        handleDelete($db);
        break;
        
    default:
        sendErrorResponse(405, 'Method not allowed');
}

/**
 * GET - Récupérer les mots
 */
function handleGet($db) {
    try {
        // Paramètres de filtrage
        $categoryId = sanitizeInt($_GET['category_id'] ?? 0);
        $limit = sanitizeInt($_GET['limit'] ?? 100, 1, 1000);
        $offset = sanitizeInt($_GET['offset'] ?? 0, 0);
        $search = sanitizeString($_GET['search'] ?? '');
        
        // Construction de la requête
        $whereConditions = [];
        $params = [];
        
        if ($categoryId > 0) {
            $whereConditions[] = "w.category_id = ?";
            $params[] = $categoryId;
        }
        
        if (!empty($search)) {
            $whereConditions[] = "w.word LIKE ?";
            $params[] = "%$search%";
        }
        
        $whereClause = !empty($whereConditions) ? 'WHERE ' . implode(' AND ', $whereConditions) : '';
        
        $sql = "
            SELECT 
                w.*,
                c.name as category_name,
                c.icon as category_icon
            FROM hangman_words w
            LEFT JOIN hangman_categories c ON w.category_id = c.id
            $whereClause
            ORDER BY w.word ASC
            LIMIT $limit OFFSET $offset
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $words = $stmt->fetchAll();
        
        // Data processing
        foreach ($words as &$word) {
            $word['id'] = (int) $word['id'];
            $word['category_id'] = (int) $word['category_id'];
            $word['length'] = (int) $word['length'];
            $word['has_accents'] = (bool) $word['has_accents'];
            $word['has_numbers'] = (bool) $word['has_numbers'];
            $word['has_special_chars'] = (bool) $word['has_special_chars'];
        }
        
        // Compter le total pour la pagination
        $countSql = "
            SELECT COUNT(*) 
            FROM hangman_words w 
            LEFT JOIN hangman_categories c ON w.category_id = c.id
            $whereClause
        ";
        $countStmt = $db->prepare($countSql);
        $countStmt->execute($params);
        $total = $countStmt->fetchColumn();
        
        sendSuccessResponse($words, [
            'total' => (int) $total,
            'limit' => $limit,
            'offset' => $offset,
            'endpoint' => 'words'
        ]);
        
    } catch (PDOException $e) {
        sendErrorResponse(500, 'Database error', $e->getMessage());
    }
}

/**
 * POST - Create a new word
 */
function handlePost($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendErrorResponse(400, 'Entrée JSON invalide');
        return;
    }
    
    // Validation
    $word = sanitizeString($input['word'] ?? '');
    $categoryId = sanitizeInt($input['category_id'] ?? 0, 1);
    $difficulty = in_array($input['difficulty'] ?? '', ['easy', 'medium', 'hard']) ? 
                  $input['difficulty'] : 'medium';
    
    if (empty($word)) {
        sendErrorResponse(400, 'Le mot est requis');
        return;
    }
    
    if (!$categoryId) {
        sendErrorResponse(400, 'La catégorie est requise');
        return;
    }
    
    try {
        $db->beginTransaction();
        
        // Check if category exists
        $stmt = $db->prepare("SELECT COUNT(*) FROM hangman_categories WHERE id = ?");
        $stmt->execute([$categoryId]);
        if ($stmt->fetchColumn() == 0) {
            $db->rollBack();
            sendErrorResponse(404, 'Catégorie non trouvée');
            return;
        }
        
        // Check word uniqueness within the category
        $stmt = $db->prepare("SELECT COUNT(*) FROM hangman_words WHERE word = ? AND category_id = ?");
        $stmt->execute([$word, $categoryId]);
        if ($stmt->fetchColumn() > 0) {
            $db->rollBack();
            sendErrorResponse(409, 'Ce mot existe déjà dans cette catégorie');
            return;
        }
        
        // Analyze the word
        $analysis = analyzeWord($word);
        
        // Insert the word
        $stmt = $db->prepare("
            INSERT INTO hangman_words (
                word, category_id, difficulty, length,
                has_accents, has_numbers, has_special_chars
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $word,
            $categoryId,
            $difficulty,
            $analysis['length'],
            $analysis['has_accents'],
            $analysis['has_numbers'],
            $analysis['has_special_chars']
        ]);
        
        $wordId = $db->lastInsertId();
        $db->commit();
        
        // Retrieve created word
        $stmt = $db->prepare("
            SELECT 
                w.*,
                c.name as category_name,
                c.icon as category_icon
            FROM hangman_words w
            LEFT JOIN hangman_categories c ON w.category_id = c.id
            WHERE w.id = ?
        ");
        $stmt->execute([$wordId]);
        $word = $stmt->fetch();
        
        // Type conversion
        $word['id'] = (int) $word['id'];
        $word['category_id'] = (int) $word['category_id'];
        $word['length'] = (int) $word['length'];
        $word['has_accents'] = (bool) $word['has_accents'];
        $word['has_numbers'] = (bool) $word['has_numbers'];
        $word['has_special_chars'] = (bool) $word['has_special_chars'];
        
        sendSuccessResponse($word, [
            'message' => 'Mot créé avec succès',
            'created_id' => $wordId
        ]);
        
    } catch (PDOException $e) {
        $db->rollBack();
        error_log("PDOException in handlePost (words.php): " . $e->getMessage()); // Temporary log
        sendErrorResponse(500, 'Erreur lors de la création', $e->getMessage());
    }
}

/**
 * PUT - Update a word
 */
function handlePut($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['id'])) {
        sendErrorResponse(400, 'ID de mot requis');
        return;
    }
    
    $id = sanitizeInt($input['id'], 1);
    if (!$id) {
        sendErrorResponse(400, 'ID invalide');
        return;
    }
    
    // Validation
    $word = sanitizeString($input['word'] ?? '');
    $categoryId = sanitizeInt($input['category_id'] ?? 0, 1);
    $difficulty = in_array($input['difficulty'] ?? '', ['easy', 'medium', 'hard']) ? 
                  $input['difficulty'] : 'medium';
    
    if (empty($word)) {
        sendErrorResponse(400, 'Le mot est requis');
        return;
    }
    
    if (!$categoryId) {
        sendErrorResponse(400, 'La catégorie est requise');
        return;
    }
    
    try {
        $db->beginTransaction();
        
        // Check if word exists
        $stmt = $db->prepare("SELECT word FROM hangman_words WHERE id = ?");
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            $db->rollBack();
            sendErrorResponse(404, 'Mot non trouvé');
            return;
        }
        
        // Check if category exists
        $stmt = $db->prepare("SELECT COUNT(*) FROM hangman_categories WHERE id = ?");
        $stmt->execute([$categoryId]);
        if ($stmt->fetchColumn() == 0) {
            $db->rollBack();
            sendErrorResponse(404, 'Catégorie non trouvée');
            return;
        }
        
        // Check word uniqueness (except for the current word)
        $stmt = $db->prepare("SELECT COUNT(*) FROM hangman_words WHERE word = ? AND category_id = ? AND id != ?");
        $stmt->execute([$word, $categoryId, $id]);
        if ($stmt->fetchColumn() > 0) {
            $db->rollBack();
            sendErrorResponse(409, 'Ce mot existe déjà dans cette catégorie');
            return;
        }
        
        // Analyze the word
        $analysis = analyzeWord($word);
        
        // Update the word
        $stmt = $db->prepare("
            UPDATE hangman_words 
            SET 
                word = ?, 
                category_id = ?, 
                difficulty = ?,
                length = ?,
                has_accents = ?,
                has_numbers = ?,
                has_special_chars = ?,
                updated_at = NOW()
            WHERE id = ?
        ");
        
        $stmt->execute([
            $word,
            $categoryId,
            $difficulty,
            $analysis['length'],
            $analysis['has_accents'],
            $analysis['has_numbers'],
            $analysis['has_special_chars'],
            $id
        ]);
        
        $db->commit();
        
        sendSuccessResponse(['id' => $id], [
            'message' => 'Mot mis à jour avec succès'
        ]);
        
    } catch (PDOException $e) {
        $db->rollBack();
        sendErrorResponse(500, 'Erreur lors de la mise à jour', $e->getMessage());
    }
}

/**
 * DELETE - Delete a word
 */
function handleDelete($db) {
    $id = sanitizeInt($_GET['id'] ?? 0, 1);
    
    if (!$id) {
        sendErrorResponse(400, 'ID de mot requis');
        return;
    }
    
    try {
        // Check if word exists
        $stmt = $db->prepare("SELECT word FROM hangman_words WHERE id = ?");
        $stmt->execute([$id]);
        $word = $stmt->fetch();
        
        if (!$word) {
            sendErrorResponse(404, 'Mot non trouvé');
            return;
        }
        
        // Delete the word
        $stmt = $db->prepare("DELETE FROM hangman_words WHERE id = ?");
        $stmt->execute([$id]);
        
        sendSuccessResponse(['id' => $id], [
            'message' => "Mot '{$word['word']}' supprimé avec succès"
        ]);
        
    } catch (PDOException $e) {
        sendErrorResponse(500, 'Erreur lors de la suppression', $e->getMessage());
    }
}

/**
 * Analyse d'un mot pour extraire ses caractéristiques
 */
function analyzeWord($mot) {
    $mot = strtoupper($mot);
    $longueur = mb_strlen($mot, 'UTF-8');
    
    // Détection des accents
    $hasAccents = preg_match('/[ÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ]/u', $mot);
    
    // Détection des chiffres
    $hasNumbers = preg_match('/[0-9]/', $mot);
    
    // Détection des caractères spéciaux (hors lettres, accents, chiffres)
    $hasSpecialChars = preg_match('/[^A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ0-9]/u', $mot);
    
    // Comptage des voyelles et consonnes
    $voyelles = preg_match_all('/[AEIOUYÀÂÄÉÈÊËÏÎÔÖÙÛÜŸ]/u', $mot);
    $consonnes = preg_match_all('/[BCDFGHJKLMNPQRSTVWXZÇ]/u', $mot);
    
    return [
        'length' => $longueur,
        'has_accents' => $hasAccents ? 1 : 0,
        'has_numbers' => $hasNumbers ? 1 : 0,
        'has_special_chars' => $hasSpecialChars ? 1 : 0
    ];
}
?>