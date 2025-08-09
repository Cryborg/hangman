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
    
    // ===== IMPLÉMENTATION DES MÉTHODES ABSTRAITES =====
    
    protected function findById(int $id): ?array {
        return $this->repository->findById($id);
    }
    
    protected function findWithPagination(array $params): array {
        // Utilise les paramètres pour la recherche et filtrage
        return $this->repository->findWithPagination(
            $params['page'], 
            $params['limit'], 
            $params['search']
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
        // Nettoyer le mot si fourni
        if (isset($data['word'])) {
            $data['word'] = StringUtility::cleanWord($data['word']);
            
            // Vérifier l'unicité dans la catégorie (sauf pour le mot actuel)
            if ($this->repository->existsInCategory($data['word'], $data['category_id'], $id)) {
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
}