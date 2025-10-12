import type { BlogPost } from '@/types/blog';

export const mockBlogPosts: BlogPost[] = [
  {
    id: 1,
    title: 'Como Escolher o Tema Ideal para seu TCC',
    summary:
      'Dicas práticas para selecionar um tema de TCC que seja relevante, viável e interessante para sua área de estudo.',
    content: `# Como Escolher o Tema Ideal para seu TCC

Escolher o tema do Trabalho de Conclusão de Curso (TCC) é uma das decisões mais importantes da vida acadêmica. Um bom tema pode fazer a diferença entre uma pesquisa prazerosa e uma experiência estressante.

## Critérios Fundamentais

### 1. Relevância Acadêmica
O tema deve contribuir para o conhecimento na sua área de estudo. Procure por lacunas na literatura ou questões em aberto que merecem investigação.

### 2. Viabilidade
Considere os recursos disponíveis: tempo, acesso a dados, bibliografia, orientação especializada. Um tema muito ambicioso pode comprometer a qualidade do trabalho.

### 3. Interesse Pessoal
Escolha algo que desperte sua curiosidade. Você passará meses pesquisando sobre o assunto, então é fundamental que tenha genuíno interesse.

## Estratégias Práticas

- **Revise a literatura**: Identifique tendências e gaps em sua área
- **Converse com professores**: Busque orientação sobre temas relevantes
- **Analise trabalhos anteriores**: Veja o que já foi feito e o que pode ser melhorado
- **Considere aplicações práticas**: Temas com relevância social ou profissional são bem-vindos

## Conclusão

A escolha do tema é o primeiro passo para um TCC de sucesso. Dedique tempo suficiente a esta decisão e não hesite em buscar orientação quando necessário.`,
    authorName: 'Prof. Maria Silva',
    thumbnailUrl: '/placeholder.svg',
    readTime: 8,
    category: 'Metodologia',
    createdAt: new Date(2024, 0, 15),
  },
  {
    id: 2,
    title: 'Metodologia de Pesquisa: Guia Completo',
    summary:
      'Entenda os diferentes tipos de pesquisa e como aplicar cada metodologia em seu trabalho acadêmico.',
    content: `# Metodologia de Pesquisa: Guia Completo

A metodologia é a espinha dorsal de qualquer trabalho científico. Ela define como você irá conduzir sua pesquisa e obter resultados confiáveis.

## Tipos de Pesquisa

### Quanto à Natureza
- **Básica**: Busca expandir o conhecimento teórico
- **Aplicada**: Visa resolver problemas práticos específicos

### Quanto à Abordagem
- **Quantitativa**: Trabalha com dados numéricos e estatísticas
- **Qualitativa**: Foca em aspectos subjetivos e interpretativos
- **Mista**: Combina elementos de ambas as abordagens

### Quanto aos Objetivos
- **Exploratória**: Familiariza-se com o tema
- **Descritiva**: Descreve características de um fenômeno
- **Explicativa**: Busca relações de causa e efeito

## Instrumentos de Coleta

- Questionários
- Entrevistas
- Observação
- Análise documental
- Grupos focais

## Dicas Importantes

1. **Alinhe método e objetivo**: Sua metodologia deve ser coerente com seus objetivos
2. **Justifique suas escolhas**: Explique por que escolheu determinado método
3. **Considere limitações**: Todo método tem restrições que devem ser reconhecidas
4. **Pilote seus instrumentos**: Teste questionários e roteiros antes da coleta final

A metodologia bem estruturada garante a qualidade e credibilidade da sua pesquisa.`,
    authorName: 'Dr. João Santos',
    thumbnailUrl: '/placeholder.svg',
    readTime: 12,
    category: 'Metodologia',
    createdAt: new Date(2024, 0, 22),
  },
  {
    id: 3,
    title: 'Normas ABNT: Tudo que Você Precisa Saber',
    summary:
      'Guia prático sobre as principais normas ABNT para formatação de trabalhos acadêmicos.',
    content: `# Normas ABNT: Tudo que Você Precisa Saber

As normas da Associação Brasileira de Normas Técnicas (ABNT) são fundamentais para a padronização de trabalhos acadêmicos no Brasil.

## Estrutura do Trabalho

### Elementos Pré-textuais
- Capa
- Folha de rosto
- Resumo
- Abstract
- Sumário

### Elementos Textuais
- Introdução
- Desenvolvimento
- Conclusão

### Elementos Pós-textuais
- Referências
- Apêndices
- Anexos

## Formatação Básica

### Papel e Margens
- **Papel**: A4 (21 cm x 29,7 cm)
- **Margens**: Superior e esquerda: 3 cm; Inferior e direita: 2 cm

### Fonte e Espaçamento
- **Fonte**: Times New Roman ou Arial, tamanho 12
- **Espaçamento**: 1,5 entre linhas
- **Parágrafo**: Recuo de 1,25 cm na primeira linha

### Citações
- **Diretas curtas** (até 3 linhas): Entre aspas no texto
- **Diretas longas** (mais de 3 linhas): Recuo de 4 cm, fonte 10, espaço simples
- **Indiretas**: Paráfrase das ideias do autor

## Referências

Siga o padrão: AUTOR. Título. Local: Editora, ano.

### Exemplo - Livro:
SILVA, João. **Metodologia científica**. São Paulo: Atlas, 2020.

### Exemplo - Artigo:
SANTOS, Maria. Pesquisa qualitativa. **Revista Acadêmica**, v. 15, n. 3, p. 45-60, 2021.

## Dicas Finais

1. **Use gerenciadores de referência**: Mendeley, Zotero facilitam a organização
2. **Revise sempre**: Pequenos erros de formatação podem prejudicar a avaliação
3. **Consulte o manual**: Cada instituição pode ter especificidades
4. **Seja consistente**: Mantenha o mesmo padrão em todo o trabalho

Dominar as normas ABNT é essencial para o sucesso acadêmico!`,
    authorName: 'Profa. Ana Costa',
    thumbnailUrl: '/placeholder.svg',
    readTime: 10,
    category: 'Formatação',
    createdAt: new Date(2024, 1, 5),
  },
  {
    id: 4,
    title: 'Como Superar o Bloqueio Criativo na Escrita',
    summary:
      "Estratégias eficazes para vencer a 'página em branco' e manter a produtividade na escrita acadêmica.",
    content: `# Como Superar o Bloqueio Criativo na Escrita

O bloqueio criativo é um dos maiores desafios enfrentados por estudantes e pesquisadores. Aquela sensação de não saber por onde começar ou como continuar pode ser paralisante.

## Entendendo o Bloqueio

O bloqueio criativo na escrita acadêmica pode ter várias causas:
- **Perfeccionismo excessivo**
- **Medo do julgamento**
- **Falta de clareza sobre o tema**
- **Sobrecarga de informações**
- **Pressão temporal**

## Estratégias Práticas

### 1. Técnica Pomodoro
- Escreva por 25 minutos
- Faça uma pausa de 5 minutos
- Repita o ciclo
- A cada 4 ciclos, faça uma pausa maior

### 2. Escrita Livre
- Escreva continuamente por 10-15 minutos
- Não se preocupe com gramática ou estrutura
- O objetivo é colocar ideias no papel
- Depois revise e organize o conteúdo

### 3. Mapa Mental
- Coloque o tema central no meio
- Adicione ideias relacionadas ao redor
- Conecte conceitos com linhas
- Use cores e símbolos

### 4. Mudança de Ambiente
- Varie o local de escrita
- Experimente cafeterias, bibliotecas, parques
- O novo ambiente pode estimular a criatividade

## Dicas Preventivas

1. **Mantenha um cronograma**: Escreva um pouco todos os dias
2. **Defina metas pequenas**: 200-300 palavras por sessão
3. **Prepare-se antes**: Tenha suas referências organizadas
4. **Aceite imperfeições**: O primeiro rascunho não precisa ser perfeito

## Quando Buscar Ajuda

Se o bloqueio persistir, considere:
- Conversar com seu orientador
- Participar de grupos de escrita
- Buscar apoio psicológico se necessário
- Fazer workshops de escrita acadêmica

Lembre-se: todo escritor enfrenta bloqueios. O importante é ter estratégias para superá-los!`,
    authorName: 'Dr. Carlos Oliveira',
    thumbnailUrl: '/placeholder.svg',
    readTime: 7,
    category: 'Produtividade',
    createdAt: new Date(2024, 1, 18),
  },
  {
    id: 5,
    title: 'Ferramentas Digitais para Pesquisadores',
    summary:
      'Conheça as melhores ferramentas digitais para organizar pesquisas, gerenciar referências e aumentar a produtividade acadêmica.',
    content: `# Ferramentas Digitais para Pesquisadores

A era digital trouxe inúmeras ferramentas que podem revolucionar sua experiência como pesquisador. Vamos explorar as principais categorias e suas melhores opções.

## Gerenciadores de Referência

### Zotero (Gratuito)
- **Vantagens**: Open source, extensão para navegador, sincronização
- **Ideal para**: Pesquisadores que trabalham com muitas fontes web

### Mendeley (Freemium)
- **Vantagens**: Interface intuitiva, rede social acadêmica
- **Ideal para**: Colaboração e descoberta de novos papers

### EndNote (Pago)
- **Vantagens**: Integração com Microsoft Word, recursos avançados
- **Ideal para**: Instituições com licença

## Ferramentas de Escrita

### Notion
- **Recursos**: Banco de dados, templates, colaboração
- **Uso**: Organização geral da pesquisa, cronogramas, notas

### Obsidian
- **Recursos**: Links bidirecionais, gráfico de conhecimento
- **Uso**: Construção de conhecimento conectado

### Scrivener
- **Recursos**: Estruturação de textos longos, research board
- **Uso**: Escrita de teses e dissertações

## Análise de Dados

### R Studio (Gratuito)
- **Vantagens**: Comunidade ativa, pacotes especializados
- **Ideal para**: Análises estatísticas complexas

### SPSS (Pago)
- **Vantagens**: Interface amigável, amplamente usado
- **Ideal para**: Pesquisadores iniciantes em estatística

### NVivo (Pago)
- **Vantagens**: Análise qualitativa robusta
- **Ideal para**: Pesquisa qualitativa e mista

## Organização e Produtividade

### Trello
- **Recursos**: Kanban boards, cartões, listas
- **Uso**: Gestão de projetos de pesquisa

### Google Workspace
- **Recursos**: Docs, Sheets, Drive, colaboração em tempo real
- **Uso**: Trabalho colaborativo e backup na nuvem

### Forest App
- **Recursos**: Bloqueio de distrações, gamificação
- **Uso**: Manter foco durante sessões de estudo

## Descoberta e Acesso a Conteúdo

### Google Scholar
- **Gratuito**: Busca em literatura acadêmica
- **Dica**: Configure alertas para acompanhar novas publicações

### ResearchGate
- **Rede social**: Conecte-se com outros pesquisadores
- **Recursos**: Acesso a papers, Q&A científico

### Sci-Hub (Controvertido)
- **Atenção**: Questões legais variam por país
- **Alternativa**: Bibliotecas institucionais e repositórios abertos

## Dicas de Implementação

1. **Comece gradual**: Não tente usar todas as ferramentas de uma vez
2. **Integre workflows**: Escolha ferramentas que conversam entre si
3. **Backup regular**: Mantenha seus dados seguros
4. **Atualize conhecimentos**: Participe de treinamentos

## Considerações Finais

A escolha das ferramentas deve ser baseada em:
- Suas necessidades específicas
- Orçamento disponível
- Curva de aprendizado
- Compatibilidade com colaboradores

Lembre-se: a ferramenta é meio, não fim. O importante é que ela facilite seu trabalho, não o complique!`,
    authorName: 'Dra. Laura Martinez',
    thumbnailUrl: '/placeholder.svg',
    readTime: 15,
    category: 'Tecnologia',
    createdAt: new Date(2024, 2, 3),
  },
];
