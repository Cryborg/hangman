<?php
/**
 * Tests CRUD pour l'API des mots
 */

use PHPUnit\Framework\TestCase;

class WordsApiTest extends TestCase {
    private static $testWordId = null;
    private static $testCategoryId = null;
    
    protected function setUp(): void {
        // Login avant chaque test
        $loginSuccess = TestHttpClient::login($_ENV['ADMIN_USERNAME'], $_ENV['ADMIN_PASSWORD']);
        if (!$loginSuccess) {
            $this->markTestSkipped('Cannot login to admin');
        }
        
        // Créer une catégorie de test si nécessaire
        if (self::$testCategoryId === null) {
            $unique = uniqid();
            $categoryData = [
                'name' => 'Test Category for Words ' . $unique,
                'icon' => '📝',
                'slug' => 'test-category-words-' . $unique
            ];
            
            $response = TestHttpClient::request('POST', '/api/admin/categories.php', $categoryData);
            if ($response['code'] === 201) {
                self::$testCategoryId = $response['body']['data']['id'];
            }
        }
    }
    
    protected function tearDown(): void {
        // Nettoyer le mot de test si il existe
        if (self::$testWordId) {
            TestHttpClient::request('DELETE', '/api/admin/words.php?id=' . self::$testWordId);
            self::$testWordId = null;
        }
    }
    
    public static function tearDownAfterClass(): void {
        // Nettoyer la catégorie de test
        if (self::$testCategoryId) {
            TestHttpClient::login($_ENV['ADMIN_USERNAME'], $_ENV['ADMIN_PASSWORD']);
            TestHttpClient::request('DELETE', '/api/admin/categories.php?id=' . self::$testCategoryId);
            self::$testCategoryId = null;
        }
    }
    
    /**
     * Test GET - Récupérer tous les mots
     */
    public function testGetAllWords(): void {
        $response = TestHttpClient::request('GET', '/api/admin/words.php');
        
        $this->assertEquals(200, $response['code']);
        $this->assertTrue($response['body']['success']);
        $this->assertArrayHasKey('data', $response['body']);
        $this->assertIsArray($response['body']['data']);
        
        // Vérifier la structure d'un mot si ils existent
        if (!empty($response['body']['data'])) {
            $word = $response['body']['data'][0];
            $this->assertArrayHasKey('id', $word);
            $this->assertArrayHasKey('word', $word);
            $this->assertArrayHasKey('category_id', $word);
            $this->assertArrayHasKey('difficulty', $word);
            $this->assertArrayHasKey('active', $word);
        }
    }
    
    /**
     * Test POST - Créer un mot valide
     */
    public function testCreateValidWord(): void {
        if (!self::$testCategoryId) {
            $this->markTestSkipped('Test category not available');
        }
        
        $wordData = [
            'word' => 'PHPUNIT',
            'category_id' => self::$testCategoryId,
            'difficulty' => 'medium',
            'active' => true
        ];
        
        $response = TestHttpClient::request('POST', '/api/admin/words.php', $wordData);
        
        $this->assertEquals(201, $response['code'], 'Should return 201 for valid word creation');
        $this->assertTrue($response['body']['success'], 'Creation should be successful');
        $this->assertArrayHasKey('data', $response['body']);
        
        $createdWord = $response['body']['data'];
        $this->assertArrayHasKey('id', $createdWord);
        $this->assertEquals($wordData['word'], $createdWord['word']);
        $this->assertEquals($wordData['category_id'], $createdWord['category_id']);
        $this->assertEquals($wordData['difficulty'], $createdWord['difficulty']);
        $this->assertEquals($wordData['active'], $createdWord['active']);
        
        // Stocker l'ID pour le cleanup
        self::$testWordId = $createdWord['id'];
    }
    
    /**
     * Test POST - Créer un mot sans mot (invalide)
     */
    public function testCreateWordWithoutWord(): void {
        if (!self::$testCategoryId) {
            $this->markTestSkipped('Test category not available');
        }
        
        $wordData = [
            'category_id' => self::$testCategoryId,
            'difficulty' => 'easy'
        ];
        
        $response = TestHttpClient::request('POST', '/api/admin/words.php', $wordData);
        
        $this->assertEquals(400, $response['code'], 'Should return 400 for missing word');
        $this->assertFalse($response['body']['success'], 'Creation should fail');
        $this->assertArrayHasKey('error', $response['body']);
        $this->assertArrayHasKey('details', $response['body']['error']);
    }
    
    /**
     * Test POST - Créer un mot sans category_id (invalide)
     */
    public function testCreateWordWithoutCategoryId(): void {
        $wordData = [
            'word' => 'NOCATEGORY',
            'difficulty' => 'easy'
        ];
        
        $response = TestHttpClient::request('POST', '/api/admin/words.php', $wordData);
        
        $this->assertEquals(400, $response['code'], 'Should return 400 for missing category_id');
        $this->assertFalse($response['body']['success'], 'Creation should fail');
        $this->assertArrayHasKey('error', $response['body']);
        $this->assertArrayHasKey('details', $response['body']['error']);
    }
    
    /**
     * Test POST - Créer un mot en doublon dans la même catégorie
     */
    public function testCreateDuplicateWordInSameCategory(): void {
        if (!self::$testCategoryId) {
            $this->markTestSkipped('Test category not available');
        }
        
        // Créer le premier mot
        $wordData1 = [
            'word' => 'DUPLICATE',
            'category_id' => self::$testCategoryId,
            'difficulty' => 'easy'
        ];
        
        $response1 = TestHttpClient::request('POST', '/api/admin/words.php', $wordData1);
        $this->assertEquals(201, $response1['code']);
        self::$testWordId = $response1['body']['data']['id'];
        
        // Essayer de créer le même mot dans la même catégorie
        $wordData2 = [
            'word' => 'DUPLICATE',
            'category_id' => self::$testCategoryId,
            'difficulty' => 'hard'
        ];
        
        $response2 = TestHttpClient::request('POST', '/api/admin/words.php', $wordData2);
        
        $this->assertEquals(400, $response2['code'], 'Should return 400 for duplicate word in same category');
        $this->assertFalse($response2['body']['success'], 'Creation should fail');
        $this->assertStringContainsString('already exists', $response2['body']['error']['message'] ?? '');
    }
    
    /**
     * Test POST - Créer un mot avec difficulté invalide
     */
    public function testCreateWordWithInvalidDifficulty(): void {
        if (!self::$testCategoryId) {
            $this->markTestSkipped('Test category not available');
        }
        
        $wordData = [
            'word' => 'INVALIDDIFFICULTY',
            'category_id' => self::$testCategoryId,
            'difficulty' => 'invalid_level'
        ];
        
        $response = TestHttpClient::request('POST', '/api/admin/words.php', $wordData);
        
        $this->assertEquals(400, $response['code'], 'Should return 400 for invalid difficulty');
        $this->assertFalse($response['body']['success'], 'Creation should fail');
        $this->assertArrayHasKey('error', $response['body']);
    }
    
    /**
     * Test GET - Récupérer un mot par ID
     */
    public function testGetWordById(): void {
        if (!self::$testCategoryId) {
            $this->markTestSkipped('Test category not available');
        }
        
        // Créer d'abord un mot
        $wordData = [
            'word' => 'GETBYID',
            'category_id' => self::$testCategoryId,
            'difficulty' => 'medium'
        ];
        
        $createResponse = TestHttpClient::request('POST', '/api/admin/words.php', $wordData);
        $wordId = $createResponse['body']['data']['id'];
        self::$testWordId = $wordId;
        
        // Récupérer par ID
        $response = TestHttpClient::request('GET', "/api/admin/words.php?id={$wordId}");
        
        $this->assertEquals(200, $response['code']);
        $this->assertTrue($response['body']['success']);
        $this->assertArrayHasKey('data', $response['body']);
        
        $word = $response['body']['data'];
        $this->assertEquals($wordId, $word['id']);
        $this->assertEquals($wordData['word'], $word['word']);
        $this->assertEquals($wordData['category_id'], $word['category_id']);
    }
    
    /**
     * Test GET - Récupérer un mot inexistant
     */
    public function testGetNonExistentWord(): void {
        $response = TestHttpClient::request('GET', '/api/admin/words.php?id=99999');
        
        $this->assertEquals(404, $response['code']);
        $this->assertFalse($response['body']['success']);
        $this->assertArrayHasKey('error', $response['body']);
        $this->assertStringContainsString('not found', $response['body']['error']['message'] ?? '');
    }
    
    /**
     * Test PUT - Modifier un mot
     */
    public function testUpdateWord(): void {
        if (!self::$testCategoryId) {
            $this->markTestSkipped('Test category not available');
        }
        
        // Créer d'abord un mot
        $originalData = [
            'word' => 'ORIGINAL',
            'category_id' => self::$testCategoryId,
            'difficulty' => 'easy',
            'active' => true
        ];
        
        $createResponse = TestHttpClient::request('POST', '/api/admin/words.php', $originalData);
        $wordId = $createResponse['body']['data']['id'];
        self::$testWordId = $wordId;
        
        // Modifier le mot
        $updateData = [
            'id' => $wordId,
            'word' => 'UPDATED',
            'difficulty' => 'medium',  // Changé de 'hard' vers 'medium'
            'active' => false
        ];
        
        $response = TestHttpClient::request('PUT', '/api/admin/words.php', $updateData);
        
        $this->assertEquals(200, $response['code']);
        $this->assertTrue($response['body']['success'] ?? false, 'Update should have success=true');
        
        // Vérifier les modifications en récupérant le mot
        $getResponse = TestHttpClient::request('GET', "/api/admin/words.php?id={$wordId}");
        $updatedWord = $getResponse['body']['data'];
        
        $this->assertEquals($updateData['word'], $updatedWord['word']);
        $this->assertEquals($updateData['difficulty'], $updatedWord['difficulty']);
        $this->assertEquals($updateData['active'], $updatedWord['active']);
    }
    
    /**
     * Test PUT - Modifier un mot inexistant
     */
    public function testUpdateNonExistentWord(): void {
        $updateData = [
            'id' => 99999,
            'word' => 'NONEXISTENT'
        ];
        
        $response = TestHttpClient::request('PUT', '/api/admin/words.php', $updateData);
        
        $this->assertEquals(404, $response['code']);
        $this->assertFalse($response['body']['success']);
        $this->assertStringContainsString('not found', $response['body']['error']['message'] ?? '');
    }
    
    /**
     * Test DELETE - Supprimer un mot
     */
    public function testDeleteWord(): void {
        if (!self::$testCategoryId) {
            $this->markTestSkipped('Test category not available');
        }
        
        // Créer d'abord un mot
        $wordData = [
            'word' => 'TODELETE',
            'category_id' => self::$testCategoryId,
            'difficulty' => 'medium'
        ];
        
        $createResponse = TestHttpClient::request('POST', '/api/admin/words.php', $wordData);
        $wordId = $createResponse['body']['data']['id'];
        
        // Supprimer le mot
        $response = TestHttpClient::request('DELETE', "/api/admin/words.php?id={$wordId}");
        
        $this->assertEquals(200, $response['code']);
        $this->assertTrue($response['body']['success']);
        
        // Vérifier que le mot n'existe plus
        $getResponse = TestHttpClient::request('GET', "/api/admin/words.php?id={$wordId}");
        $this->assertEquals(404, $getResponse['code']);
        
        // Pas besoin de cleanup car le mot est supprimé
        self::$testWordId = null;
    }
    
    /**
     * Test DELETE - Supprimer un mot inexistant
     */
    public function testDeleteNonExistentWord(): void {
        $response = TestHttpClient::request('DELETE', '/api/admin/words.php?id=99999');
        
        $this->assertEquals(404, $response['code']);
        $this->assertFalse($response['body']['success']);
        $this->assertStringContainsString('not found', $response['body']['error']['message'] ?? '');
    }
    
    /**
     * Test GET - Récupérer les mots avec pagination
     */
    public function testGetWordsWithPagination(): void {
        $response = TestHttpClient::request('GET', '/api/admin/words.php?page=1&limit=5');
        
        $this->assertEquals(200, $response['code']);
        $this->assertTrue($response['body']['success']);
        $this->assertArrayHasKey('data', $response['body']);
        $this->assertArrayHasKey('meta', $response['body']);
        
        // Vérifier les métadonnées de pagination si implémentées
        if (isset($response['body']['meta']['pagination'])) {
            $pagination = $response['body']['meta']['pagination'];
            $this->assertArrayHasKey('current_page', $pagination);
            $this->assertArrayHasKey('per_page', $pagination);
        }
    }
    
    /**
     * Test avec nettoyage automatique du mot (majuscules, trim)
     */
    public function testWordCleaningAndNormalization(): void {
        if (!self::$testCategoryId) {
            $this->markTestSkipped('Test category not available');
        }
        
        $wordData = [
            'word' => '  lowercase word  ',  // avec espaces et minuscules
            'category_id' => self::$testCategoryId,
            'difficulty' => 'easy'
        ];
        
        $response = TestHttpClient::request('POST', '/api/admin/words.php', $wordData);
        
        $this->assertEquals(201, $response['code']);
        $this->assertTrue($response['body']['success']);
        
        $createdWord = $response['body']['data'];
        $this->assertEquals('LOWERCASE WORD', $createdWord['word'], 'Word should be cleaned and uppercased');
        
        self::$testWordId = $createdWord['id'];
    }
}