export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      // Garantir que os prefixos sejam adicionados para Safari e navegadores antigos
      overrideBrowserslist: [
        'last 2 versions',
        'Safari >= 9',
        'iOS >= 9',
        'Chrome >= 54',
        'Firefox >= 52',
        'Edge >= 15',
        '> 0.2%',
        'not dead'
      ],
      // Adicionar prefixos para propriedades específicas
      grid: 'autoplace',
      flexbox: 'no-2009'
    },
  },
};
