<?php
/**
 * Contrôleur pour la gestion des mots
 * Hérite de BaseAdminController pour éliminer la duplication
 * 
 * @version 1.0.0
 */

require_once __DIR__ . '/BaseAdminController.php';
require_once __DIR__ . '/StringUtility.php';
require_once __DIR__ . '/WordRepository.php';

class WordController extends BaseAdminController {
    private WordRepository $repository;
    
    public function __construct(PDO $db) {
        parent::__construct($db, 'word');
        $this->repository = new WordRepository($db);
    }
    
    // ===== SURCHARGE POUR GESTION BULK =====
    
    protected function handlePost(): void {
        // Vérifier si c'est un ajout en lot (bulk)
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (isset($input['bulk']) && $input['bulk'] === true && isset($input['words'])) {
            $this->handleBulkCreate($input);
        } else {
            // Appeler la méthode parent pour l'ajout normal
            parent::handlePost();
        }
    }
    
    // ===== IMPLÉMENTATION DES MÉTHODES ABSTRAITES =====
    
    protected function findById(int $id): ?array {
        return $this->repository->findById($id);
    }
    
    protected function findWithPagination(array $params): array {
        // Utilise les paramètres pour la recherche et filtrage
        return $this->repository->findWithPagination(
            $params['page'] ?? 1, 
            $params['limit'] ?? 50, 
            $params['search'] ?? ''
        );
    }
    
    protected function create(array $data): int {
        // Nettoyer le mot
        $data['word'] = StringUtility::cleanWord($data['word']);
        
        // Vérifier l'unicité dans la catégorie
        if ($this->repository->existsInCategory($data['word'], $data['category_id'])) {
            throw new InvalidArgumentException('This word already exists in this category');
        }
        
        return $this->repository->create($data);
    }
    
    protected function update(int $id, array $data): bool {
        // Récupérer le mot actuel d'abord
        $currentWord = $this->repository->findById($id);
        if (!$currentWord) {
            throw new InvalidArgumentException('Word not found');
        }
        
        // Nettoyer le mot si fourni
        if (isset($data['word'])) {
            $data['word'] = StringUtility::cleanWord($data['word']);
            
            $categoryId = $data['category_id'] ?? $currentWord['category_id'];
            
            // Vérifier l'unicité dans la catégorie (sauf pour le mot actuel)
            if ($this->repository->existsInCategory($data['word'], $categoryId, $id)) {
                throw new InvalidArgumentException('This word already exists in this category');
            }
        }
        
        return $this->repository->update($id, $data);
    }
    
    protected function delete(int $id): bool {
        return $this->repository->delete($id);
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
        return [
            'id' => (int) $item['id'],
            'word' => $item['word'],
            'category_id' => (int) $item['category_id'],
            'difficulty' => $item['difficulty'] ?? 'medium',
            'active' => (bool) ($item['active'] ?? true),
            'created_at' => $item['created_at'] ?? null,
            'updated_at' => $item['updated_at'] ?? null
        ];
    }
    
    // ===== AJOUT EN LOT =====
    
    private function handleBulkCreate(array $input): void {
        try {
            $this->db->beginTransaction();
            
            $results = [
                'success_count' => 0,
                'error_count' => 0,
                'created_words' => [],
                'errors' => [],
                'duplicates' => []
            ];
            
            $words = $input['words'] ?? [];
            $defaultData = [
                'category_id' => $input['category_id'] ?? null,
                'difficulty' => $input['difficulty'] ?? 'medium',
                'active' => $input['active'] ?? true
            ];
            $allowDuplicates = $input['allow_duplicates'] ?? false;
            
            // Validation des données communes
            $validation = $this->validateForCreate($defaultData);
            if (!empty($validation['errors'])) {
                $this->response->badRequest('Validation failed', $validation['errors']);
                return;
            }
            $defaultData = $validation['data'];
            
            foreach ($words as $wordText) {
                $wordText = trim($wordText);
                if (empty($wordText)) continue;
                
                try {
                    $wordData = array_merge($defaultData, ['word' => $wordText]);
                    $wordData['word'] = StringUtility::cleanWord($wordData['word']);
                    
                    // Vérifier l'unicité dans la catégorie
                    if ($this->repository->existsInCategory($wordData['word'], $wordData['category_id'])) {
                        if ($allowDuplicates) {
                            $results['duplicates'][] = $wordData['word'];
                            continue;
                        } else {
                            $results['errors'][] = "'{$wordData['word']}' already exists in this category";
                            $results['error_count']++;
                            continue;
                        }
                    }
                    
                    $id = $this->repository->create($wordData);
                    $createdWord = $this->repository->findById($id);
                    
                    $results['created_words'][] = $this->transformForResponse($createdWord);
                    $results['success_count']++;
                    
                } catch (Exception $e) {
                    $results['errors'][] = "'{$wordText}': " . $e->getMessage();
                    $results['error_count']++;
                }
            }
            
            $this->db->commit();
            
            $message = sprintf(
                'Bulk operation completed: %d created, %d errors, %d duplicates', 
                $results['success_count'], 
                $results['error_count'],
                count($results['duplicates'])
            );
            
            $this->response->success($results, ['message' => $message]);
            
        } catch (Exception $e) {
            $this->db->rollBack();
            $this->response->error(500, 'Bulk operation failed', $e->getMessage());
        }
    }
}