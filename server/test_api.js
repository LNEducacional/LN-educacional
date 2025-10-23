const axios = require('axios');

async function testAPI() {
  try {
    // Primeiro, fazer login para pegar o token
    const loginResponse = await axios.post('http://localhost:3333/auth/login', {
      email: 'teste17@gmail.com',
      password: 'teste123'  // Ajuste a senha se necessário
    });
    
    const token = loginResponse.data.token;
    console.log('Token obtido:', token ? 'SIM' : 'NÃO');
    
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
      console.error('Erro:', error.response.status, error.response.data);
    } else {
      console.error('Erro:', error.message);
    }
  }
}

testAPI();
