<?php
/**
 * API ADMIN - Gestion des mots par catégorie (VERSION REFACTORISÉE)
 * Démonstration de l'utilisation des classes PHP réutilisables
 * 
 * Comparaison avant/après refactoring :
 * - AVANT : 365 lignes avec duplication de code
 * - APRÈS : ~120 lignes avec logique réutilisable
 * 
 * @version 2.0.0 - Refactorisée avec classes SOLID/DRY
 */

require_once '../config.php';
require_once '../auth.php';
require_once '../classes/autoload.php';

// Vérifier l'authentification
AdminAuth::requireAuth();

// Initialiser les repositories
$db = Database::getInstance()->getConnection();
$wordRepo = new WordRepository($db);
$categoryRepo = new CategoryRepository($db);

// Traitement selon la méthode HTTP
switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        handleGetWords($wordRepo, $categoryRepo);
        break;
        
    case 'POST':
        handleAddWord($wordRepo, $categoryRepo);
        break;
        
    case 'PUT':
        handleUpdateWord($wordRepo);
        break;
        
    case 'DELETE':
        handleDeleteWord($wordRepo);
        break;
        
    default:
        sendErrorResponse(405, 'Method not allowed');
}

/**
 * GET - Récupérer les mots d'une catégorie
 */
function handleGetWords(WordRepository $wordRepo, CategoryRepository $categoryRepo) {
    // Validation des paramètres avec la classe Validator
    $pagination = Validator::validatePagination($_GET);
    if (!empty($pagination['errors'])) {
        sendErrorResponse(400, implode(', ', $pagination['errors']));
        return;
    }
    
    $categoryId = $_GET['category_id'] ?? null;
    if (!$categoryId) {
        sendErrorResponse(400, 'Parameter category_id is required');
        return;
    }
    
    $categoryValidation = Validator::validateInt($categoryId, 1);
    if (!empty($categoryValidation['errors'])) {
        sendErrorResponse(400, implode(', ', $categoryValidation['errors']));
        return;
    }
    
    try {
        // Vérifier que la catégorie existe avec le repository
        $category = $categoryRepo->findById($categoryValidation['value']);
        if (!$category) {
            sendErrorResponse(404, 'Category not found');
            return;
        }
        
        // Récupérer les mots avec pagination
        $result = $wordRepo->findByCategoryWithPagination(
            $categoryValidation['value'],
            $pagination['page'],
            $pagination['limit'],
            $pagination['search']
        );
        
        // Transformer les données avec DataTransformer
        $words = DataTransformer::transformWords($result['words']);
        $categoryData = DataTransformer::transformCategory($category);
        $paginationData = DataTransformer::buildPaginationData(
            $pagination['page'],
            $pagination['limit'],
            $result['total'],
            $pagination['search']
        );
        
        // Récupérer les statistiques
        $stats = $wordRepo->getCategoryStats($categoryValidation['value']);
        $statsData = DataTransformer::transformCategoryStats($stats);
        
        // Réponse finale
        sendSuccessResponse([
            'category' => $categoryData,
            'words' => $words,
            'pagination' => $paginationData,
            'stats' => $statsData
        ]);
        
    } catch (PDOException $e) {
        sendErrorResponse(500, 'Database error occurred', $e->getMessage());
    }
}

/**
 * POST - Ajouter un mot à une catégorie
 */
function handleAddWord(WordRepository $wordRepo, CategoryRepository $categoryRepo) {
    // Validation de l'entrée JSON
    $inputValidation = Validator::validateJsonInput();
    if (!empty($inputValidation['errors'])) {
        sendErrorResponse(400, implode(', ', $inputValidation['errors']));
        return;
    }
    
    $input = $inputValidation['data'];
    
    // Validation des champs requis
    $requiredErrors = Validator::validateRequired($input, ['word', 'category_id']);
    if (!empty($requiredErrors)) {
        sendErrorResponse(400, implode(', ', $requiredErrors));
        return;
    }
    
    try {
        // Validation du mot avec WordAnalyzer
        $wordValidation = WordAnalyzer::isValidWord($input['word']);
        if (!$wordValidation['is_valid']) {
            sendErrorResponse(400, implode(', ', $wordValidation['errors']));
            return;
        }
        
        $categoryId = (int) $input['category_id'];
        
        // Vérifier que la catégorie existe
        $category = $categoryRepo->findById($categoryId);
        if (!$category) {
            sendErrorResponse(404, 'Category not found');
            return;
        }
        
        // Vérifier l'unicité du mot dans la catégorie
        if ($wordRepo->existsInCategory($wordValidation['cleaned_word'], $categoryId)) {
            sendErrorResponse(409, 'Word already exists in this category');
            return;
        }
        
        // Valider la difficulté si fournie
        $difficulty = 'medium';
        if (isset($input['difficulty'])) {
            $difficultyValidation = Validator::validateDifficulty($input['difficulty']);
            if (!empty($difficultyValidation['errors'])) {
                sendErrorResponse(400, implode(', ', $difficultyValidation['errors']));
                return;
            }
            $difficulty = $difficultyValidation['value'];
        }
        
        // Créer le mot
        $newWordId = $wordRepo->create([
            'word' => $wordValidation['cleaned_word'],
            'category_id' => $categoryId,
            'difficulty' => $difficulty
        ]);
        
        // Récupérer le mot créé et le transformer
        $newWord = $wordRepo->findById($newWordId);
        $transformedWord = DataTransformer::transformWord($newWord);
        
        sendSuccessResponse([
            'word' => $transformedWord,
            'message' => 'Word added successfully'
        ]);
        
    } catch (PDOException $e) {
        sendErrorResponse(500, 'Database error occurred', $e->getMessage());
    }
}

/**
 * PUT - Modifier un mot
 */
function handleUpdateWord(WordRepository $wordRepo) {
    // Validation de l'entrée JSON
    $inputValidation = Validator::validateJsonInput();
    if (!empty($inputValidation['errors'])) {
        sendErrorResponse(400, implode(', ', $inputValidation['errors']));
        return;
    }
    
    $input = $inputValidation['data'];
    
    if (!isset($input['id'])) {
        sendErrorResponse(400, 'Missing required field: id');
        return;
    }
    
    try {
        $wordId = (int) $input['id'];
        
        // Vérifier que le mot existe
        $existingWord = $wordRepo->findById($wordId);
        if (!$existingWord) {
            sendErrorResponse(404, 'Word not found');
            return;
        }
        
        // Préparer les données de mise à jour avec validation
        $updateData = [];
        
        if (isset($input['word'])) {
            $wordValidation = WordAnalyzer::isValidWord($input['word']);
            if (!$wordValidation['is_valid']) {
                sendErrorResponse(400, implode(', ', $wordValidation['errors']));
                return;
            }
            $updateData['word'] = $wordValidation['cleaned_word'];
        }
        
        if (isset($input['difficulty'])) {
            $difficultyValidation = Validator::validateDifficulty($input['difficulty']);
            if (!empty($difficultyValidation['errors'])) {
                sendErrorResponse(400, implode(', ', $difficultyValidation['errors']));
                return;
            }
            $updateData['difficulty'] = $difficultyValidation['value'];
        }
        
        if (isset($input['popularity'])) {
            $popularityValidation = Validator::validateInt($input['popularity'], 0, 100);
            if (!empty($popularityValidation['errors'])) {
                sendErrorResponse(400, implode(', ', $popularityValidation['errors']));
                return;
            }
            $updateData['popularity'] = $popularityValidation['value'];
        }
        
        if (isset($input['active'])) {
            $updateData['active'] = Validator::validateBoolean($input['active']);
        }
        
        if (empty($updateData)) {
            sendErrorResponse(400, 'No valid fields to update');
            return;
        }
        
        // Exécuter la mise à jour
        $success = $wordRepo->update($wordId, $updateData);
        if (!$success) {
            sendErrorResponse(500, 'Failed to update word');
            return;
        }
        
        // Récupérer et transformer le mot mis à jour
        $updatedWord = $wordRepo->findById($wordId);
        $transformedWord = DataTransformer::transformWord($updatedWord);
        
        sendSuccessResponse([
            'word' => $transformedWord,
            'message' => 'Word updated successfully'
        ]);
        
    } catch (PDOException $e) {
        sendErrorResponse(500, 'Database error occurred', $e->getMessage());
    }
}

/**
 * DELETE - Supprimer un mot
 */
function handleDeleteWord(WordRepository $wordRepo) {
    $wordId = $_GET['id'] ?? null;
    
    if (!$wordId) {
        sendErrorResponse(400, 'Parameter id is required');
        return;
    }
    
    $idValidation = Validator::validateInt($wordId, 1);
    if (!empty($idValidation['errors'])) {
        sendErrorResponse(400, implode(', ', $idValidation['errors']));
        return;
    }
    
    try {
        // Vérifier que le mot existe
        $existingWord = $wordRepo->findById($idValidation['value']);
        if (!$existingWord) {
            sendErrorResponse(404, 'Word not found');
            return;
        }
        
        // Supprimer le mot
        $success = $wordRepo->delete($idValidation['value']);
        if (!$success) {
            sendErrorResponse(500, 'Failed to delete word');
            return;
        }
        
        sendSuccessResponse([
            'message' => 'Word deleted successfully',
            'deleted_word' => $existingWord['word']
        ]);
        
    } catch (PDOException $e) {
        sendErrorResponse(500, 'Database error occurred', $e->getMessage());
    }
}
?>