<?php
/**
 * API ADMIN - Gestion des tags
 * Endpoints CRUD pour l'administration des tags
 * 
 * @version 1.0.0
 */

require_once '../config.php';
require_once '../auth.php';

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
 * GET - Récupérer les tags
 */
function handleGet($db) {
    try {
        $sql = "
            SELECT 
                t.*,
                COUNT(DISTINCT ct.category_id) as categories_count,
                GROUP_CONCAT(DISTINCT c.name) as categories
            FROM hangman_tags t
            LEFT JOIN hangman_category_tag ct ON t.id = ct.tag_id
            LEFT JOIN hangman_categories c ON ct.category_id = c.id
            GROUP BY t.id
            ORDER BY t.display_order ASC, t.name ASC
        ";
        
        $stmt = $db->query($sql);
        $tags = $stmt->fetchAll();
        
        // Traitement des données
        foreach ($tags as &$tag) {
            $tag['id'] = (int) $tag['id'];
            $tag['categories_count'] = (int) $tag['categories_count'];
            $tag['categories'] = $tag['categories'] ? explode(',', $tag['categories']) : [];
            $tag['display_order'] = (int) $tag['display_order'];
            $tag['created_at'] = $tag['created_at'] ?? null;
            $tag['updated_at'] = $tag['updated_at'] ?? null;
        }
        
        sendSuccessResponse($tags, [
            'total' => count($tags),
            'endpoint' => 'tags'
        ]);
        
    } catch (PDOException $e) {
        sendErrorResponse(500, 'Database error', $e->getMessage());
    }
}

/**
 * POST - Créer un nouveau tag
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
    $color = sanitizeString($input['color'] ?? '#3498db');
    $display_order = sanitizeInt($input['display_order'] ?? 0, 0, 9999);
    $categories = $input['categories'] ?? [];
    
    if (empty($name)) {
        sendErrorResponse(400, 'Le nom du tag est requis');
        return;
    }
    
    // Générer le slug si absent
    if (empty($slug)) {
        $slug = generateSlug($nom);
    }
    
    // Valider la couleur hexadécimale
    if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $couleur)) {
        $couleur = '#3498db';
    }
    
    try {
        $db->beginTransaction();
        
        // Vérifier l'unicité du slug
        $stmt = $db->prepare("SELECT COUNT(*) FROM hangman_tags WHERE slug = ?");
        $stmt->execute([$slug]);
        if ($stmt->fetchColumn() > 0) {
            $db->rollBack();
            sendErrorResponse(409, 'Ce slug existe déjà');
            return;
        }
        
        // Insérer le tag
        $stmt = $db->prepare("
            INSERT INTO hangman_tags (name, slug, color, display_order) 
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([$name, $slug, $color, $display_order]);
        $tagId = $db->lastInsertId();
        
        // Associer aux catégories
        if (!empty($categories)) {
            $categoryStmt = $db->prepare("
                INSERT INTO hangman_category_tag (category_id, tag_id) 
                VALUES (?, ?)
            ");
            foreach ($categories as $categoryId) {
                // Vérifier que la catégorie existe
                $checkStmt = $db->prepare("SELECT COUNT(*) FROM hangman_categories WHERE id = ?");
                $checkStmt->execute([$categoryId]);
                if ($checkStmt->fetchColumn() > 0) {
                    $categoryStmt->execute([$categoryId, $tagId]);
                }
            }
        }
        
        $db->commit();
        
        // Récupérer le tag créé
        $stmt = $db->prepare("
            SELECT 
                t.*,
                COUNT(DISTINCT ct.category_id) as categories_count
            FROM hangman_tags t
            LEFT JOIN hangman_category_tag ct ON t.id = ct.tag_id
            WHERE t.id = ?
            GROUP BY t.id
        ");
        $stmt->execute([$tagId]);
        $tag = $stmt->fetch();
        
        $tag['id'] = (int) $tag['id'];
        $tag['categories_count'] = (int) $tag['categories_count'];
        $tag['ordre'] = (int) $tag['ordre'];
        
        sendSuccessResponse($tag, [
            'message' => 'Tag créé avec succès',
            'created_id' => $tagId
        ]);
        
    } catch (PDOException $e) {
        $db->rollBack();
        sendErrorResponse(500, 'Erreur lors de la création', $e->getMessage());
    }
}

/**
 * PUT - Mettre à jour un tag
 */
function handlePut($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['id'])) {
        sendErrorResponse(400, 'ID de tag requis');
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
    $color = sanitizeString($input['color'] ?? '#3498db');
    $display_order = sanitizeInt($input['display_order'] ?? 0, 0, 9999);
    $categories = $input['categories'] ?? [];
    
    if (empty($name)) {
        sendErrorResponse(400, 'Le nom du tag est requis');
        return;
    }
    
    // Generate slug if empty
    if (empty($slug)) {
        $slug = generateSlug($name);
    }
    
    // Validate hex color
    if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $color)) {
        $color = '#3498db';
    }
    
    try {
        $db->beginTransaction();
        
        // Vérifier que le tag existe
        $stmt = $db->prepare("SELECT COUNT(*) FROM hangman_tags WHERE id = ?");
        $stmt->execute([$id]);
        if ($stmt->fetchColumn() == 0) {
            $db->rollBack();
            sendErrorResponse(404, 'Tag non trouvé');
            return;
        }
        
        // Vérifier l'unicité du slug (sauf pour le tag actuel)
        $stmt = $db->prepare("SELECT COUNT(*) FROM hangman_tags WHERE slug = ? AND id != ?");
        $stmt->execute([$slug, $id]);
        if ($stmt->fetchColumn() > 0) {
            $db->rollBack();
            sendErrorResponse(409, 'Ce slug existe déjà');
            return;
        }
        
        // Mettre à jour le tag
        $stmt = $db->prepare("
            UPDATE hangman_tags 
            SET name = ?, slug = ?, color = ?, display_order = ?, updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$name, $slug, $color, $display_order, $id]);
        
        // Supprimer les anciennes associations de catégories
        $stmt = $db->prepare("DELETE FROM hangman_category_tag WHERE tag_id = ?");
        $stmt->execute([$id]);
        
        // Ajouter les nouvelles associations
        if (!empty($categories)) {
            $categoryStmt = $db->prepare("
                INSERT INTO hangman_category_tag (category_id, tag_id) 
                VALUES (?, ?)
            ");
            foreach ($categories as $categoryId) {
                // Vérifier que la catégorie existe
                $checkStmt = $db->prepare("SELECT COUNT(*) FROM hangman_categories WHERE id = ?");
                $checkStmt->execute([$categoryId]);
                if ($checkStmt->fetchColumn() > 0) {
                    $categoryStmt->execute([$categoryId, $id]);
                }
            }
        }
        
        $db->commit();
        
        sendSuccessResponse(['id' => $id], [
            'message' => 'Tag mis à jour avec succès'
        ]);
        
    } catch (PDOException $e) {
        $db->rollBack();
        sendErrorResponse(500, 'Erreur lors de la mise à jour', $e->getMessage());
    }
}

/**
 * DELETE - Supprimer un tag
 */
function handleDelete($db) {
    $id = sanitizeInt($_GET['id'] ?? 0, 1);
    
    if (!$id) {
        sendErrorResponse(400, 'ID de tag requis');
        return;
    }
    
    try {
        $db->beginTransaction();
        
        // Vérifier que le tag existe
        $stmt = $db->prepare("SELECT name FROM hangman_tags WHERE id = ?");
        $stmt->execute([$id]);
        $tag = $stmt->fetch();
        
        if (!$tag) {
            $db->rollBack();
            sendErrorResponse(404, 'Tag non trouvé');
            return;
        }
        
        // Supprimer les associations de catégories
        $stmt = $db->prepare("DELETE FROM hangman_category_tag WHERE tag_id = ?");
        $stmt->execute([$id]);
        
        // Supprimer le tag
        $stmt = $db->prepare("DELETE FROM hangman_tags WHERE id = ?");
        $stmt->execute([$id]);
        
        $db->commit();
        
        sendSuccessResponse(['id' => $id], [
            'message' => "Tag '{$tag['name']}' supprimé avec succès"
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