<?php
/**
 * Repository pour la gestion des mots
 * Principe SOLID : Single Responsibility - opérations de base de données pour les mots
 * Principe SOLID : Dependency Inversion - dépend d'abstraction (PDO)
 * 
 * @version 1.0.0
 */

class WordRepository {
    private PDO $db;
    
    public function __construct(PDO $db) {
        $this->db = $db;
    }
    
    /**
     * Récupère tous les mots (pour l'admin)
     */
    public function findAll(): array {
        $stmt = $this->db->query("
            SELECT 
                w.id, w.word, w.difficulty, w.active,
                w.created_at, w.updated_at,
                c.name as category_name, c.id as category_id
            FROM hangman_words w 
            LEFT JOIN hangman_categories c ON w.category_id = c.id
            WHERE w.active = 1
            ORDER BY c.name ASC, w.word ASC
        ");
        
        return $stmt->fetchAll();
    }
    
    /**
     * Récupère tous les mots avec pagination (pour l'admin)
     */
    public function findWithPagination(int $page = 1, int $limit = 50, string $search = ''): array {
        $offset = ($page - 1) * $limit;
        
        // Construction de la requête avec recherche optionnelle
        $whereClause = "w.active = 1";
        $params = [];
        
        if (!empty($search)) {
            $whereClause .= " AND (w.word LIKE ? OR c.name LIKE ?)";
            $params[] = "%{$search}%";
            $params[] = "%{$search}%";
        }
        
        // Compter le total
        $countStmt = $this->db->prepare("
            SELECT COUNT(*) 
            FROM hangman_words w 
            LEFT JOIN hangman_categories c ON w.category_id = c.id
            WHERE {$whereClause}
        ");
        $countStmt->execute($params);
        $total = $countStmt->fetchColumn();
        
        // Récupérer les mots
        $wordsStmt = $this->db->prepare("
            SELECT 
                w.id, w.word, w.difficulty, w.active,
                w.created_at, w.updated_at,
                c.name as category_name, c.id as category_id
            FROM hangman_words w 
            LEFT JOIN hangman_categories c ON w.category_id = c.id
            WHERE {$whereClause}
            ORDER BY c.name ASC, w.word ASC
            LIMIT ? OFFSET ?
        ");
        $params[] = $limit;
        $params[] = $offset;
        $wordsStmt->execute($params);
        
        return [
            'items' => $wordsStmt->fetchAll(),
            'total' => (int) $total,
            'page' => $page,
            'limit' => $limit
        ];
    }
    
    /**
     * Récupère les mots d'une catégorie avec pagination
     */
    public function findByCategoryWithPagination(int $categoryId, int $page = 1, int $limit = 50, string $search = ''): array {
        $offset = ($page - 1) * $limit;
        
        // Construction de la requête avec recherche optionnelle
        $whereClause = "w.category_id = ? AND w.active = 1";
        $params = [$categoryId];
        
        if (!empty($search)) {
            $whereClause .= " AND w.word LIKE ?";
            $params[] = "%{$search}%";
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
        
        return [
            'words' => $wordsStmt->fetchAll(),
            'total' => (int) $total
        ];
    }
    
    /**
     * Trouve un mot par son ID
     */
    public function findById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT id, word, category_id, difficulty, 
                   active, created_at, updated_at
            FROM hangman_words 
            WHERE id = ?
        ");
        $stmt->execute([$id]);
        $result = $stmt->fetch();
        
        return $result ?: null;
    }
    
    /**
     * Vérifie si un mot existe dans une catégorie
     */
    public function existsInCategory(string $word, int $categoryId, ?int $excludeId = null): bool {
        $sql = "SELECT id FROM hangman_words WHERE word = ? AND category_id = ?";
        $params = [$word, $categoryId];
        
        if ($excludeId) {
            $sql .= " AND id != ?";
            $params[] = $excludeId;
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetch() !== false;
    }
    
    /**
     * Crée un nouveau mot
     */
    public function create(array $wordData): int {
        $stmt = $this->db->prepare("
            INSERT INTO hangman_words (
                word, category_id, difficulty,
                active
            ) VALUES (?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $wordData['word'], // Déjà nettoyé par le controller (DRY)
            $wordData['category_id'],
            $wordData['difficulty'] ?? 'medium',
            $wordData['active'] ?? 1
        ]);
        
        return $this->db->lastInsertId();
    }
    
    /**
     * Met à jour un mot
     */
    public function update(int $id, array $updateData): bool {
        $allowedFields = ['word', 'difficulty', 'active'];
        $updates = [];
        $params = [];
        
        foreach ($allowedFields as $field) {
            if (isset($updateData[$field])) {
                $updates[] = "{$field} = ?";
                if ($field === 'active') {
                    $params[] = $updateData[$field] ? 1 : 0;
                } else {
                    $params[] = $updateData[$field]; // Déjà nettoyé par le controller (DRY)
                }
            }
        }
        
        if (empty($updates)) {
            return false;
        }
        
        $params[] = $id;
        
        $stmt = $this->db->prepare("
            UPDATE hangman_words 
            SET " . implode(', ', $updates) . ", updated_at = NOW()
            WHERE id = ?
        ");
        
        return $stmt->execute($params);
    }
    
    /**
     * Supprime un mot
     */
    public function delete(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM hangman_words WHERE id = ?");
        return $stmt->execute([$id]);
    }
    
    /**
     * Récupère les statistiques d'une catégorie
     */
    public function getCategoryStats(int $categoryId): array {
        $stmt = $this->db->prepare("
            SELECT 
                COUNT(*) as total_words,
                COUNT(CASE WHEN difficulty = 'easy' THEN 1 END) as easy_words,
                COUNT(CASE WHEN difficulty = 'medium' THEN 1 END) as medium_words,
                COUNT(CASE WHEN difficulty = 'hard' THEN 1 END) as hard_words,
            FROM hangman_words 
            WHERE category_id = ? AND active = 1
        ");
        $stmt->execute([$categoryId]);
        
        return $stmt->fetch() ?: [];
    }
    
    /**
     * Récupère tous les mots d'une catégorie (pour l'export)
     */
    public function findAllByCategory(int $categoryId): array {
        $stmt = $this->db->prepare("
            SELECT * FROM hangman_words 
            WHERE category_id = ? 
            ORDER BY word ASC
        ");
        $stmt->execute([$categoryId]);
        
        return $stmt->fetchAll();
    }
    
    /**
     * Supprime tous les mots d'une catégorie
     */
    public function deleteByCategory(int $categoryId): bool {
        $stmt = $this->db->prepare("DELETE FROM hangman_words WHERE category_id = ?");
        return $stmt->execute([$categoryId]);
    }
    
    /**
     * Compte le nombre total de mots
     */
    public function countAll(): int {
        $stmt = $this->db->query("SELECT COUNT(*) FROM hangman_words WHERE active = 1");
        return $stmt->fetchColumn();
    }
    
    /**
     * Import en masse de mots pour une catégorie
     */
    public function bulkImport(int $categoryId, array $words): array {
        $this->db->beginTransaction();
        $imported = 0;
        $errors = [];
        
        try {
            $stmt = $this->db->prepare("
                INSERT INTO hangman_words (
                    word, category_id, difficulty
                ) VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                difficulty = VALUES(difficulty)
            ");
            
            foreach ($words as $wordData) {
                try {
                    $wordText = is_string($wordData) ? $wordData : ($wordData['word'] ?? '');
                    
                    $stmt->execute([
                        StringUtility::cleanWord($wordText),
                        $categoryId,
                        is_array($wordData) ? ($wordData['difficulty'] ?? 'medium') : 'medium'
                    ]);
                    
                    $imported++;
                } catch (Exception $e) {
                    $errors[] = "Mot '{$wordText}': " . $e->getMessage();
                }
            }
            
            $this->db->commit();
            
            return [
                'imported' => $imported,
                'errors' => $errors
            ];
            
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}