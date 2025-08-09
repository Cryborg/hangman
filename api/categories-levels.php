<?php
/**
 * API Endpoint: Récupération des catégories avec niveaux de difficulté
 * 
 * GET /api/categories-levels.php - Liste toutes les catégories avec niveaux
 * GET /api/categories-levels.php?levels=easy,medium - Filtre par niveaux de difficulté 
 * GET /api/categories-levels.php?id=1&levels=hard - Catégorie spécifique avec niveau hard
 * 
 * Format: Retourne toujours le format moderne structuré par niveaux
 * @version 3.0.0
 */

require_once 'config.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Paramètres de requête
    $categoryId = isset($_GET['id']) ? sanitizeInt($_GET['id'], 1) : null;
    $categorySlug = isset($_GET['slug']) ? sanitizeString($_GET['slug']) : null;
    $levelsFilter = isset($_GET['levels']) ? sanitizeString($_GET['levels']) : 'easy,medium,hard';
    $includeStats = isset($_GET['stats']) && $_GET['stats'] === 'true';
    
    // Parse les niveaux demandés
    $requestedLevels = array_map('trim', explode(',', $levelsFilter));
    $validLevels = ['easy', 'medium', 'hard'];
    $levels = array_intersect($requestedLevels, $validLevels);
    
    if (empty($levels)) {
        $levels = $validLevels; // Par défaut tous les niveaux
    }
    
    // Construction de la requête principale pour les catégories
    $categoryQuery = "
        SELECT c.id, c.name, c.icon, c.slug,
               GROUP_CONCAT(DISTINCT t.name ORDER BY t.name ASC SEPARATOR ',') as tags
        FROM hangman_categories c 
        LEFT JOIN hangman_category_tag ct ON c.id = ct.category_id  
        LEFT JOIN hangman_tags t ON ct.tag_id = t.id AND t.active = 1
        WHERE c.active = 1";
    
    $params = [];
    
    // Filtres pour catégories spécifiques
    if ($categoryId !== null) {
        $categoryQuery .= " AND c.id = :id";
        $params['id'] = $categoryId;
    }
    
    if ($categorySlug !== null) {
        $categoryQuery .= " AND c.slug = :slug";
        $params['slug'] = $categorySlug;
    }
    
    $categoryQuery .= " GROUP BY c.id, c.name, c.icon, c.slug
                       ORDER BY c.name ASC";
    
    $categoryStmt = $db->prepare($categoryQuery);
    $categoryStmt->execute($params);
    $categories = $categoryStmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($categories)) {
        sendErrorResponse(404, 'Aucune catégorie trouvée');
        exit;
    }
    
    // Construction de la requête pour récupérer les mots par niveau
    $placeholders = implode(',', array_fill(0, count($levels), '?'));
    $categoryIds = array_column($categories, 'id');
    $categoryPlaceholders = implode(',', array_fill(0, count($categoryIds), '?'));
    
    $wordsQuery = "
        SELECT w.word, w.category_id, w.difficulty
        FROM hangman_words w 
        WHERE w.active = 1 
        AND w.category_id IN ($categoryPlaceholders)
        AND w.difficulty IN ($placeholders)
        ORDER BY w.category_id ASC, w.difficulty ASC, w.word ASC";
    
    $wordsParams = array_merge($categoryIds, $levels);
    $wordsStmt = $db->prepare($wordsQuery);
    $wordsStmt->execute($wordsParams);
    $allWords = $wordsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Organiser les mots par catégorie et niveau
    $wordsByCategory = [];
    foreach ($allWords as $word) {
        $categoryId = $word['category_id'];
        $difficulty = $word['difficulty'];
        
        if (!isset($wordsByCategory[$categoryId])) {
            $wordsByCategory[$categoryId] = [
                'easy' => [],
                'medium' => [], 
                'hard' => []
            ];
        }
        
        $wordsByCategory[$categoryId][$difficulty][] = $word['word'];
    }
    
    // Construire la réponse au format moderne avec niveaux structurés
    $result = [
            'version' => '2.0',
            'levels_info' => [
                'easy' => [
                    'name' => 'Facile',
                    'description' => 'Pour les enfants et débutants',
                    'color' => '#2ed573'
                ],
                'medium' => [
                    'name' => 'Medium', 
                    'description' => 'Niveau normal',
                    'color' => '#f39c12'
                ],
                'hard' => [
                    'name' => 'Hard',
                    'description' => 'Niveau expert', 
                    'color' => '#e74c3c'
                ]
            ],
            'requested_levels' => $levels,
            'categories' => []
        ];
        
        foreach ($categories as $category) {
            $categoryId = $category['id'];
            
            $categoryData = [
                'id' => (int)$category['id'],
                'name' => $category['name'],
                'icon' => $category['icon'],
                'slug' => $category['slug'],
                'tags' => $category['tags'] ? explode(',', $category['tags']) : [],
                'levels' => []
            ];
            
            // Ajouter les niveaux avec leurs mots
            $totalWords = 0;
            foreach ($levels as $level) {
                $wordsForLevel = isset($wordsByCategory[$categoryId][$level]) ? $wordsByCategory[$categoryId][$level] : [];
                $wordCount = count($wordsForLevel);
                $totalWords += $wordCount;
                
                $categoryData['levels'][$level] = [
                    'words' => $wordsForLevel,
                    'word_count' => $wordCount,
                    'description' => getLevelDescription($level, $category['name'])
                ];
            }
            
            $categoryData['total_words'] = $totalWords;
            
            // Filtrer les catégories sans mots pour les niveaux demandés
            if ($totalWords > 0) {
                $result['categories'][] = $categoryData;
            }
        }
    
    // Ajouter les statistiques si demandées
    if ($includeStats) {
        $totalCategories = count($result['categories']);
        $totalWords = array_sum(array_column($result['categories'], 'total_words'));
        
        $stats = [
            'total_categories' => $totalCategories,
            'total_words' => $totalWords,
            'levels_available' => $validLevels,
            'levels_requested' => $levels,
            'generated_at' => date('c')
        ];
        
        $result['stats'] = $stats;
    }
    
    sendSuccessResponse($result);
    
} catch (Exception $e) {
    error_log("API Error (categories-levels): " . $e->getMessage());
    sendErrorResponse(500, 'Erreur lors de la récupération des catégories', $e->getMessage());
}

/**
 * Génère une description pour un niveau de difficulté selon la catégorie
 */
function getLevelDescription($level, $categoryName) {
    $descriptions = [
        'easy' => [
            'default' => 'Mots simples et familiers',
            'Animaux' => 'Animaux domestiques et de la ferme',
            'Fruits et Légumes' => 'Fruits et légumes du quotidien',
            'Harry Potter' => 'Personnages principaux'
        ],
        'medium' => [
            'default' => 'Mots de niveau intermédiaire',
            'Animaux' => 'Animaux sauvages et exotiques', 
            'Fruits et Légumes' => 'Variétés plus spécialisées',
            'Harry Potter' => 'Personnages secondaires et lieux'
        ],
        'hard' => [
            'default' => 'Mots complexes et techniques',
            'Animaux' => 'Espèces rares et noms complexes',
            'Fruits et Légumes' => 'Variétés rares et exotiques',
            'Harry Potter' => 'Sortilèges et concepts magiques'
        ]
    ];
    
    return $descriptions[$level][$categoryName] ?? $descriptions[$level]['default'];
}
?>