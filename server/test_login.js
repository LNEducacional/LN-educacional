const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:3333/auth/login', {
      email: 'admin@lneducacional.com',
      password: 'admin123'
    });
    
    console.log('Login sucesso!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Erro no login:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
  }
}

testLogin();
