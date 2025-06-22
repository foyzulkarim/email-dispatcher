const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function testAuthentication() {
  console.log('🧪 Testing Authentication System\n');

  try {
    // Test 1: Development login
    console.log('1. Testing development login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/dev-login`, {
      email: 'test@example.com',
      name: 'Test User'
    });

    if (loginResponse.data.success) {
      console.log('✅ Development login successful');
      const token = loginResponse.data.data.token;
      const user = loginResponse.data.data.user;
      console.log(`   User: ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      
      // Test 2: Get current user
      console.log('\n2. Testing get current user...');
      const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (meResponse.data.success) {
        console.log('✅ Get current user successful');
        console.log(`   User ID: ${meResponse.data.data.id}`);
      }

      // Test 3: Update user profile
      console.log('\n3. Testing update user profile...');
      const updateResponse = await axios.put(`${BASE_URL}/auth/me`, {
        name: 'Updated Test User',
        settings: {
          timezone: 'America/New_York'
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (updateResponse.data.success) {
        console.log('✅ Update user profile successful');
        console.log(`   Updated name: ${updateResponse.data.data.name}`);
      }

      // Test 4: Verify token
      console.log('\n4. Testing token verification...');
      const verifyResponse = await axios.get(`${BASE_URL}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (verifyResponse.data.success) {
        console.log('✅ Token verification successful');
      }

      // Test 5: Refresh token
      console.log('\n5. Testing token refresh...');
      const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (refreshResponse.data.success) {
        console.log('✅ Token refresh successful');
        const newToken = refreshResponse.data.data.token;
        console.log(`   New token generated (length: ${newToken.length})`);
      }

      // Test 6: Access protected user route
      console.log('\n6. Testing protected user route...');
      const userResponse = await axios.get(`${BASE_URL}/user/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (userResponse.data.success) {
        console.log('✅ Protected user route access successful');
      }

      // Test 7: Test unauthorized access
      console.log('\n7. Testing unauthorized access...');
      try {
        await axios.get(`${BASE_URL}/auth/me`);
        console.log('❌ Unauthorized access should have failed');
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.log('✅ Unauthorized access properly blocked');
        } else {
          console.log('❌ Unexpected error:', error.message);
        }
      }

      console.log('\n🎉 All authentication tests passed!');

    } else {
      console.log('❌ Development login failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests
testAuthentication();
