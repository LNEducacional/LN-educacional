const axios = require('axios');

async function testAPI() {
  try {
    // Tentar com admin
    const loginResponse = await axios.post('http://localhost:3333/auth/login', {
      email: 'admin@lneducacional.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login bem sucedido!');
    
    // Buscar progresso do curso
    const progressResponse = await axios.get(
      'http://localhost:3333/courses/cmh0y2a6r0002jmbjghgjct0x/progress',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('\n=== RESPOSTA DA API ===');
    console.log(JSON.stringify(progressResponse.data, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.error('Erro:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Erro:', error.message);
    }
  }
}

testAPI();
