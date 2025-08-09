<?php
/**
 * Contrôleur spécialisé pour la gestion des mots par catégorie
 * Hérite de BaseAdminController mais adapte le comportement pour un contexte catégorie
 * 
 * @version 1.0.0
 */

require_once __DIR__ . '/BaseAdminController.php';
require_once __DIR__ . '/StringUtility.php';
require_once __DIR__ . '/WordRepository.php';
require_once __DIR__ . '/CategoryRepository.php';

class CategoryWordsController extends BaseAdminController {
    private WordRepository $wordRepository;
    private CategoryRepository $categoryRepository;
    
    public function __construct(PDO $db) {
        parent::__construct($db, 'category-words');
        $this->wordRepository = new WordRepository($db);
        $this->categoryRepository = new CategoryRepository($db);
    }
    
    // ===== REDÉFINITION DU COMPORTEMENT GET =====
    
    protected function handleGet(): void {
        $categoryId = $_GET['category_id'] ?? null;
        
        if (!$categoryId) {
            $this->response->badRequest('Parameter category_id is required');
            return;
        }
        
        try {
            // Vérifier que la catégorie existe
            $category = $this->categoryRepository->findById((int) $categoryId);
            if (!$category) {
                $this->response->notFound('Category not found');
                return;
            }
            
            // Paramètres de pagination et filtres
            $page = (int) ($_GET['page'] ?? 1);
            $limit = (int) ($_GET['limit'] ?? 50);
            $search = $_GET['search'] ?? '';
            $difficulty = $_GET['difficulty'] ?? '';
            
            // Récupérer les mots avec pagination
            $wordsData = $this->findWordsByCategoryWithFilters(
                (int) $categoryId, 
                $page, 
                $limit, 
                $search,
                $difficulty
            );
            
            // Récupérer les statistiques de la catégorie
            $stats = $this->getCategoryStats((int) $categoryId);
            
            // Formatage de la réponse
            $response = [
                'category' => $this->transformCategoryForResponse($category),
                'words' => array_map([$this, 'transformWordForResponse'], $wordsData['words']),
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $limit,
                    'total' => $wordsData['total'],
                    'total_pages' => ceil($wordsData['total'] / $limit),
                    'has_more' => (($page - 1) * $limit + $limit) < $wordsData['total']
                ],
                'stats' => $stats,
                'filters' => [
                    'search' => $search,
                    'difficulty' => $difficulty
                ]
            ];
            
            $this->response->success($response);
            
        } catch (Exception $e) {
            $this->response->error(500, 'Database error occurred', $e->getMessage());
        }
    }
    
    // ===== IMPLÉMENTATION DES MÉTHODES ABSTRAITES =====
    
    protected function findById(int $id): ?array {
        return $this->wordRepository->findById($id);
    }
    
    protected function findWithPagination(array $params): array {
        // Non utilisé dans ce contexte
        return [];
    }
    
    protected function create(array $data): int {
        // Vérifier que la catégorie existe
        $categoryId = (int) $data['category_id'];
        $category = $this->categoryRepository->findById($categoryId);
        if (!$category) {
            throw new InvalidArgumentException('Category not found');
        }
        
        // Nettoyer le mot
        $data['word'] = StringUtility::cleanWord($data['word']);
        
        // Vérifier l'unicité dans la catégorie
        if ($this->wordRepository->existsInCategory($data['word'], $categoryId)) {
            throw new InvalidArgumentException('Word already exists in this category');
        }
        
        return $this->wordRepository->create($data);
    }
    
    protected function update(int $id, array $data): bool {
        // Nettoyer le mot si fourni
        if (isset($data['word'])) {
            $data['word'] = StringUtility::cleanWord($data['word']);
            
            // Vérifier l'unicité dans la catégorie si catégorie fournie
            if (isset($data['category_id'])) {
                if ($this->wordRepository->existsInCategory($data['word'], $data['category_id'], $id)) {
                    throw new InvalidArgumentException('Word already exists in this category');
                }
            }
        }
        
        return $this->wordRepository->update($id, $data);
    }
    
    protected function delete(int $id): bool {
        return $this->wordRepository->delete($id);
    }
    
    protected function validateForCreate(array $data): array {
        $errors = [];
        $validData = [];
        
        // Validation du mot
        $word = trim($data['word'] ?? '');
        if (empty($word)) {
            $errors[] = 'Word is required';
        } else {
            $validData['word'] = $word;
        }
        
        // Validation de la catégorie
        $categoryId = (int) ($data['category_id'] ?? 0);
        if ($categoryId <= 0) {
            $errors[] = 'Valid category ID is required';
        } else {
            $validData['category_id'] = $categoryId;
        }
        
        // Validation de la difficulté
        $difficultyValidation = Validator::validateDifficulty($data['difficulty'] ?? 'medium');
        if (!empty($difficultyValidation['errors'])) {
            $errors = array_merge($errors, $difficultyValidation['errors']);
        } else {
            $validData['difficulty'] = $difficultyValidation['value'];
        }
        
        // Active (optionnel)
        if (isset($data['active'])) {
            $validData['active'] = Validator::validateBoolean($data['active']);
        }
        
        return [
            'data' => $validData,
            'errors' => $errors
        ];
    }
    
    protected function validateForUpdate(array $data): array {
        $errors = [];
        $validData = [];
        
        // Validation du mot (optionnel en update)
        if (isset($data['word'])) {
            $word = trim($data['word']);
            if (empty($word)) {
                $errors[] = 'Word cannot be empty';
            } else {
                $validData['word'] = $word;
            }
        }
        
        // Validation de la catégorie (optionnel en update)
        if (isset($data['category_id'])) {
            $categoryId = (int) $data['category_id'];
            if ($categoryId <= 0) {
                $errors[] = 'Valid category ID is required';
            } else {
                $validData['category_id'] = $categoryId;
            }
        }
        
        // Validation de la difficulté (optionnel en update)
        if (isset($data['difficulty'])) {
            $difficultyValidation = Validator::validateDifficulty($data['difficulty']);
            if (!empty($difficultyValidation['errors'])) {
                $errors = array_merge($errors, $difficultyValidation['errors']);
            } else {
                $validData['difficulty'] = $difficultyValidation['value'];
            }
        }
        
        // Active (optionnel)
        if (isset($data['active'])) {
            $validData['active'] = Validator::validateBoolean($data['active']);
        }
        
        return [
            'data' => $validData,
            'errors' => $errors
        ];
    }
    
    protected function transformForResponse(array $item): array {
        return $this->transformWordForResponse($item);
    }
    
    // ===== MÉTHODES SPÉCIALISÉES =====
    
    /**
     * Transforme un mot pour la réponse
     */
    private function transformWordForResponse(array $word): array {
        return [
            'id' => (int) $word['id'],
            'word' => $word['word'],
            'difficulty' => $word['difficulty'] ?? 'medium',
            'active' => (bool) ($word['active'] ?? true),
            'created_at' => $word['created_at'] ?? null,
            'updated_at' => $word['updated_at'] ?? null
        ];
    }
    
    /**
     * Transforme une catégorie pour la réponse
     */
    private function transformCategoryForResponse(array $category): array {
        return [
            'id' => (int) $category['id'],
            'name' => $category['name'],
            'icon' => $category['icon'] ?? '📁',
            'slug' => $category['slug']
        ];
    }
    
    /**
     * Récupère les statistiques d'une catégorie
     */
    private function getCategoryStats(int $categoryId): array {
        $stmt = $this->db->prepare("
            SELECT 
                COUNT(*) as total_words,
                COUNT(CASE WHEN difficulty = 'easy' THEN 1 END) as easy_words,
                COUNT(CASE WHEN difficulty = 'medium' THEN 1 END) as medium_words,
                COUNT(CASE WHEN difficulty = 'hard' THEN 1 END) as hard_words
            FROM hangman_words 
            WHERE category_id = ? AND active = 1
        ");
        $stmt->execute([$categoryId]);
        $stats = $stmt->fetch();
        
        return [
            'total_words' => (int) $stats['total_words'],
            'easy_words' => (int) $stats['easy_words'],
            'medium_words' => (int) $stats['medium_words'],
            'hard_words' => (int) $stats['hard_words']
        ];
    }
    
    /**
     * Récupère les mots d'une catégorie avec filtres étendus (incluant difficulty)
     */
    private function findWordsByCategoryWithFilters(int $categoryId, int $page, int $limit, string $search, string $difficulty): array {
        $offset = ($page - 1) * $limit;
        
        // Construction de la requête avec recherche et difficulté optionnelles
        $whereClause = "w.category_id = ? AND w.active = 1";
        $params = [$categoryId];
        
        if (!empty($search)) {
            $whereClause .= " AND w.word LIKE ?";
            $params[] = "%{$search}%";
        }
        
        if (!empty($difficulty) && $difficulty !== 'all') {
            $whereClause .= " AND w.difficulty = ?";
            $params[] = $difficulty;
        }
        
        // Compter le total
        $countStmt = $this->db->prepare("
            SELECT COUNT(*) 
            FROM hangman_words w 
            WHERE {$whereClause}
        ");
        $countStmt->execute($params);
        $total = $countStmt->fetchColumn();
        
        // Récupérer les mots
        $wordsStmt = $this->db->prepare("
            SELECT 
                w.id, w.word, w.difficulty,
                w.active, w.created_at, w.updated_at
            FROM hangman_words w 
            WHERE {$whereClause}
            ORDER BY w.word ASC
            LIMIT ? OFFSET ?
        ");
        $params[] = $limit;
        $params[] = $offset;
        $wordsStmt->execute($params);
        $words = $wordsStmt->fetchAll();
        
        return [
            'words' => $words,
            'total' => (int) $total
        ];
    }
}