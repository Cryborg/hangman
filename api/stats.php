<?php
/**
 * API Endpoint: Statistiques générales
 * 
 * GET /api/stats.php - Statistiques globales du jeu
 * GET /api/stats.php?categories=true - Inclut les stats par catégorie
 * GET /api/stats.php?tags=true - Inclut les stats par tags
 * GET /api/stats.php?difficulty=true - Inclut les stats par difficulté
 * 
 * @version 1.0.0
 */

require_once 'config.php';

try {
    $db = Database::getInstance()->getConnection();
    
    // Paramètres de requête
    $includeCategories = isset($_GET['categories']) && $_GET['categories'] === 'true';
    $includeTags = isset($_GET['tags']) && $_GET['tags'] === 'true';
    $includeDifficulty = isset($_GET['difficulty']) && $_GET['difficulty'] === 'true';
    
    // ===== STATISTIQUES GLOBALES =====
    
    // Compter les catégories actives
    $categoriesQuery = "SELECT COUNT(*) as total FROM hangman_categories WHERE active = 1";
    $categoriesStmt = $db->prepare($categoriesQuery);
    $categoriesStmt->execute();
    $totalCategories = (int) $categoriesStmt->fetchColumn();
    
    // Compter les mots actifs
    $wordsQuery = "SELECT COUNT(*) as total FROM hangman_words WHERE active = 1";
    $wordsStmt = $db->prepare($wordsQuery);
    $wordsStmt->execute();
    $totalWords = (int) $wordsStmt->fetchColumn();
    
    // Compter les tags actifs
    $tagsQuery = "SELECT COUNT(*) as total FROM hangman_tags WHERE active = 1";
    $tagsStmt = $db->prepare($tagsQuery);
    $tagsStmt->execute();
    $totalTags = (int) $tagsStmt->fetchColumn();
    
    // Statistiques par difficulté
    $difficultyQuery = "SELECT 
                            difficulte,
                            COUNT(*) as count,
                            ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM hangman_words WHERE active = 1)), 2) as percentage
                        FROM hangman_words 
                        WHERE active = 1 
                        GROUP BY difficulte
                        ORDER BY FIELD(difficulte, 'facile', 'moyen', 'difficile')";
    $difficultyStmt = $db->prepare($difficultyQuery);
    $difficultyStmt->execute();
    $difficultyStats = $difficultyStmt->fetchAll();
    
    // Convertir les statistiques de difficulté
    foreach ($difficultyStats as &$stat) {
        $stat['count'] = (int) $stat['count'];
        $stat['percentage'] = (float) $stat['percentage'];
    }
    
    // Statistiques sur les caractères spéciaux
    $specialCharsQuery = "SELECT 
                             SUM(contient_accents) as mots_avec_accents,
                             SUM(contient_chiffres) as mots_avec_chiffres,
                             SUM(contient_special) as mots_avec_special,
                             AVG(longueur) as longueur_moyenne
                         FROM hangman_words 
                         WHERE active = 1";
    $specialCharsStmt = $db->prepare($specialCharsQuery);
    $specialCharsStmt->execute();
    $specialCharsStats = $specialCharsStmt->fetch();
    
    // Convertir les statistiques de caractères spéciaux
    $specialCharsStats['mots_avec_accents'] = (int) $specialCharsStats['mots_avec_accents'];
    $specialCharsStats['mots_avec_chiffres'] = (int) $specialCharsStats['mots_avec_chiffres'];
    $specialCharsStats['mots_avec_special'] = (int) $specialCharsStats['mots_avec_special'];
    $specialCharsStats['longueur_moyenne'] = round((float) $specialCharsStats['longueur_moyenne'], 2);
    
    // Préparer la réponse de base
    $response = [
        'global' => [
            'total_categories' => $totalCategories,
            'total_words' => $totalWords,
            'total_tags' => $totalTags,
            'difficulty_distribution' => $difficultyStats,
            'special_characters' => $specialCharsStats
        ]
    ];
    
    // ===== STATISTIQUES PAR CATÉGORIE (si demandé) =====
    
    if ($includeCategories) {
        $categoriesStatsQuery = "SELECT 
                                    c.id, c.name, c.icon, c.slug,
                                    COUNT(w.id) as total_mots,
                                    COUNT(CASE WHEN w.difficulte = 'facile' THEN 1 END) as mots_faciles,
                                    COUNT(CASE WHEN w.difficulte = 'moyen' THEN 1 END) as mots_moyens,
                                    COUNT(CASE WHEN w.difficulte = 'difficile' THEN 1 END) as mots_difficiles,
                                    COUNT(CASE WHEN w.contient_accents = 1 THEN 1 END) as mots_avec_accents,
                                    COUNT(CASE WHEN w.contient_chiffres = 1 THEN 1 END) as mots_avec_chiffres,
                                    AVG(w.longueur) as longueur_moyenne
                                FROM hangman_categories c
                                LEFT JOIN hangman_words w ON c.id = w.category_id AND w.active = 1
                                WHERE c.active = 1
                                GROUP BY c.id, c.name, c.icon, c.slug
                                ORDER BY c.display_order ASC, c.name ASC";
        
        $categoriesStatsStmt = $db->prepare($categoriesStatsQuery);
        $categoriesStatsStmt->execute();
        $categoriesStats = $categoriesStatsStmt->fetchAll();
        
        // Post-traitement des stats de catégories
        foreach ($categoriesStats as &$categoryStat) {
            $categoryStat['id'] = (int) $categoryStat['id'];
            $categoryStat['total_mots'] = (int) $categoryStat['total_mots'];
            $categoryStat['mots_faciles'] = (int) $categoryStat['mots_faciles'];
            $categoryStat['mots_moyens'] = (int) $categoryStat['mots_moyens'];
            $categoryStat['mots_difficiles'] = (int) $categoryStat['mots_difficiles'];
            $categoryStat['mots_avec_accents'] = (int) $categoryStat['mots_avec_accents'];
            $categoryStat['mots_avec_chiffres'] = (int) $categoryStat['mots_avec_chiffres'];
            $categoryStat['longueur_moyenne'] = $categoryStat['longueur_moyenne'] ? round((float) $categoryStat['longueur_moyenne'], 2) : 0;
        }
        
        $response['categories'] = $categoriesStats;
    }
    
    // ===== STATISTIQUES PAR TAG (si demandé) =====
    
    if ($includeTags) {
        $tagsStatsQuery = "SELECT 
                              t.id, t.name, t.slug, t.color,
                              COUNT(DISTINCT c.id) as categories_count,
                              COUNT(w.id) as mots_count
                          FROM hangman_tags t
                          LEFT JOIN hangman_category_tag ct ON t.id = ct.tag_id
                          LEFT JOIN hangman_categories c ON ct.category_id = c.id AND c.active = 1
                          LEFT JOIN hangman_words w ON c.id = w.category_id AND w.active = 1
                          WHERE t.active = 1
                          GROUP BY t.id, t.name, t.slug, t.color
                          ORDER BY t.display_order ASC, t.name ASC";
        
        $tagsStatsStmt = $db->prepare($tagsStatsQuery);
        $tagsStatsStmt->execute();
        $tagsStats = $tagsStatsStmt->fetchAll();
        
        // Post-traitement des stats de tags
        foreach ($tagsStats as &$tagStat) {
            $tagStat['id'] = (int) $tagStat['id'];
            $tagStat['categories_count'] = (int) $tagStat['categories_count'];
            $tagStat['mots_count'] = (int) $tagStat['mots_count'];
        }
        
        $response['tags'] = $tagsStats;
    }
    
    // ===== HISTORIQUE ET TENDANCES (si demandé) =====
    
    if ($includeDifficulty) {
        // Word length distribution
        $lengthDistributionQuery = "SELECT 
                                       length,
                                       COUNT(*) as count
                                   FROM hangman_words 
                                   WHERE active = 1
                                   GROUP BY length
                                   ORDER BY length ASC";
        
        $lengthDistributionStmt = $db->prepare($lengthDistributionQuery);
        $lengthDistributionStmt->execute();
        $lengthDistribution = $lengthDistributionStmt->fetchAll();
        
        // Post-process length distribution
        foreach ($lengthDistribution as &$lengthStat) {
            $lengthStat['length'] = (int) $lengthStat['length'];
            $lengthStat['count'] = (int) $lengthStat['count'];
        }
        
        $response['difficulty_analysis'] = [
            'length_distribution' => $lengthDistribution,
            'difficulty_distribution' => $difficultyStats
        ];
    }
    
    // Préparer les métadonnées
    $meta = [
        'includes_categories' => $includeCategories,
        'includes_tags' => $includeTags,
        'includes_difficulty' => $includeDifficulty,
        'generated_at' => date('c')
    ];
    
    // Retourner le résultat
    sendSuccessResponse($response, $meta);
    
} catch (PDOException $e) {
    sendErrorResponse(500, 'Database error occurred', $e->getMessage());
} catch (Exception $e) {
    sendErrorResponse(500, 'An unexpected error occurred', $e->getMessage());
}
?>