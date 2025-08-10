<?php
/**
 * Tests CRUD pour l'API des catégories
 */

use PHPUnit\Framework\TestCase;

class CategoriesApiTest extends TestCase {
    private static $testCategoryId = null;
    
    protected function setUp(): void {
        // Login avant chaque test
        $loginSuccess = TestHttpClient::login($_ENV['ADMIN_USERNAME'], $_ENV['ADMIN_PASSWORD']);
        if (!$loginSuccess) {
            $this->markTestSkipped('Cannot login to admin');
        }
    }
    
    protected function tearDown(): void {
        // Nettoyer la catégorie de test si elle existe
        if (self::$testCategoryId) {
            TestHttpClient::request('DELETE', '/api/admin/categories.php?id=' . self::$testCategoryId);
            self::$testCategoryId = null;
        }
    }
    
    /**
     * Test GET - Récupérer toutes les catégories
     */
    public function testGetAllCategories(): void {
        $response = TestHttpClient::request('GET', '/api/admin/categories.php');
        
        // Debug pour voir la réponse complète
        if ($response['code'] !== 200 || !is_array($response['body'])) {
            echo "Response code: " . $response['code'] . "\n";
            echo "Response body: " . json_encode($response['body']) . "\n";
        }
        
        $this->assertEquals(200, $response['code']);
        $this->assertIsArray($response['body'], 'Response body should be an array');
        $this->assertTrue($response['body']['success']);
        $this->assertArrayHasKey('data', $response['body']);
        $this->assertIsArray($response['body']['data']);
        
        // Vérifier la structure d'une catégorie si elles existent
        if (!empty($response['body']['data'])) {
            $category = $response['body']['data'][0];
            $this->assertArrayHasKey('id', $category);
            $this->assertArrayHasKey('name', $category);
            $this->assertArrayHasKey('slug', $category);
            $this->assertArrayHasKey('icon', $category);
            $this->assertArrayHasKey('words_count', $category);
        }
    }
    
    /**
     * Test POST - Créer une catégorie valide
     */
    public function testCreateValidCategory(): void {
        $unique = uniqid();
        $categoryData = [
            'name' => 'Test Category PHPUnit ' . $unique,
            'icon' => '🧪',
            'slug' => 'test-category-phpunit-' . $unique,
            'description' => 'Catégorie créée pour les tests PHPUnit',
        ];
        
        $response = TestHttpClient::request('POST', '/api/admin/categories.php', $categoryData);
        
        // Debug en cas d'erreur
        if ($response['code'] !== 201) {
            echo "Response code: " . $response['code'] . "\n";
            echo "Response body: " . json_encode($response['body']) . "\n";
        }
        
        $this->assertEquals(201, $response['code'], 'Should return 201 for valid category creation');
        $this->assertTrue($response['body']['success'], 'Creation should be successful');
        $this->assertArrayHasKey('data', $response['body']);
        
        $createdCategory = $response['body']['data'];
        $this->assertArrayHasKey('id', $createdCategory);
        $this->assertEquals($categoryData['name'], $createdCategory['name']);
        $this->assertEquals($categoryData['icon'], $createdCategory['icon']);
        $this->assertEquals($categoryData['slug'], $createdCategory['slug']);
        
        // Stocker l'ID pour le cleanup
        self::$testCategoryId = $createdCategory['id'];
    }
    
    /**
     * Test POST - Créer une catégorie sans nom (invalide)
     */
    public function testCreateCategoryWithoutName(): void {
        $categoryData = [
            'icon' => '🧪',
            'slug' => 'no-name-category'
        ];
        
        $response = TestHttpClient::request('POST', '/api/admin/categories.php', $categoryData);
        
        $this->assertEquals(400, $response['code'], 'Should return 400 for missing name');
        $this->assertFalse($response['body']['success'], 'Creation should fail');
        $this->assertArrayHasKey('error', $response['body']);
        $this->assertArrayHasKey('details', $response['body']['error']);
    }
    
    /**
     * Test POST - Créer une catégorie avec slug en doublon
     */
    public function testCreateCategoryWithDuplicateSlug(): void {
        $unique = uniqid();
        $duplicateSlug = 'duplicate-slug-test-' . $unique;
        
        // Créer la première catégorie
        $categoryData1 = [
            'name' => 'First Category ' . $unique,
            'icon' => '🥇',
            'slug' => $duplicateSlug
        ];
        
        $response1 = TestHttpClient::request('POST', '/api/admin/categories.php', $categoryData1);
        $this->assertEquals(201, $response1['code']);
        self::$testCategoryId = $response1['body']['data']['id'];
        
        // Essayer de créer une deuxième catégorie avec le même slug
        $categoryData2 = [
            'name' => 'Second Category ' . $unique,
            'icon' => '🥈',
            'slug' => $duplicateSlug
        ];
        
        $response2 = TestHttpClient::request('POST', '/api/admin/categories.php', $categoryData2);
        
        $this->assertEquals(400, $response2['code'], 'Should return error for duplicate slug');
        $this->assertFalse($response2['body']['success'], 'Creation should fail');
        $this->assertStringContainsString('already exists', $response2['body']['error']['message'] ?? '');
    }
    
    /**
     * Test POST - Créer une catégorie avec génération automatique de slug
     */
    public function testCreateCategoryWithAutoGeneratedSlug(): void {
        $unique = uniqid();
        $categoryData = [
            'name' => 'Auto Slug Category ' . $unique,
            'icon' => '🔄'
            // Pas de slug fourni
        ];
        
        $response = TestHttpClient::request('POST', '/api/admin/categories.php', $categoryData);
        
        $this->assertEquals(201, $response['code']);
        $this->assertTrue($response['body']['success']);
        
        $createdCategory = $response['body']['data'];
        $this->assertNotEmpty($createdCategory['slug'], 'Slug should be auto-generated');
        $this->assertStringStartsWith('auto-slug-category', $createdCategory['slug'], 'Slug should be generated from name');
        
        self::$testCategoryId = $createdCategory['id'];
    }
    
    /**
     * Test GET - Récupérer une catégorie par ID
     */
    public function testGetCategoryById(): void {
        // Créer d'abord une catégorie
        $unique = uniqid();
        $categoryData = [
            'name' => 'Get By ID Test ' . $unique,
            'icon' => '🆔',
            'slug' => 'get-by-id-test-' . $unique
        ];
        
        $createResponse = TestHttpClient::request('POST', '/api/admin/categories.php', $categoryData);
        $categoryId = $createResponse['body']['data']['id'];
        self::$testCategoryId = $categoryId;
        
        // Récupérer par ID
        $response = TestHttpClient::request('GET', "/api/admin/categories.php?id={$categoryId}");
        
        $this->assertEquals(200, $response['code']);
        $this->assertTrue($response['body']['success']);
        $this->assertArrayHasKey('data', $response['body']);
        
        $category = $response['body']['data'];
        $this->assertEquals($categoryId, $category['id']);
        $this->assertEquals($categoryData['name'], $category['name']);
    }
    
    /**
     * Test GET - Récupérer une catégorie inexistante
     */
    public function testGetNonExistentCategory(): void {
        $response = TestHttpClient::request('GET', '/api/admin/categories.php?id=99999');
        
        $this->assertEquals(404, $response['code']);
        $this->assertFalse($response['body']['success']);
        $this->assertArrayHasKey('error', $response['body']);
        $this->assertStringContainsString('not found', $response['body']['error']['message'] ?? '');
    }
    
    /**
     * Test PUT - Modifier une catégorie
     */
    public function testUpdateCategory(): void {
        $unique = uniqid();
        
        // Créer d'abord une catégorie
        $originalData = [
            'name' => 'Original Category ' . $unique,
            'icon' => '📝',
            'slug' => 'original-category-' . $unique,
            'description' => 'Original description',
        ];
        
        $createResponse = TestHttpClient::request('POST', '/api/admin/categories.php', $originalData);
        $categoryId = $createResponse['body']['data']['id'];
        self::$testCategoryId = $categoryId;
        
        // Modifier la catégorie
        $updateData = [
            'id' => $categoryId,
            'name' => 'Updated Category ' . $unique,
            'icon' => '✏️',
            'slug' => 'updated-category-' . $unique,
            'description' => 'Updated description',
        ];
        
        $response = TestHttpClient::request('PUT', '/api/admin/categories.php', $updateData);
        
        $this->assertEquals(200, $response['code']);
        $this->assertTrue($response['body']['success']);
        
        // Vérifier les modifications en récupérant la catégorie
        $getResponse = TestHttpClient::request('GET', "/api/admin/categories.php?id={$categoryId}");
        $updatedCategory = $getResponse['body']['data'];
        
        $this->assertEquals($updateData['name'], $updatedCategory['name']);
        $this->assertEquals($updateData['icon'], $updatedCategory['icon']);
        $this->assertEquals($updateData['slug'], $updatedCategory['slug']);
    }
    
    /**
     * Test PUT - Modifier une catégorie inexistante
     */
    public function testUpdateNonExistentCategory(): void {
        $updateData = [
            'id' => 99999,
            'name' => 'Non Existent Category'
        ];
        
        $response = TestHttpClient::request('PUT', '/api/admin/categories.php', $updateData);
        
        $this->assertEquals(404, $response['code']);
        $this->assertFalse($response['body']['success']);
        $this->assertStringContainsString('not found', $response['body']['error']['message'] ?? '');
    }
    
    /**
     * Test DELETE - Supprimer une catégorie
     */
    public function testDeleteCategory(): void {
        $unique = uniqid();
        
        // Créer d'abord une catégorie
        $categoryData = [
            'name' => 'Category To Delete ' . $unique,
            'icon' => '🗑️',
            'slug' => 'category-to-delete-' . $unique
        ];
        
        $createResponse = TestHttpClient::request('POST', '/api/admin/categories.php', $categoryData);
        
        // Debug if creation failed
        if ($createResponse['code'] !== 201) {
            echo "Create failed: " . json_encode($createResponse['body']) . "\n";
        }
        
        $this->assertEquals(201, $createResponse['code'], 'Category creation should succeed');
        $categoryId = $createResponse['body']['data']['id'];
        
        // Supprimer la catégorie
        $response = TestHttpClient::request('DELETE', "/api/admin/categories.php?id={$categoryId}");
        
        // Debug en cas d'erreur
        if ($response['code'] !== 200) {
            echo "Delete failed with code " . $response['code'] . ": " . json_encode($response['body']) . "\n";
        }
        
        $this->assertEquals(200, $response['code']);
        $this->assertTrue($response['body']['success'] ?? false, 'Delete response should have success=true');
        
        // Vérifier que la catégorie n'existe plus
        $getResponse = TestHttpClient::request('GET', "/api/admin/categories.php?id={$categoryId}");
        $this->assertEquals(404, $getResponse['code']);
        
        // Pas besoin de cleanup car la catégorie est supprimée
        self::$testCategoryId = null;
    }
    
    /**
     * Test DELETE - Supprimer une catégorie inexistante
     */
    public function testDeleteNonExistentCategory(): void {
        $response = TestHttpClient::request('DELETE', '/api/admin/categories.php?id=99999');
        
        $this->assertEquals(404, $response['code']);
        $this->assertFalse($response['body']['success']);
        $this->assertStringContainsString('not found', $response['body']['error']['message'] ?? '');
    }
    
    /**
     * Test POST - Créer une catégorie avec JSON invalide
     */
    public function testCreateCategoryWithInvalidJson(): void {
        // Envoyer du JSON invalide avec cookies appropriés
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, API_BASE_URL . '/api/admin/categories.php');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, '{invalid json}');
        curl_setopt($ch, CURLOPT_COOKIEFILE, '/tmp/phpunit_cookies.txt');
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        $this->assertEquals(400, $httpCode);
        
        $responseData = json_decode($response, true);
        $this->assertFalse($responseData['success']);
        $this->assertArrayHasKey('error', $responseData);
    }
}