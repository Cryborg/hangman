<?php
/**
 * API Endpoint: Administration
 * 
 * GET /api/admin.php - Retrieve all data for admin interface
 * 
 * @version 1.0.0
 */

// Force UTF-8 headers
header('Content-Type: application/json; charset=utf-8');
ini_set('default_charset', 'utf-8');
mb_internal_encoding('UTF-8');

require_once 'config.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Retrieve all categories with stats
    $categoriesQuery = "
        SELECT c.id, c.name, c.icon, c.slug, c.display_order, c.active,
               COUNT(w.id) as total_words
        FROM hangman_categories c
        LEFT JOIN hangman_words w ON c.id = w.category_id AND w.active = 1
        GROUP BY c.id, c.name, c.icon, c.slug, c.display_order, c.active
        ORDER BY c.display_order ASC, c.name ASC
    ";
    $categoriesStmt = $db->prepare($categoriesQuery);
    $categoriesStmt->execute();
    $categories = $categoriesStmt->fetchAll();
    
    // Post-process categories
    foreach ($categories as &$category) {
        $category['id'] = (int) $category['id'];
        $category['display_order'] = (int) $category['display_order'];
        $category['active'] = (bool) $category['active'];
        $category['total_words'] = (int) $category['total_words'];
    }
    
    // Retrieve all words with category info
    $wordsQuery = "
        SELECT w.id, w.word, w.category_id, w.difficulty, w.length, 
               w.has_accents, w.has_numbers, w.has_special_chars, 
               w.popularity, w.active, w.created_at, w.updated_at,
               c.name as category_name, c.icon as category_icon
        FROM hangman_words w
        INNER JOIN hangman_categories c ON w.category_id = c.id
        ORDER BY c.display_order ASC, c.name ASC, w.word ASC
    ";
    $wordsStmt = $db->prepare($wordsQuery);
    $wordsStmt->execute();
    $words = $wordsStmt->fetchAll();
    
    // Post-process words
    foreach ($words as &$word) {
        $word['id'] = (int) $word['id'];
        $word['category_id'] = (int) $word['category_id'];
        $word['length'] = (int) $word['length'];
        $word['popularity'] = (int) $word['popularity'];
        $word['active'] = (bool) $word['active'];
        $word['has_accents'] = (bool) $word['has_accents'];
        $word['has_numbers'] = (bool) $word['has_numbers'];
        $word['has_special_chars'] = (bool) $word['has_special_chars'];
    }
    
    // Retrieve all tags
    $tagsQuery = "
        SELECT id, name, slug, color, description, display_order, active
        FROM hangman_tags
        ORDER BY display_order ASC, name ASC
    ";
    $tagsStmt = $db->prepare($tagsQuery);
    $tagsStmt->execute();
    $tags = $tagsStmt->fetchAll();
    
    // Post-process tags
    foreach ($tags as &$tag) {
        $tag['id'] = (int) $tag['id'];
        $tag['display_order'] = (int) $tag['display_order'];
        $tag['active'] = (bool) $tag['active'];
    }
    
    // General statistics
    $statsQuery = "
        SELECT 
            (SELECT COUNT(*) FROM hangman_categories WHERE active = 1) as active_categories,
            (SELECT COUNT(*) FROM hangman_categories) as total_categories,
            (SELECT COUNT(*) FROM hangman_words WHERE active = 1) as active_words,
            (SELECT COUNT(*) FROM hangman_words) as total_words,
            (SELECT COUNT(*) FROM hangman_tags WHERE active = 1) as active_tags,
            (SELECT COUNT(*) FROM hangman_tags) as total_tags
    ";
    $statsStmt = $db->prepare($statsQuery);
    $statsStmt->execute();
    $stats = $statsStmt->fetch();
    
    // Convert stats to integers
    foreach ($stats as $key => &$value) {
        $stats[$key] = (int) $value;
    }
    
    // Prepare full response
    $response = [
        'categories' => $categories,
        'words' => $words,
        'tags' => $tags,
        'stats' => $stats,
        'meta' => [
            'timestamp' => date('Y-m-d H:i:s'),
            'total_categories' => count($categories),
            'total_words' => count($words),
            'total_tags' => count($tags)
        ]
    ];
    
    // Return with forced UTF-8 encoding
    $result = [
        'success' => true,
        'data' => $response
    ];
    
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($result, JSON_UNESCAPED_UNICODE);
    
} catch (PDOException $e) {
    sendErrorResponse(500, 'Database error occurred', $e->getMessage());
} catch (Exception $e) {
    sendErrorResponse(500, 'An unexpected error occurred', $e->getMessage());
}
?>