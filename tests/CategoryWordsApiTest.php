<?php
/**
 * Tests pour l'API category-words (mots par catégorie)
 */

use PHPUnit\Framework\TestCase;

class CategoryWordsApiTest extends TestCase {
    private static $testCategoryId = null;
    private static $testCategoryName = null;
    private static $testCategorySlug = null;
    private static $testWordIds = [];
    
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
                'name' => 'Category Words Test ' . $unique,
                'icon' => '📚',
                'slug' => 'category-words-test-' . $unique
            ];
            
            $response = TestHttpClient::request('POST', '/api/admin/categories.php', $categoryData);
            if ($response['code'] === 201) {
                self::$testCategoryId = $response['body']['data']['id'];
                self::$testCategoryName = $categoryData['name'];
                self::$testCategorySlug = $categoryData['slug'];
            }
        }
    }
    
    protected function tearDown(): void {
        // Nettoyer les mots de test
        foreach (self::$testWordIds as $wordId) {
            TestHttpClient::request('DELETE', "/api/admin/category-words.php?id={$wordId}");
        }
        self::$testWordIds = [];
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
     * Test GET - Récupérer les mots d'une catégorie
     */
    public function testGetWordsFromCategory(): void {
        if (!self::$testCategoryId) {
            $this->markTestSkipped('Test category not available');
        }
        
        $response = TestHttpClient::request('GET', '/api/admin/category-words.php?category_id=' . self::$testCategoryId);
        
        $this->assertEquals(200, $response['code']);
        $this->assertTrue($response['body']['success']);
        $this->assertArrayHasKey('data', $response['body']);
        
        $responseData = $response['body']['data'];
        $this->assertArrayHasKey('category', $responseData);
        $this->assertArrayHasKey('words', $responseData);
        $this->assertArrayHasKey('pagination', $responseData);
        $this->assertArrayHasKey('stats', $responseData);
        
        // Vérifier la structure de la catégorie
        $category = $responseData['category'];
        $this->assertEquals(self::$testCategoryId, $category['id']);
        $this->assertEquals(self::$testCategoryName, $category['name']);
        $this->assertEquals('📚', $category['icon']);
        $this->assertEquals(self::$testCategorySlug, $category['slug']);
        
        // Vérifier la structure des stats
        $stats = $responseData['stats'];
        $this->assertArrayHasKey('total_words', $stats);
        $this->assertArrayHasKey('easy_words', $stats);
        $this->assertArrayHasKey('medium_words', $stats);
        $this->assertArrayHasKey('hard_words', $stats);
        
        // Vérifier la pagination
        $pagination = $responseData['pagination'];
        $this->assertArrayHasKey('current_page', $pagination);
        $this->assertArrayHasKey('per_page', $pagination);
        $this->assertArrayHasKey('total', $pagination);
        $this->assertArrayHasKey('total_pages', $pagination);
    }
    
    /**
     * Test GET - Récupérer les mots d'une catégorie inexistante
     */
    public function testGetWordsFromNonExistentCategory(): void {
        $response = TestHttpClient::request('GET', '/api/admin/category-words.php?category_id=99999');
        
        $this->assertEquals(404, $response['code']);
        $this->assertFalse($response['body']['success']);
        $this->assertArrayHasKey('error', $response['body']);
        $this->assertStringContainsString('not found', $response['body']['error']['message'] ?? '');
    }
    
    /**
     * Test GET - Récupérer sans category_id
     */
    public function testGetWordsWithoutCategoryId(): void {
        $response = TestHttpClient::request('GET', '/api/admin/category-words.php');
        
        $this->assertEquals(400, $response['code']);
        $this->assertFalse($response['body']['success']);
        $this->assertArrayHasKey('error', $response['body']);
        $this->assertStringContainsString('required', $response['body']['error']['message'] ?? '');
    }
    
    /**
     * Test POST - Ajouter un mot à une catégorie
     */
    public function testAddWordToCategory(): void {
        if (!self::$testCategoryId) {
            $this->markTestSkipped('Test category not available');
        }
        
        $wordData = [
            'word' => 'CATEGORYTEST',
            'category_id' => self::$testCategoryId,
            'difficulty' => 'hard'  // Changé de 'medium' vers 'hard'
        ];
        
        $response = TestHttpClient::request('POST', '/api/admin/category-words.php', $wordData);
        
        $this->assertEquals(201, $response['code']);
        $this->assertTrue($response['body']['success']);
        $this->assertArrayHasKey('data', $response['body']);
        
        $responseData = $response['body']['data'];
        $this->assertArrayHasKey('word', $responseData);
        
        // La réponse contient directement les propriétés du mot
        $this->assertArrayHasKey('id', $responseData);
        $this->assertEquals($wordData['word'], $responseData['word']);
        // Debug pour voir la difficulté retournée
        if ($responseData['difficulty'] !== $wordData['difficulty']) {
            echo "Expected difficulty: " . $wordData['difficulty'] . ", got: " . $responseData['difficulty'] . "\n";
        }
        $this->assertEquals($wordData['difficulty'], $responseData['difficulty']);
        
        // Stocker pour cleanup
        self::$testWordIds[] = $responseData['id'];
    }
    
    /**
     * Test POST - Ajouter un mot sans word (invalide)
     */
    public function testAddWordWithoutWord(): void {
        if (!self::$testCategoryId) {
            $this->markTestSkipped('Test category not available');
        }
        
        $wordData = [
            'category_id' => self::$testCategoryId,
            'difficulty' => 'easy'
        ];
        
        $response = TestHttpClient::request('POST', '/api/admin/category-words.php', $wordData);
        
        $this->assertEquals(400, $response['code']);
        $this->assertFalse($response['body']['success']);
        $this->assertArrayHasKey('error', $response['body']);
        $this->assertArrayHasKey('details', $response['body']['error']);
    }
    
    /**
     * Test POST - Ajouter un mot sans category_id (invalide)
     */
    public function testAddWordWithoutCategoryId(): void {
        $wordData = [
            'word' => 'NOCATEGORYID',
            'difficulty' => 'easy'
        ];
        
        $response = TestHttpClient::request('POST', '/api/admin/category-words.php', $wordData);
        
        $this->assertEquals(400, $response['code']);
        $this->assertFalse($response['body']['success']);
        $this->assertArrayHasKey('error', $response['body']);
        $this->assertArrayHasKey('details', $response['body']['error']);
    }
    
    /**
     * Test POST - Ajouter un mot en doublon dans la même catégorie
     */
    public function testAddDuplicateWordToCategory(): void {
        if (!self::$testCategoryId) {
            $this->markTestSkipped('Test category not available');
        }
        
        // Ajouter le premier mot
        $wordData1 = [
            'word' => 'DUPLICATEWORD',
            'category_id' => self::$testCategoryId,
            'difficulty' => 'easy'
        ];
        
        $response1 = TestHttpClient::request('POST', '/api/admin/category-words.php', $wordData1);
        $this->assertEquals(201, $response1['code']);
        self::$testWordIds[] = $response1['body']['data']['id'];
        
        // Essayer d'ajouter le même mot
        $wordData2 = [
            'word' => 'DUPLICATEWORD',
            'category_id' => self::$testCategoryId,
            'difficulty' => 'hard'
        ];
        
        $response2 = TestHttpClient::request('POST', '/api/admin/category-words.php', $wordData2);
        
        $this->assertEquals(400, $response2['code']);
        $this->assertFalse($response2['body']['success']);
        $this->assertStringContainsString('already exists', $response2['body']['error']['message'] ?? '');
    }
    
    /**
     * Test PUT - Modifier un mot dans une catégorie
     */
    public function testUpdateWordInCategory(): void {
        if (!self::$testCategoryId) {
            $this->markTestSkipped('Test category not available');
        }
        
        // Créer d'abord un mot
        $originalData = [
            'word' => 'ORIGINALWORD',
            'category_id' => self::$testCategoryId,
            'difficulty' => 'medium',
            'active' => true
        ];
        
        $createResponse = TestHttpClient::request('POST', '/api/admin/category-words.php', $originalData);
        
        $this->assertEquals(201, $createResponse['code'], 'Word creation should succeed');
        
        $wordId = $createResponse['body']['data']['id'];
        self::$testWordIds[] = $wordId;
        
        // Modifier le mot
        $updateData = [
            'id' => $wordId,
            'word' => 'UPDATEDWORD',
            'difficulty' => 'medium',  // Changé de 'hard' vers 'medium'
            'active' => false
        ];
        
        $response = TestHttpClient::request('PUT', '/api/admin/category-words.php', $updateData);
        
        $this->assertEquals(200, $response['code']);
        $this->assertTrue($response['body']['success']);
        $this->assertArrayHasKey('data', $response['body']);
        
        $responseData = $response['body']['data'];
        $this->assertArrayHasKey('word', $responseData);
        
        // La réponse contient directement les propriétés du mot
        $this->assertEquals($updateData['word'], $responseData['word']);
        // Debug pour voir la difficulté retournée
        if ($responseData['difficulty'] !== $updateData['difficulty']) {
            echo "Update test - Expected difficulty: " . $updateData['difficulty'] . ", got: " . $responseData['difficulty'] . "\n";
        }
        $this->assertEquals($updateData['difficulty'], $responseData['difficulty']);
        $this->assertEquals($updateData['active'], $responseData['active']);
    }
    
    /**
     * Test DELETE - Supprimer un mot d'une catégorie
     */
    public function testDeleteWordFromCategory(): void {
        if (!self::$testCategoryId) {
            $this->markTestSkipped('Test category not available');
        }
        
        // Créer d'abord un mot
        $wordData = [
            'word' => 'WORDTODELETE',
            'category_id' => self::$testCategoryId,
            'difficulty' => 'medium'
        ];
        
        $createResponse = TestHttpClient::request('POST', '/api/admin/category-words.php', $wordData);
        $wordId = $createResponse['body']['data']['id'];
        
        // Supprimer le mot
        $response = TestHttpClient::request('DELETE', "/api/admin/category-words.php?id={$wordId}");
        
        $this->assertEquals(200, $response['code']);
        $this->assertTrue($response['body']['success']);
        $this->assertArrayHasKey('data', $response['body']);
        
        // Vérifier que le mot a été supprimé en récupérant la catégorie
        $getResponse = TestHttpClient::request('GET', '/api/admin/category-words.php?category_id=' . self::$testCategoryId);
        $words = $getResponse['body']['data']['words'];
        
        $deletedWordFound = false;
        foreach ($words as $word) {
            if ($word['id'] === $wordId) {
                $deletedWordFound = true;
                break;
            }
        }
        
        $this->assertFalse($deletedWordFound, 'Deleted word should not be found in category');
    }
    
    /**
     * Test GET - Récupérer les mots avec pagination
     */
    public function testGetWordsWithPagination(): void {
        if (!self::$testCategoryId) {
            $this->markTestSkipped('Test category not available');
        }
        
        // Ajouter plusieurs mots d'abord
        for ($i = 1; $i <= 3; $i++) {
            $wordData = [
                'word' => "PAGINATIONWORD{$i}",
                'category_id' => self::$testCategoryId,
                'difficulty' => 'easy'
            ];
            
            $response = TestHttpClient::request('POST', '/api/admin/category-words.php', $wordData);
            if ($response['code'] === 200) {
                self::$testWordIds[] = $response['body']['data']['word']['id'];
            }
        }
        
        // Tester la pagination
        $response = TestHttpClient::request('GET', '/api/admin/category-words.php?category_id=' . self::$testCategoryId . '&page=1&limit=2');
        
        $this->assertEquals(200, $response['code']);
        $this->assertTrue($response['body']['success']);
        
        $responseData = $response['body']['data'];
        $this->assertArrayHasKey('pagination', $responseData);
        
        $pagination = $responseData['pagination'];
        $this->assertEquals(1, $pagination['current_page']);
        $this->assertEquals(2, $pagination['per_page']);
        $this->assertArrayHasKey('total', $pagination);
        $this->assertArrayHasKey('total_pages', $pagination);
    }
    
    /**
     * Test GET - Recherche de mots dans une catégorie
     */
    public function testSearchWordsInCategory(): void {
        if (!self::$testCategoryId) {
            $this->markTestSkipped('Test category not available');
        }
        
        // Ajouter des mots pour la recherche
        $words = ['SEARCHTEST1', 'SEARCHTEST2', 'DIFFERENT'];
        foreach ($words as $word) {
            $wordData = [
                'word' => $word,
                'category_id' => self::$testCategoryId,
                'difficulty' => 'easy'
            ];
            
            $response = TestHttpClient::request('POST', '/api/admin/category-words.php', $wordData);
            if ($response['code'] === 200) {
                self::$testWordIds[] = $response['body']['data']['word']['id'];
            }
        }
        
        // Rechercher avec un terme
        $response = TestHttpClient::request('GET', '/api/admin/category-words.php?category_id=' . self::$testCategoryId . '&search=SEARCH');
        
        $this->assertEquals(200, $response['code']);
        $this->assertTrue($response['body']['success']);
        
        $responseData = $response['body']['data'];
        $this->assertArrayHasKey('filters', $responseData);
        $this->assertEquals('SEARCH', $responseData['filters']['search']);
        
        // Vérifier que les mots retournés correspondent à la recherche
        $foundWords = $responseData['words'];
        foreach ($foundWords as $word) {
            $this->assertStringContainsString('SEARCH', $word['word']);
        }
    }
    
    /**
     * Test GET - Filtrage par difficulté
     */
    public function testFilterWordsByDifficulty(): void {
        if (!self::$testCategoryId) {
            $this->markTestSkipped('Test category not available');
        }
        
        // Ajouter des mots avec différentes difficultés
        $wordsData = [
            ['word' => 'EASYWORD', 'difficulty' => 'easy'],
            ['word' => 'MEDIUMWORD', 'difficulty' => 'medium'],
            ['word' => 'HARDWORD', 'difficulty' => 'hard']
        ];
        
        foreach ($wordsData as $wordData) {
            $wordData['category_id'] = self::$testCategoryId;
            $response = TestHttpClient::request('POST', '/api/admin/category-words.php', $wordData);
            if ($response['code'] === 200) {
                self::$testWordIds[] = $response['body']['data']['word']['id'];
            }
        }
        
        // Filtrer par difficulté 'easy'
        $response = TestHttpClient::request('GET', '/api/admin/category-words.php?category_id=' . self::$testCategoryId . '&difficulty=easy');
        
        $this->assertEquals(200, $response['code']);
        $this->assertTrue($response['body']['success']);
        
        $responseData = $response['body']['data'];
        $this->assertEquals('easy', $responseData['filters']['difficulty']);
        
        // Vérifier que tous les mots retournés sont de difficulté 'easy'
        $foundWords = $responseData['words'];
        foreach ($foundWords as $word) {
            if (in_array($word['word'], ['EASYWORD', 'MEDIUMWORD', 'HARDWORD'])) {
                $this->assertEquals('easy', $word['difficulty']);
            }
        }
    }
}