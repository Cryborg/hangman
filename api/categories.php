<?php
/**
 * API Endpoint: Récupération des catégories
 * 
 * GET /api/categories.php - Liste toutes les catégories avec leurs mots
 * GET /api/categories.php?id=1 - Récupère une catégorie spécifique
 * GET /api/categories.php?slug=animaux - Récupère une catégorie par slug
 * GET /api/categories.php?tags=enfant,nature - Filtre par tags
 * GET /api/categories.php?stats=true - Inclut les statistiques détaillées
 * 
 * @version 1.0.0
 */

require_once 'config.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Paramètres de requête
    $categoryId = isset($_GET['id']) ? sanitizeInt($_GET['id'], 1) : null;
    $categorySlug = isset($_GET['slug']) ? sanitizeString($_GET['slug']) : null;
    $tagFilter = isset($_GET['tags']) ? sanitizeString($_GET['tags']) : null;
    $includeStats = isset($_GET['stats']) && $_GET['stats'] === 'true';
    $includeWords = !isset($_GET['words']) || $_GET['words'] !== 'false'; // Par défaut on inclut les mots
    
    // Construction de la requête SQL de base
    if ($includeStats) {
        // Utiliser la vue avec statistiques
        $baseQuery = "SELECT * FROM v_hangman_categories_stats";
        $whereConditions = ["active = 1"];
        $params = [];
    } else {
        // Requête simple 
        $baseQuery = "SELECT c.id, c.name, c.icon, c.slug, c.description, c.display_order,
                             GROUP_CONCAT(t.name ORDER BY t.display_order ASC SEPARATOR ',') as tags";
        $fromJoin = " FROM hangman_categories c 
                     LEFT JOIN hangman_category_tag ct ON c.id = ct.category_id  
                     LEFT JOIN hangman_tags t ON ct.tag_id = t.id AND t.active = 1";
        $whereConditions = ["c.active = 1"];
        $groupBy = " GROUP BY c.id, c.name, c.icon, c.slug, c.description, c.display_order";
        $params = [];
    }
    
    // Filtres conditionnels
    if ($categoryId !== null) {
        $whereConditions[] = ($includeStats ? "id" : "c.id") . " = :id";
        $params['id'] = $categoryId;
    }
    
    if ($categorySlug !== null) {
        $whereConditions[] = ($includeStats ? "slug" : "c.slug") . " = :slug";
        $params['slug'] = $categorySlug;
    }
    
    if ($tagFilter !== null) {
        $tags = array_map('trim', explode(',', $tagFilter));
        $tagPlaceholders = [];
        foreach ($tags as $index => $tag) {
            $tagPlaceholders[] = ":tag$index";
            $params["tag$index"] = $tag;
        }
        $tagCondition = ($includeStats ? "tags" : "t.name") . " IN (" . implode(',', $tagPlaceholders) . ")";
        $whereConditions[] = $tagCondition;
    }
    
    // Construire la requête complète
    if ($includeStats) {
        $sql = $baseQuery;
        if (!empty($whereConditions)) {
            $sql .= " WHERE " . implode(' AND ', $whereConditions);
        }
        $sql .= " ORDER BY display_order ASC, name ASC";
    } else {
        $sql = $baseQuery . $fromJoin;
        if (!empty($whereConditions)) {
            $sql .= " WHERE " . implode(' AND ', $whereConditions);
        }
        $sql .= $groupBy . " ORDER BY c.display_order ASC, c.name ASC";
    }
    
    // Limiter les résultats si on ne recherche qu'une catégorie
    if ($categoryId !== null || $categorySlug !== null) {
        $sql .= " LIMIT 1";
    }
    
    // Exécuter la requête principale
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $categories = $stmt->fetchAll();
    
    if (empty($categories)) {
        sendErrorResponse(404, 'No categories found');
        exit();
    }
    
    // Post-traitement des résultats
    foreach ($categories as &$category) {
        // Convertir les tags en array si c'est une string
        if (isset($category['tags']) && is_string($category['tags'])) {
            $category['tags'] = !empty($category['tags']) ? explode(',', $category['tags']) : [];
        } elseif (!isset($category['tags'])) {
            $category['tags'] = [];
        }
        
        // Récupérer les mots de la catégorie si demandé
        if ($includeWords) {
            $wordsQuery = "SELECT word FROM hangman_words WHERE category_id = :category_id AND active = 1 ORDER BY popularity DESC, word ASC";
            $wordsStmt = $db->prepare($wordsQuery);
            $wordsStmt->execute(['category_id' => $category['id']]);
            $words = $wordsStmt->fetchAll(PDO::FETCH_COLUMN);
            
            $category['words'] = $words;
        }
        
        // Convertir les valeurs numériques
        $category['id'] = (int) $category['id'];
        $category['display_order'] = (int) $category['display_order'];
        
        // Convertir les statistiques en entiers si présentes
        if ($includeStats) {
            foreach (['total_mots', 'mots_faciles', 'mots_moyens', 'mots_difficiles', 'mots_avec_accents', 'mots_avec_chiffres'] as $statKey) {
                if (isset($category[$statKey])) {
                    $category[$statKey] = (int) $category[$statKey];
                }
            }
        }
    }
    
    // Préparer les métadonnées
    $meta = [];
    
    if ($includeStats) {
        $meta['includes_statistics'] = true;
        $meta['total_words'] = array_sum(array_column($categories, 'total_words'));
    }
    
    if ($tagFilter) {
        $meta['filtered_by_tags'] = explode(',', $tagFilter);
    }
    
    // Retourner le résultat
    if (($categoryId !== null || $categorySlug !== null) && count($categories) === 1) {
        // Retourner une seule catégorie
        sendSuccessResponse($categories[0], $meta);
    } else {
        // Retourner la liste des catégories  
        $response = ['categories' => $categories];
        sendSuccessResponse($response, $meta);
    }
    
} catch (PDOException $e) {
    sendErrorResponse(500, 'Database error occurred', $e->getMessage());
} catch (Exception $e) {
    sendErrorResponse(500, 'An unexpected error occurred', $e->getMessage());
}
?>