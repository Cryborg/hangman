<?php
/**
 * Tests pour l'authentification admin
 */

use PHPUnit\Framework\TestCase;

class AuthenticationTest extends TestCase {
    
    protected function setUp(): void {
        TestHttpClient::resetSession();
    }
    
    protected function tearDown(): void {
        TestHttpClient::logout();
    }
    
    /**
     * Test de connexion avec identifiants valides
     */
    public function testLoginWithValidCredentials(): void {
        $response = TestHttpClient::request('POST', '/api/admin/auth.php', [
            'action' => 'login',
            'username' => $_ENV['ADMIN_USERNAME'],
            'password' => $_ENV['ADMIN_PASSWORD']
        ]);
        
        $this->assertEquals(200, $response['code'], 'Login should return 200');
        $this->assertIsArray($response['body'], 'Response should be JSON');
        $this->assertTrue($response['body']['success'] ?? false, 'Login should be successful');
        $this->assertArrayHasKey('message', $response['body']['data'], 'Response should have message');
        
        // Vérifier que la session fonctionne en testant un endpoint protégé
        $protectedResponse = TestHttpClient::request('GET', '/api/admin/categories.php');
        $this->assertEquals(200, $protectedResponse['code'], 'Should access protected endpoint after login');
    }
    
    /**
     * Test de connexion avec identifiants invalides
     */
    public function testLoginWithInvalidCredentials(): void {
        $response = TestHttpClient::request('POST', '/api/admin/auth.php', [
            'action' => 'login',
            'username' => 'invalid_user',
            'password' => 'wrong_password'
        ]);
        
        $this->assertEquals(401, $response['code'], 'Invalid login should return 401');
        $this->assertIsArray($response['body'], 'Response should be JSON');
        $this->assertFalse($response['body']['success'] ?? true, 'Login should fail');
        $this->assertArrayHasKey('error', $response['body'], 'Response should have error');
    }
    
    /**
     * Test de connexion avec username manquant
     */
    public function testLoginWithMissingUsername(): void {
        $response = TestHttpClient::request('POST', '/api/admin/auth.php', [
            'action' => 'login',
            'password' => $_ENV['ADMIN_PASSWORD']
        ]);
        
        $this->assertEquals(400, $response['code'], 'Missing username should return 400');
        $this->assertFalse($response['body']['success'] ?? true, 'Login should fail');
    }
    
    /**
     * Test de connexion avec password manquant
     */
    public function testLoginWithMissingPassword(): void {
        $response = TestHttpClient::request('POST', '/api/admin/auth.php', [
            'action' => 'login',
            'username' => $_ENV['ADMIN_USERNAME']
        ]);
        
        $this->assertEquals(400, $response['code'], 'Missing password should return 400');
        $this->assertFalse($response['body']['success'] ?? true, 'Login should fail');
    }
    
    /**
     * Test d'accès protégé sans authentification
     */
    public function testAccessProtectedEndpointWithoutAuth(): void {
        $response = TestHttpClient::request('GET', '/api/admin/categories.php');
        
        $this->assertEquals(401, $response['code'], 'Protected endpoint should return 401 without auth');
        $this->assertFalse($response['body']['success'] ?? true, 'Request should fail');
        $this->assertEquals('Authentification requise', $response['body']['error']['message'] ?? '');
    }
    
    /**
     * Test d'accès protégé avec authentification
     */
    public function testAccessProtectedEndpointWithAuth(): void {
        // Login first
        $loginSuccess = TestHttpClient::login($_ENV['ADMIN_USERNAME'], $_ENV['ADMIN_PASSWORD']);
        $this->assertTrue($loginSuccess, 'Login should succeed');
        
        // Access protected endpoint
        $response = TestHttpClient::request('GET', '/api/admin/categories.php');
        
        $this->assertEquals(200, $response['code'], 'Protected endpoint should return 200 with auth');
        $this->assertTrue($response['body']['success'] ?? false, 'Request should succeed');
        $this->assertArrayHasKey('data', $response['body'], 'Response should have data');
    }
    
    /**
     * Test de déconnexion
     */
    public function testLogout(): void {
        // Login first
        $loginSuccess = TestHttpClient::login($_ENV['ADMIN_USERNAME'], $_ENV['ADMIN_PASSWORD']);
        $this->assertTrue($loginSuccess, 'Login should succeed');
        
        // Logout
        $response = TestHttpClient::request('POST', '/api/admin/auth.php', [
            'action' => 'logout'
        ]);
        
        $this->assertEquals(200, $response['code'], 'Logout should return 200');
        $this->assertTrue($response['body']['success'] ?? false, 'Logout should succeed');
        
        // Try to access protected endpoint after logout
        TestHttpClient::resetSession();
        $response = TestHttpClient::request('GET', '/api/admin/categories.php');
        
        $this->assertEquals(401, $response['code'], 'Should not access protected endpoint after logout');
    }
    
    /**
     * Test de vérification du statut d'authentification
     */
    public function testCheckAuthStatus(): void {
        // Ensure we're logged out first
        TestHttpClient::logout();
        
        // Check status without login
        $response = TestHttpClient::request('POST', '/api/admin/auth.php', [
            'action' => 'check'
        ]);
        
        $this->assertEquals(200, $response['code'], 'Check should return 200');
        $this->assertFalse($response['body']['data']['logged_in'] ?? true, 'Should not be authenticated');
        
        // Login
        TestHttpClient::login($_ENV['ADMIN_USERNAME'], $_ENV['ADMIN_PASSWORD']);
        
        // Check status after login
        $response = TestHttpClient::request('POST', '/api/admin/auth.php', [
            'action' => 'check'
        ]);
        
        $this->assertEquals(200, $response['code'], 'Check should return 200');
        $this->assertTrue($response['body']['data']['logged_in'] ?? false, 'Should be authenticated');
        $this->assertEquals($_ENV['ADMIN_USERNAME'], $response['body']['data']['session_info']['username'] ?? '');
    }
}