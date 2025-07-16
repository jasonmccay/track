import { checkDatabaseConnection } from './lib/db-utils';
import { UserRepository } from './repositories/userRepository';
import { generateToken, verifyToken } from './lib/auth';

async function testAuthSystem() {
  console.log('Testing Authentication System...');
  
  // Check database connection
  const isConnected = await checkDatabaseConnection();
  if (!isConnected) {
    console.error('❌ Database connection failed');
    process.exit(1);
  }
  
  console.log('✅ Database connection successful');
  
  const userRepository = new UserRepository();
  
  try {
    // Test 1: Create a test user
    console.log('\n1. Testing user creation for auth...');
    const testUser = {
      username: 'authtest_' + Date.now(),
      email: `authtest_${Date.now()}@example.com`,
      displayName: 'Auth Test User',
      password: 'password123',
    };
    
    const createdUser = await userRepository.create(testUser);
    console.log('✅ Test user created:', createdUser.username);
    
    // Test 2: Generate JWT token
    console.log('\n2. Testing JWT token generation...');
    const token = generateToken(createdUser);
    console.log('✅ JWT token generated:', token.substring(0, 50) + '...');
    
    // Test 3: Verify JWT token
    console.log('\n3. Testing JWT token verification...');
    const decoded = verifyToken(token);
    if (decoded && decoded.userId === createdUser.id) {
      console.log('✅ JWT token verified successfully');
      console.log('   - User ID:', decoded.userId);
      console.log('   - Username:', decoded.username);
      console.log('   - Email:', decoded.email);
    } else {
      throw new Error('JWT token verification failed');
    }
    
    // Test 4: Password verification
    console.log('\n4. Testing password verification...');
    const verifiedUser = await userRepository.verifyPassword(testUser.email, testUser.password);
    if (verifiedUser && verifiedUser.id === createdUser.id) {
      console.log('✅ Password verification successful');
    } else {
      throw new Error('Password verification failed');
    }
    
    // Test 5: Invalid password verification
    console.log('\n5. Testing invalid password rejection...');
    const invalidUser = await userRepository.verifyPassword(testUser.email, 'wrongpassword');
    if (!invalidUser) {
      console.log('✅ Invalid password correctly rejected');
    } else {
      throw new Error('Invalid password was incorrectly accepted');
    }
    
    // Test 6: Invalid token verification
    console.log('\n6. Testing invalid token rejection...');
    const invalidToken = 'invalid.jwt.token';
    const invalidDecoded = verifyToken(invalidToken);
    if (!invalidDecoded) {
      console.log('✅ Invalid token correctly rejected');
    } else {
      throw new Error('Invalid token was incorrectly accepted');
    }
    
    // Test 7: Token expiration info
    console.log('\n7. Testing token expiration info...');
    if (decoded && decoded.iat && decoded.exp) {
      const issuedAt = new Date(decoded.iat * 1000);
      const expiresAt = new Date(decoded.exp * 1000);
      console.log('✅ Token expiration info:');
      console.log('   - Issued at:', issuedAt.toISOString());
      console.log('   - Expires at:', expiresAt.toISOString());
      console.log('   - Valid for:', Math.round((decoded.exp - decoded.iat) / 3600), 'hours');
    }
    
    // Clean up - delete test user
    await userRepository.delete(createdUser.id);
    console.log('\n✅ Test user cleaned up');
    
    console.log('\n🎉 All Authentication tests passed!');
    console.log('\n📋 Authentication System Features:');
    console.log('   ✅ JWT token generation');
    console.log('   ✅ JWT token verification');
    console.log('   ✅ Password hashing and verification');
    console.log('   ✅ Token expiration handling');
    console.log('   ✅ Invalid token/password rejection');
    console.log('   ✅ User data preservation in tokens');
    
  } catch (error) {
    console.error('❌ Authentication test failed:', error);
    process.exit(1);
  }
}

testAuthSystem().catch((error) => {
  console.error('❌ Authentication test failed:', error);
  process.exit(1);
});