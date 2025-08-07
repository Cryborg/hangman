<?php
/**
 * Repository pour la gestion des tags
 * Principe SOLID : Single Responsibility - opérations de base de données pour les tags
 * Principe SOLID : Dependency Inversion - dépend d'abstraction (PDO)
 * 
 * @version 1.0.0
 */

class TagRepository {
    private PDO $db;
    
    public function __construct(PDO $db) {
        $this->db = $db;
    }
    
    /**
     * Récupère tous les tags actifs
     */
    public function findAll(): array {
        $stmt = $this->db->query("
            SELECT t.*, COUNT(ct.category_id) as category_count
            FROM hangman_tags t
            LEFT JOIN hangman_category_tag ct ON t.id = ct.tag_id
            GROUP BY t.id
            ORDER BY t.display_order ASC, t.name ASC
        ");
        
        return $stmt->fetchAll();
    }
    
    /**
     * Trouve un tag par son ID
     */
    public function findById(int $id): ?array {
        $stmt = $this->db->prepare("
            SELECT t.*, COUNT(ct.category_id) as category_count
            FROM hangman_tags t
            LEFT JOIN hangman_category_tag ct ON t.id = ct.tag_id
            WHERE t.id = ?
            GROUP BY t.id
        ");
        $stmt->execute([$id]);
        $result = $stmt->fetch();
        
        return $result ?: null;
    }
    
    /**
     * Trouve un tag par son slug
     */
    public function findBySlug(string $slug): ?array {
        $stmt = $this->db->prepare("
            SELECT t.*, COUNT(ct.category_id) as category_count
            FROM hangman_tags t
            LEFT JOIN hangman_category_tag ct ON t.id = ct.tag_id
            WHERE t.slug = ?
            GROUP BY t.id
        ");
        $stmt->execute([$slug]);
        $result = $stmt->fetch();
        
        return $result ?: null;
    }
    
    /**
     * Trouve un tag par son nom
     */
    public function findByName(string $name): ?array {
        $stmt = $this->db->prepare("
            SELECT t.*, COUNT(ct.category_id) as category_count
            FROM hangman_tags t
            LEFT JOIN hangman_category_tag ct ON t.id = ct.tag_id
            WHERE t.name = ?
            GROUP BY t.id
        ");
        $stmt->execute([$name]);
        $result = $stmt->fetch();
        
        return $result ?: null;
    }
    
    /**
     * Trouve plusieurs tags par leurs noms
     */
    public function findByNames(array $names): array {
        if (empty($names)) {
            return [];
        }
        
        $placeholders = str_repeat('?,', count($names) - 1) . '?';
        $stmt = $this->db->prepare("
            SELECT * FROM hangman_tags 
            WHERE name IN ({$placeholders})
            ORDER BY name ASC
        ");
        $stmt->execute($names);
        
        return $stmt->fetchAll();
    }
    
    /**
     * Vérifie si un tag existe par nom ou slug
     */
    public function existsByNameOrSlug(string $name, string $slug, ?int $excludeId = null): bool {
        $sql = "SELECT id FROM hangman_tags WHERE (name = ? OR slug = ?)";
        $params = [$name, $slug];
        
        if ($excludeId) {
            $sql .= " AND id != ?";
            $params[] = $excludeId;
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetch() !== false;
    }
    
    /**
     * Crée un nouveau tag
     */
    public function create(array $tagData): int {
        $stmt = $this->db->prepare("
            INSERT INTO hangman_tags (name, slug, color, display_order) 
            VALUES (?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $tagData['name'],
            $tagData['slug'] ?? StringUtility::generateSlug($tagData['name']),
            $tagData['color'] ?? '#3498db',
            $tagData['display_order'] ?? 0
        ]);
        
        return $this->db->lastInsertId();
    }
    
    /**
     * Met à jour un tag
     */
    public function update(int $id, array $updateData): bool {
        $allowedFields = ['name', 'slug', 'color', 'display_order'];
        $updates = [];
        $params = [];
        
        foreach ($allowedFields as $field) {
            if (isset($updateData[$field])) {
                $updates[] = "{$field} = ?";
                $params[] = $updateData[$field];
            }
        }
        
        if (empty($updates)) {
            return false;
        }
        
        $params[] = $id;
        
        $stmt = $this->db->prepare("
            UPDATE hangman_tags 
            SET " . implode(', ', $updates) . ", updated_at = NOW()
            WHERE id = ?
        ");
        
        return $stmt->execute($params);
    }
    
    /**
     * Supprime un tag et ses associations
     */
    public function delete(int $id): bool {
        $this->db->beginTransaction();
        
        try {
            // Supprimer les associations tags-catégories
            $this->db->prepare("DELETE FROM hangman_category_tag WHERE tag_id = ?")->execute([$id]);
            
            // Supprimer le tag
            $stmt = $this->db->prepare("DELETE FROM hangman_tags WHERE id = ?");
            $result = $stmt->execute([$id]);
            
            $this->db->commit();
            return $result;
            
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
    
    /**
     * Récupère les catégories associées à un tag
     */
    public function getCategories(int $tagId): array {
        $stmt = $this->db->prepare("
            SELECT c.*
            FROM hangman_categories c
            JOIN hangman_category_tag ct ON c.id = ct.category_id
            WHERE ct.tag_id = ? AND c.active = 1
            ORDER BY c.display_order ASC, c.name ASC
        ");
        $stmt->execute([$tagId]);
        
        return $stmt->fetchAll();
    }
    
    /**
     * Crée automatiquement un tag s'il n'existe pas
     */
    public function createIfNotExists(string $name, array $defaultData = []): int {
        // Chercher d'abord par nom
        $existing = $this->findByName($name);
        if ($existing) {
            return $existing['id'];
        }
        
        // Créer le tag
        return $this->create(array_merge([
            'name' => $name,
            'slug' => StringUtility::generateSlug($name),
            'color' => '#f39c12', // Couleur par défaut
            'display_order' => 0
        ], $defaultData));
    }
    
    /**
     * Import en masse de tags
     */
    public function bulkImport(array $tags): array {
        $imported = 0;
        $errors = [];
        
        try {
            $stmt = $this->db->prepare("
                INSERT INTO hangman_tags (name, slug, color, display_order) 
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                name = VALUES(name),
                color = VALUES(color),
                display_order = VALUES(display_order)
            ");
            
            foreach ($tags as $tagData) {
                try {
                    $stmt->execute([
                        $tagData['name'] ?? '',
                        $tagData['slug'] ?? StringUtility::generateSlug($tagData['name'] ?? ''),
                        $tagData['color'] ?? '#3498db',
                        $tagData['display_order'] ?? 0
                    ]);
                    
                    $imported++;
                    
                } catch (Exception $e) {
                    $errors[] = "Tag '{$tagData['name']}': " . $e->getMessage();
                }
            }
            
            return [
                'imported' => $imported,
                'errors' => $errors
            ];
            
        } catch (Exception $e) {
            throw $e;
        }
    }
    
    /**
     * Création/récupération en masse de tags par leurs noms
     */
    public function ensureTagsExist(array $tagNames): array {
        if (empty($tagNames)) {
            return [];
        }
        
        $tagIds = [];
        
        foreach ($tagNames as $tagName) {
            $tagName = trim($tagName);
            if (empty($tagName)) {
                continue;
            }
            
            // Chercher d'abord par nom, puis par slug
            $stmt = $this->db->prepare("SELECT id FROM hangman_tags WHERE name = ? OR slug = ?");
            $stmt->execute([$tagName, StringUtility::generateSlug($tagName)]);
            $tagId = $stmt->fetchColumn();
            
            if (!$tagId) {
                // Créer le tag
                $tagId = $this->createIfNotExists($tagName);
            }
            
            if ($tagId) {
                $tagIds[] = $tagId;
            }
        }
        
        return array_unique($tagIds);
    }
    
    /**
     * Recherche de tags
     */
    public function search(string $query): array {
        $stmt = $this->db->prepare("
            SELECT t.*, COUNT(ct.category_id) as category_count
            FROM hangman_tags t
            LEFT JOIN hangman_category_tag ct ON t.id = ct.tag_id
            WHERE t.name LIKE ? OR t.slug LIKE ?
            GROUP BY t.id
            ORDER BY t.name ASC
            LIMIT 20
        ");
        $searchTerm = "%{$query}%";
        $stmt->execute([$searchTerm, $searchTerm]);
        
        return $stmt->fetchAll();
    }
    
    /**
     * Récupère les tags les plus utilisés
     */
    public function findMostUsed(int $limit = 10): array {
        $stmt = $this->db->prepare("
            SELECT t.*, COUNT(ct.category_id) as category_count
            FROM hangman_tags t
            LEFT JOIN hangman_category_tag ct ON t.id = ct.tag_id
            GROUP BY t.id
            HAVING category_count > 0
            ORDER BY category_count DESC, t.name ASC
            LIMIT ?
        ");
        $stmt->execute([$limit]);
        
        return $stmt->fetchAll();
    }
}