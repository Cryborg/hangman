<?php
/**
 * API ADMIN - Gestion des catégories
 * Endpoints CRUD pour l'administration des catégories
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
 * GET - Retrieve categories
 */
function handleGet($db) {
    try {
        $sql = "
            SELECT 
                c.id, c.name, c.icon, c.slug, c.description, c.display_order, c.active, c.created_at, c.updated_at,
                COUNT(w.id) as words_count,
                GROUP_CONCAT(DISTINCT t.name) as tags
            FROM hangman_categories c
            LEFT JOIN hangman_words w ON c.id = w.category_id
            LEFT JOIN hangman_category_tag ct ON c.id = ct.category_id
            LEFT JOIN hangman_tags t ON ct.tag_id = t.id
            GROUP BY c.id
            ORDER BY c.display_order ASC, c.name ASC
        ";
        
        $stmt = $db->query($sql);
        $categories = $stmt->fetchAll();
        
        // Data processing
        foreach ($categories as &$category) {
            $category['words_count'] = (int) $category['words_count'];
            $category['tags'] = $category['tags'] ? explode(',', $category['tags']) : [];
            $category['display_order'] = (int) $category['display_order'];
            $category['created_at'] = $category['created_at'] ?? null;
            $category['updated_at'] = $category['updated_at'] ?? null;
        }
        
        sendSuccessResponse($categories, [
            'total' => count($categories),
            'endpoint' => 'categories'
        ]);
        
    } catch (PDOException $e) {
        sendErrorResponse(500, 'Database error', $e->getMessage());
    }
}

/**
 * POST - Créer une nouvelle catégorie
 */
function handlePost($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendErrorResponse(400, 'Entrée JSON invalide');
        return;
    }
    
    // Validation
    $name = sanitizeString($input['name'] ?? '');
    $slug = sanitizeString($input['slug'] ?? '');
    $icon = sanitizeString($input['icon'] ?? '📁');
    $display_order = sanitizeInt($input['display_order'] ?? 0, 0, 9999);
    $tags = $input['tags'] ?? [];
    
    if (empty($name)) {
        sendErrorResponse(400, 'Le nom de la catégorie est requis');
        return;
    }
    
    // Generate slug if absent
    if (empty($slug)) {
        $slug = generateSlug($name);
    }
    
    try {
        $db->beginTransaction();
        
        // Check slug uniqueness
        $stmt = $db->prepare("SELECT COUNT(*) FROM hangman_categories WHERE slug = ?");
        $stmt->execute([$slug]);
        if ($stmt->fetchColumn() > 0) {
            $db->rollBack();
            sendErrorResponse(409, 'Ce slug existe déjà');
            return;
        }
        
        // Insert category
        $stmt = $db->prepare("
            INSERT INTO hangman_categories (name, slug, icon, display_order) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$name, $slug, $icon, $display_order]);
        $categoryId = $db->lastInsertId();
        
        // Associate tags
        if (!empty($tags)) {
            $tagStmt = $db->prepare("
                INSERT INTO hangman_category_tag (category_id, tag_id) 
                VALUES (?, ?)
            ");
            foreach ($tags as $tagId) {
                $tagStmt->execute([$categoryId, $tagId]);
            }
        }
        
        $db->commit();
        
        // Retrieve created category
        $stmt = $db->prepare("
            SELECT 
                c.*,
                COUNT(w.id) as words_count
            FROM hangman_categories c
            LEFT JOIN hangman_words w ON c.id = w.category_id
            WHERE c.id = ?
            GROUP BY c.id
        ");
        $stmt->execute([$categoryId]);
        $category = $stmt->fetch();
        
        $category['words_count'] = (int) $category['words_count'];
        $category['display_order'] = (int) $category['display_order'];
        
        sendSuccessResponse($category, [
            'message' => 'Catégorie créée avec succès',
            'created_id' => $categoryId
        ]);
        
    } catch (PDOException $e) {
        $db->rollBack();
        sendErrorResponse(500, 'Erreur lors de la création', $e->getMessage());
    }
}

/**
 * PUT - Mettre à jour une catégorie
 */
function handlePut($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['id'])) {
        sendErrorResponse(400, 'ID de catégorie requis');
        return;
    }
    
    $id = sanitizeInt($input['id'], 1);
    if (!$id) {
        sendErrorResponse(400, 'ID invalide');
        return;
    }
    
    // Validation
    $name = sanitizeString($input['name'] ?? '');
    $slug = sanitizeString($input['slug'] ?? '');
    $icon = sanitizeString($input['icon'] ?? '📁');
    $display_order = sanitizeInt($input['display_order'] ?? 0, 0, 9999);
    $tags = $input['tags'] ?? [];
    
    if (empty($name)) {
        sendErrorResponse(400, 'Le nom de la catégorie est requis');
        return;
    }
    
    // Generate slug if empty
    if (empty($slug)) {
        $slug = generateSlug($name);
    }
    
    try {
        $db->beginTransaction();
        
        // Check if category exists
        $stmt = $db->prepare("SELECT COUNT(*) FROM hangman_categories WHERE id = ?");
        $stmt->execute([$id]);
        if ($stmt->fetchColumn() == 0) {
            $db->rollBack();
            sendErrorResponse(404, 'Catégorie non trouvée');
            return;
        }
        
        // Check slug uniqueness (except for the current category)
        $stmt = $db->prepare("SELECT COUNT(*) FROM hangman_categories WHERE slug = ? AND id != ?");
        $stmt->execute([$slug, $id]);
        if ($stmt->fetchColumn() > 0) {
            $db->rollBack();
            sendErrorResponse(409, 'Ce slug existe déjà');
            return;
        }
        
        // Update category
        $stmt = $db->prepare("
            UPDATE hangman_categories 
            SET name = ?, slug = ?, icon = ?, display_order = ?, updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$name, $slug, $icon, $display_order, $id]);
        
        // Delete old tag associations
        $stmt = $db->prepare("DELETE FROM hangman_category_tag WHERE category_id = ?");
        $stmt->execute([$id]);
        
        // Add new associations
        if (!empty($tags)) {
            $tagStmt = $db->prepare("
                INSERT INTO hangman_category_tag (category_id, tag_id) 
                VALUES (?, ?)
            ");
            foreach ($tags as $tagId) {
                $tagStmt->execute([$id, $tagId]);
            }
        }
        
        $db->commit();
        
        sendSuccessResponse(['id' => $id], [
            'message' => 'Catégorie mise à jour avec succès'
        ]);
        
    } catch (PDOException $e) {
        $db->rollBack();
        sendErrorResponse(500, 'Erreur lors de la mise à jour', $e->getMessage());
    }
}

/**
 * DELETE - Delete a category
 */
function handleDelete($db) {
    $id = sanitizeInt($_GET['id'] ?? 0, 1);
    
    if (!$id) {
        sendErrorResponse(400, 'ID de catégorie requis');
        return;
    }
    
    try {
        $db->beginTransaction();
        
        // Check if category exists
        $stmt = $db->prepare("SELECT name FROM hangman_categories WHERE id = ?");
        $stmt->execute([$id]);
        $category = $stmt->fetch();
        
        if (!$category) {
            $db->rollBack();
            sendErrorResponse(404, 'Catégorie non trouvée');
            return;
        }
        
        // Check if there are words in this category
        $stmt = $db->prepare("SELECT COUNT(*) FROM hangman_words WHERE category_id = ?");
        $stmt->execute([$id]);
        $wordsCount = $stmt->fetchColumn();
        
        if ($wordsCount > 0) {
            $db->rollBack();
            sendErrorResponse(409, "Impossible de supprimer: cette catégorie contient $wordsCount mot(s)");
            return;
        }
        
        // Delete tag associations
        $stmt = $db->prepare("DELETE FROM hangman_category_tag WHERE category_id = ?");
        $stmt->execute([$id]);
        
        // Delete the category
        $stmt = $db->prepare("DELETE FROM hangman_categories WHERE id = ?");
        $stmt->execute([$id]);
        
        $db->commit();
        
        sendSuccessResponse(['id' => $id], [
            'message' => "Catégorie '{$category['name']}' supprimée avec succès"
        ]);
        
    } catch (PDOException $e) {
        $db->rollBack();
        sendErrorResponse(500, 'Erreur lors de la suppression', $e->getMessage());
    }
}

/**
 * Génération d'un slug à partir d'un nom
 */
function generateSlug($name) {
    $slug = strtolower(trim($name));
    $slug = preg_replace('/[àáâãäå]/u', 'a', $slug);
    $slug = preg_replace('/[èéêë]/u', 'e', $slug);
    $slug = preg_replace('/[ìíîï]/u', 'i', $slug);
    $slug = preg_replace('/[òóôõöø]/u', 'o', $slug);
    $slug = preg_replace('/[ùúûü]/u', 'u', $slug);
    $slug = preg_replace('/[ýÿ]/u', 'y', $slug);
    $slug = preg_replace('/[ç]/u', 'c', $slug);
    $slug = preg_replace('/[ñ]/u', 'n', $slug);
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
    $slug = trim($slug, '-');
    
    return $slug;
}
?>