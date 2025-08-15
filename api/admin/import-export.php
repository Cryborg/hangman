<?php
/**
 * API ADMIN - Import/Export JSON
 * Endpoints pour l'import et export des données au format JSON
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
        handleExport($db);
        break;
        
    case 'POST':
        handleImport($db);
        break;
        
    default:
        sendErrorResponse(405, 'Method not allowed');
}

/**
 * GET - Export des données
 */
function handleExport($db) {
    $type = $_GET['type'] ?? 'full';
    $format = $_GET['format'] ?? 'json';
    
    if ($format !== 'json') {
        sendErrorResponse(400, 'Seul le format JSON est supporté');
        return;
    }
    
    try {
        $exportData = [
            'export_info' => [
                'type' => $type,
                'date' => date('c'),
                'version' => API_VERSION,
                'app_version' => APP_VERSION
            ]
        ];
        
        if ($type === 'categories' || $type === 'full') {
            // Export des catégories
            $stmt = $db->query("
                SELECT 
                    c.*,
                    GROUP_CONCAT(DISTINCT t.slug) as tags
                FROM hangman_categories c
                LEFT JOIN hangman_category_tag ct ON c.id = ct.category_id
                LEFT JOIN hangman_tags t ON ct.tag_id = t.id
                GROUP BY c.id
                ORDER BY c.name ASC
            ");
            $categories = $stmt->fetchAll();
            
            // Traitement des catégories
            foreach ($categories as &$category) {
                // Conversion des types
                $category['id'] = (int) $category['id'];
                
                // Transformation des tags en array
                $category['tags'] = $category['tags'] ? explode(',', $category['tags']) : [];
                
                if ($type === 'full') {
                    // Ajouter les mots de la catégorie
                    $wordStmt = $db->prepare("
                        SELECT * FROM hangman_words 
                        WHERE category_id = ? 
                        ORDER BY word ASC
                    ");
                    $wordStmt->execute([$category['id']]);
                    $words = $wordStmt->fetchAll();
                    
                    // Conversion des types pour les mots
                    foreach ($words as &$word) {
                        $word['id'] = (int) $word['id'];
                        $word['category_id'] = (int) $word['category_id'];
                        $word['active'] = (bool) ($word['active'] ?? true);
                    }
                    
                    $category['words'] = $words;
                }
                
                // Supprimer les champs techniques
                unset($category['created_at'], $category['updated_at']);
                if (isset($category['words'])) {
                    foreach ($category['words'] as &$word) {
                        unset($word['created_at'], $word['updated_at']);
                    }
                }
            }
            
            $exportData['categories'] = $categories;
        }
        
        if ($type === 'full') {
            // Export des tags
            $stmt = $db->query("
                SELECT * FROM hangman_tags
                ORDER BY name ASC
            ");
            $tags = $stmt->fetchAll();
            
            foreach ($tags as &$tag) {
                $tag['id'] = (int) $tag['id'];
                unset($tag['created_at'], $tag['updated_at']);
            }
            
            $exportData['tags'] = $tags;
            
            // Statistiques globales
            $stats = [
                'total_categories' => count($exportData['categories']),
                'total_words' => 0,
                'total_tags' => count($tags),
                'words_by_difficulty' => [
                    'easy' => 0,
                    'medium' => 0,
                    'hard' => 0
                ]
            ];
            
            foreach ($exportData['categories'] as $category) {
                if (isset($category['words'])) {
                    $stats['total_words'] += count($category['words']);
                    foreach ($category['words'] as $word) {
                        $stats['words_by_difficulty'][$word['difficulty']]++;
                    }
                }
            }
            
            $exportData['statistics'] = $stats;
        }
        
        // Définir les headers pour le téléchargement
        $filename = 'hangman_' . $type . '_export_' . date('Y-m-d_H-i-s') . '.json';
        
        if (isset($_GET['download']) && $_GET['download'] === 'true') {
            header('Content-Type: application/octet-stream');
            header('Content-Disposition: attachment; filename="' . $filename . '"');
            header('Content-Length: ' . strlen(json_encode($exportData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)));
            echo json_encode($exportData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } else {
            sendSuccessResponse($exportData, [
                'suggested_filename' => $filename,
                'export_type' => $type
            ]);
        }
        
    } catch (PDOException $e) {
        sendErrorResponse(500, 'Erreur lors de l\'export', $e->getMessage());
    }
}

/**
 * POST - Import des données
 */
function handleImport($db) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendErrorResponse(400, 'Données JSON invalides');
        return;
    }
    
    // Validation de la structure
    if (!isset($input['data'])) {
        sendErrorResponse(400, 'Structure d\'import invalide: clé "data" manquante');
        return;
    }
    
    $data = $input['data'];
    $mode = $input['mode'] ?? 'replace'; // 'replace', 'merge', 'append'
    
    if (!isset($data['categories']) || !is_array($data['categories'])) {
        sendErrorResponse(400, 'Structure d\'import invalide: "categories" manquant ou invalide');
        return;
    }
    
    try {
        $db->beginTransaction();
        
        $importStats = [
            'categories_imported' => 0,
            'words_imported' => 0,
            'tags_imported' => 0,
            'errors' => []
        ];
        
        // En mode replace, supprimer toutes les données existantes
        if ($mode === 'replace') {
            $db->exec("SET FOREIGN_KEY_CHECKS = 0");
            $db->exec("DELETE FROM hangman_category_tag");
            $db->exec("DELETE FROM hangman_words");
            $db->exec("DELETE FROM hangman_categories");
            $db->exec("DELETE FROM hangman_tags");
            $db->exec("SET FOREIGN_KEY_CHECKS = 1");
        }
        
        // Collecter tous les tags utilisés dans les catégories
        $allTags = [];
        foreach ($data['categories'] as $categoryData) {
            if (isset($categoryData['tags']) && is_array($categoryData['tags'])) {
                foreach ($categoryData['tags'] as $tagName) {
                    if (!in_array($tagName, $allTags)) {
                        $allTags[] = $tagName;
                    }
                }
            }
        }

        // Import des tags d'abord (s'il y en a dans les catégories ou dans data.tags)
        if (isset($data['tags']) && is_array($data['tags'])) {
            foreach ($data['tags'] as $tagData) {
                try {
                    $stmt = $db->prepare("
                        INSERT INTO hangman_tags (name, slug, color) 
                        VALUES (?, ?, ?)
                        ON DUPLICATE KEY UPDATE 
                        name = VALUES(name),
                        color = VALUES(color)
                    ");
                    
                    $stmt->execute([
                        $tagData['name'] ?? '',
                        $tagData['slug'] ?? generateSlug($tagData['name'] ?? ''),
                        $tagData['color'] ?? '#3498db'
                    ]);
                    
                    $importStats['tags_imported']++;
                } catch (Exception $e) {
                    $importStats['errors'][] = "Tag '{$tagData['name']}': " . $e->getMessage();
                }
            }
        }

        // Créer automatiquement les tags manquants trouvés dans les catégories
        foreach ($allTags as $tagName) {
            try {
                $stmt = $db->prepare("
                    INSERT IGNORE INTO hangman_tags (name, slug, color) 
                    VALUES (?, ?, ?)
                ");
                
                $stmt->execute([
                    $tagName,
                    generateSlug($tagName),
                    '#f39c12' // Couleur par défaut
                ]);
                
                if ($db->lastInsertId()) {
                    $importStats['tags_imported']++;
                }
            } catch (Exception $e) {
                $importStats['errors'][] = "Auto-création tag '{$tagName}': " . $e->getMessage();
            }
        }
        
        // Import des catégories
        foreach ($data['categories'] as $categoryData) {
            try {
                // Insérer/mettre à jour la catégorie
                $stmt = $db->prepare("
                    INSERT INTO hangman_categories (name, slug, icon) 
                    VALUES (?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                    name = VALUES(name),
                    icon = VALUES(icon)
                ");
                
                $categorySlug = $categoryData['slug'] ?? generateSlug($categoryData['name'] ?? '');
                
                $stmt->execute([
                    $categoryData['name'] ?? '',
                    $categorySlug,
                    $categoryData['icon'] ?? '📁'
                ]);
                
                $categoryId = $db->lastInsertId() ?: $db->query("SELECT id FROM hangman_categories WHERE slug = '$categorySlug'")->fetchColumn();
                
                // Supprimer les anciens mots de cette catégorie si mode replace
                if ($mode === 'replace') {
                    $db->prepare("DELETE FROM hangman_words WHERE category_id = ?")->execute([$categoryId]);
                }
                
                // Import des mots de la catégorie
                if (isset($categoryData['words']) && is_array($categoryData['words'])) {
                    // DEBUG: Log pour vérifier que les mots arrivent
                    error_log("Import: Catégorie '{$categoryData['name']}' a " . count($categoryData['words']) . " mots");
                    foreach ($categoryData['words'] as $wordData) {
                        try {
                            // Support pour les mots en string simple ou en objet
                            $wordText = is_string($wordData) ? $wordData : ($wordData['word'] ?? '');
                            
                            $stmt = $db->prepare("
                                INSERT INTO hangman_words (
                                    word, category_id, difficulty, active
                                ) VALUES (?, ?, ?, ?)
                                ON DUPLICATE KEY UPDATE 
                                difficulty = VALUES(difficulty)
                            ");
                            
                            $stmt->execute([
                                $wordText,
                                $categoryId,
                                is_array($wordData) ? ($wordData['difficulty'] ?? 'medium') : 'medium',
                                is_array($wordData) ? ($wordData['active'] ?? 1) : 1
                            ]);
                            
                            // DEBUG: Vérifier si l'insertion a réussi
                            if ($stmt->rowCount() > 0) {
                                $importStats['words_imported']++;
                                error_log("Import: Mot '$wordText' inséré avec succès");
                            } else {
                                error_log("Import: Mot '$wordText' pas inséré (possiblement doublon)");
                            }
                        } catch (Exception $e) {
                            $importStats['errors'][] = "Mot '{$wordText}': " . $e->getMessage();
                        }
                    }
                }
                
                // Associer les tags à la catégorie
                if (isset($categoryData['tags']) && is_array($categoryData['tags'])) {
                    // Supprimer les anciennes associations
                    $db->prepare("DELETE FROM hangman_category_tag WHERE category_id = ?")->execute([$categoryId]);
                    
                    foreach ($categoryData['tags'] as $tagName) {
                        // Chercher d'abord par nom, puis par slug
                        $tagStmt = $db->prepare("SELECT id FROM hangman_tags WHERE name = ? OR slug = ?");
                        $tagStmt->execute([$tagName, generateSlug($tagName)]);
                        $tagId = $tagStmt->fetchColumn();
                        
                        if ($tagId) {
                            $db->prepare("INSERT IGNORE INTO hangman_category_tag (category_id, tag_id) VALUES (?, ?)")
                               ->execute([$categoryId, $tagId]);
                        }
                    }
                }
                
                $importStats['categories_imported']++;
                
            } catch (Exception $e) {
                $importStats['errors'][] = "Catégorie '{$categoryData['name']}': " . $e->getMessage();
            }
        }
        
        $db->commit();
        
        // Résultat de l'import
        $result = [
            'import_completed' => true,
            'statistics' => $importStats,
            'import_mode' => $mode,
            'import_date' => date('c')
        ];
        
        // Message de succès plus informatif
        $message = sprintf(
            'Import terminé: %d catégorie(s), %d mot(s), %d tag(s)',
            $importStats['categories_imported'],
            $importStats['words_imported'],
            $importStats['tags_imported']
        );
        
        if (!empty($importStats['errors'])) {
            $result['warnings'] = 'Certaines données n\'ont pas pu être importées (' . count($importStats['errors']) . ' erreur(s))';
        }
        
        // Si aucun mot importé mais des catégories oui, c'est suspect
        if ($importStats['categories_imported'] > 0 && $importStats['words_imported'] === 0) {
            $result['warnings'] = 'Les catégories ont été importées mais aucun mot n\'a été ajouté (possibles doublons)';
        }
        
        sendSuccessResponse($result, [
            'message' => $message
        ]);
        
    } catch (Exception $e) {
        $db->rollBack();
        sendErrorResponse(500, 'Erreur lors de l\'import', $e->getMessage());
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