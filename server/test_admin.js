const BASE_URL = 'http://127.0.0.1:5001/api';

async function testAdminUserManagement() {
  console.log('--- STARTING ADMIN USER MANAGEMENT VERIFICATION TEST ---');

  const adminEmail = `vamsikrishna.yelugoti_${Date.now()}@gmail.com`;
  const adminPassword = `password123`;

  const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPassword })
  });

  const signupData = await signupRes.json();
  const adminToken = signupData.token;
  console.log('✓ Signed up fresh admin user:', adminEmail);

  if (!adminToken) {
    throw new Error('Could not obtain admin JWT token');
  }

  // 2. Sign up target user to be deleted
  const targetEmail = `delete_me_${Date.now()}@example.com`;
  const targetSignupRes = await fetch(`${BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: targetEmail, password: 'password123' })
  });
  const targetData = await targetSignupRes.json();
  console.log('✓ Target user created:', targetEmail);

  // 3. Admin fetches user list
  const listRes = await fetch(`${BASE_URL}/admin/users`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const listData = await listRes.json();
  if (!listRes.ok) {
    console.error('List users failed status:', listRes.status, listData);
    throw new Error('List users failed');
  }
  console.log(`✓ Admin fetched user list (${listData.users.length} users in DB)`);

  const foundTarget = listData.users.find(u => u.email === targetEmail);
  if (!foundTarget) throw new Error('Target user not found in admin user list');
  console.log('✓ Target user located in admin table:', foundTarget.email);

  // 4. Admin deletes target user
  const delRes = await fetch(`${BASE_URL}/admin/users/${foundTarget.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const delData = await delRes.json();
  console.log('✓ Admin delete API response:', delData.message);

  // 5. Verify target user is gone from user list
  const refreshedListRes = await fetch(`${BASE_URL}/admin/users`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const refreshedListData = await refreshedListRes.json();
  const stillExists = refreshedListData.users.some(u => u.email === targetEmail);

  if (stillExists) throw new Error('Target user still exists after admin deletion!');
  console.log('🎉 ADMIN USER DATA DELETION TEST PASSED PERFECTLY!');
}

testAdminUserManagement().catch(err => {
  console.error('❌ Admin test failed:', err);
  process.exit(1);
});
