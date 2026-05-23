const URL = 'https://app-backend-qhnr.onrender.com';

async function testRemote() {
  console.log(`\n1️⃣  Testing Login at ${URL}/api/auth/login...`);
  try {
    const loginRes = await fetch(`${URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john.smith@university.edu', password: 'Teacher@123' })
    });
    
    if (!loginRes.ok) {
      const err = await loginRes.text();
      console.log('❌ Login failed:', loginRes.status, err);
      return;
    }
    
    const loginData = await loginRes.json();
    console.log('✅ Login successful! Token received.');

    console.log(`\n2️⃣  Testing GET ${URL}/api/lectures/subjects...`);
    const subjectsRes = await fetch(`${URL}/api/lectures/subjects`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });

    const textOutput = await subjectsRes.text();
    console.log(`Status Code: ${subjectsRes.status}`);
    
    if (subjectsRes.ok) {
      console.log('✅ Success! Data returned:');
      try {
        console.log(JSON.parse(textOutput));
      } catch(e) {
        console.log('Returned data is NOT JSON. Raw output:');
        console.log(textOutput.substring(0, 300) + '...');
      }
    } else {
      console.log('❌ Failed. Raw server response:');
      console.log(textOutput.substring(0, 300) + (textOutput.length > 300 ? '...' : ''));
    }

  } catch (err) {
    console.error('❌ Network error:', err.message);
  }
}

testRemote();
