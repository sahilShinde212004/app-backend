const URL = 'http://localhost:5000';

async function testLocal() {
  console.log(`\n1️⃣  Testing Login at ${URL}/api/auth/login...`);
  try {
    const loginRes = await fetch(`${URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john.smith@university.edu', password: 'Teacher@123' })
    });
    
    if (!loginRes.ok) {
      console.log('❌ Login failed');
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
    console.log(textOutput);

  } catch (err) {
    console.error('❌ Network error:', err.message);
  }
}

testLocal();
