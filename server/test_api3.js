const axios = require('axios');

async function testAPI() {
  try {
    // Login
    const loginResponse = await axios.post('http://localhost:3333/auth/login', {
      email: 'admin@lneducacional.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('Token:', token.substring(0, 20) + '...');
    
    // Verificar autenticação
    const meResponse = await axios.get('http://localhost:3333/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('\n/auth/me funcionou:', meResponse.data.email);
    
    // Buscar progresso
    try {
      const progressResponse = await axios.get(
        'http://localhost:3333/courses/cmh0y2a6r0002jmbjghgjct0x/progress',
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      console.log('\nProgresso:', JSON.stringify(progressResponse.data, null, 2));
    } catch (err) {
      console.error('\nErro no /progress:');
      console.error('Status:', err.response?.status);
      console.error('Data:', err.response?.data);
      console.error('Headers enviados:', err.config?.headers);
    }
    
  } catch (error) {
    console.error('Erro geral:', error.message);
  }
}

testAPI();
