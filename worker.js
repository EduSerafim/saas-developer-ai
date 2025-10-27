// Cloudflare Worker - Backend do SAAS Developer AI (SYSTEM PROMPTS OTIMIZADOS)
export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Lidar com preflight OPTIONS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // ⚠️ CORREÇÃO CRÍTICA: Verificar método POST PRIMEIRO
    if (request.method === 'POST') {
      return await handleChatRequest(request, env, corsHeaders);
    }

    // Health check apenas para GET
    if (request.method === 'GET') {
      return new Response(
        JSON.stringify({
          message: '🚀 SAAS Developer AI API - Cloudflare Workers',
          status: 'online',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          }
        }
      );
    }

    // Rota não encontrada
    return new Response(
      JSON.stringify({ error: 'Método não permitido' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

// Função principal para lidar com requests do chat
async function handleChatRequest(request, env, corsHeaders) {
  try {
    // ⚠️ DEBUG: Verificar se API Key está carregada
    console.log('🔑 API Key carregada?:', !!env.DEEPSEEK_API_KEY);
    console.log('🔑 API Key tamanho:', env.DEEPSEEK_API_KEY?.length);
    
    const data = await request.json();
    const { message, options, language, isConsultor } = data;

    // Validar dados
    if (!message || message.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('📦 Recebido request:', { 
      message: message.substring(0, 50) + '...',
      language, 
      isConsultor 
    });

    // Construir prompt baseado nas opções e modo
    const prompt = buildPrompt(message, options, language, isConsultor);
    
    const messages = [
      {
        role: "system",
        content: getSystemPrompt(isConsultor, language)
      },
      { role: "user", content: prompt }
    ];

    console.log('📤 Prompt construído');

    const responseText = await callDeepSeekAPI(messages, env.DEEPSEEK_API_KEY);

    // ⚠️ VERIFICAÇÃO MELHORADA
    console.log('🤖 Resposta DeepSeek recebida, tamanho:', responseText?.length);
    
    if (!responseText || typeof responseText !== 'string' || responseText.trim() === '') {
      console.error('❌ Resposta vazia da API DeepSeek');
      throw new Error('Resposta vazia da API DeepSeek');
    }

    return new Response(
      JSON.stringify({ 
        response: responseText,
        codeId: `#${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        success: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Erro em handleChatRequest:', error.message);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        response: `❌ Erro: ${error.message}`,
        success: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

// Função para construir prompt baseado nas opções
function buildPrompt(userMessage, options, language, isConsultor) {
  if (isConsultor) {
  return userMessage;
}

  // Verificar se apenas código foi selecionado
  const selectedOptions = Object.entries(options || {})
    .filter(([_, selected]) => selected)
    .map(([key]) => key);

  // Se só código foi selecionado - APENAS CÓDIGO
  if (selectedOptions.length === 1 && options.code) {
    return `Gere APENAS o código ${language} para: ${userMessage}. 

NÃO inclua:
- Explicações
- Instruções de uso 
- Melhorias
- Exemplos adicionais
- Qualquer texto além do código

Apenas o código puro e funcional.`;
  }

  // Se nenhuma opção selecionada, padrão para código
  if (selectedOptions.length === 0) {
    return `Gere APENAS o código ${language} para: ${userMessage}. 

NÃO inclua explicações, instruções de uso, melhorias, exemplos ou qualquer texto adicional. Apenas o código puro.`;
  }

  // Se múltiplas opções selecionadas
  let prompt = `Instrução: ${userMessage}\n\n`;
  
  if (language) {
    prompt += `Linguagem: ${language}\n\n`;
  }
  
  prompt += `Forneça SOMENTE:\n`;

  if (options.code) prompt += `• Código completo e funcional (em blocos de código)\n`;
  if (options.explanation) prompt += `• Explicação detalhada do que foi implementado\n`;
  if (options.usage) prompt += `• Instruções claras de como usar\n`;
  if (options.improvements) prompt += `• Possíveis melhorias e extensões\n`;

  prompt += `\n\nNÃO inclua nada além do que foi solicitado acima.`;

  return prompt;
}

// ⚠️ FUNÇÃO CRITICAMENTE MELHORADA: System prompts especializados por linguagem
function getSystemPrompt(isConsultor, language) {
  if (isConsultor) {
  return `Você é um mentor experiente e acessível em programação. Sua missão é explicar conceitos técnicos de forma clara e envolvente.`;
}

  // SYSTEM PROMPTS ESPECIALIZADOS POR LINGUAGEM
  switch (language) {
    case 'mq5':
  return `Especialista MQL5/MetaTrader 5. Use documentação oficial atualizada. 
Código válido com tratamento de erros robusto, handles corretos e gerenciamento de risco. 
Siga convenções exatas da plataforma.`;

    case 'ntsl':
  return `Especialista NTSL/ProfitChart Nelogica. Sintaxe C++ da plataforma. 
Use funções nativas e bibliotecas oficiais. Código compatível com versão mais recente.`;

    case 'python':
  return `Desenvolvedor Python sênior. Use Python 3.8+, type hints e PEP 8. 
Código limpo, documentado com docstrings e tratamento de exceções.`;


    case 'javascript':
  return `Desenvolvedor JavaScript/Node.js sênior. Use ES6+, async/await, promises. 
Código moderno com error handling robusto e melhores práticas.`;

    case 'typescript':
  return `Desenvolvedor TypeScript sênior. Use TypeScript 4.0+ com strict mode. 
Tipagem forte, interfaces precisas e generics quando apropriado.`;


    case 'java':
  return `Desenvolvedor Java sênior. Use Java 11+, OOP principles. 
Código empresarial com tratamento completo de exceções e convenções Java.`;

    case 'cpp':
  return `Desenvolvedor C++ sênior. Use C++17/20, memory management seguro. 
Código de alta performance seguindo C++ Core Guidelines.`;

    case 'go':
  return `Desenvolvedor Go sênior. Use Go 1.19+, goroutines e channels adequadamente. 
Código idiomático com error handling e convenções Go.`;


    case 'rust':
  return `Desenvolvedor Rust sênior. Use Rust 2021 edition, ownership e borrowing. 
Memory safety com Result/Option adequados e convenções Rust.`;

    case 'php':
  return `Desveloper PHP sênior. Use PHP 8.0+, type declarations, PSR standards. 
Código moderno com tratamento de erros e melhores práticas.`;

    case 'ruby':
  return `Desenvolvedor Ruby sênior. Use Ruby 3.0+, convenções Ruby. 
Código idiomático com metaprogramação adequada e Rails patterns quando aplicável.`;

    case 'html':
  return `Especialista HTML5. Use semântica correta, acessibilidade (ARIA). 
HTML válido e responsivo seguindo padrões web.`;

    case 'css':
  return `Especialista CSS3. Use Flexbox/Grid, variáveis CSS, responsividade. 
CSS moderno com organização e performance.`;

    case 'sql':
  return `Especialista SQL. Use queries otimizadas, JOINs adequados, prevenção SQL injection. 
SQL padrão ANSI com boas práticas de performance.`;

    default:
  return `Desenvolvedor sênior em ${language || 'múltiplas linguagens'}. 
Código limpo, funcional e seguindo melhores práticas da linguagem.`;
  }
}

// Função para chamar a API DeepSeek
async function callDeepSeekAPI(messages, apiKey) {
  console.log('🔑 Iniciando chamada para DeepSeek...');
  
  // Verificar se a API Key está configurada
  if (!apiKey || apiKey.trim() === '' || apiKey === 'sua_chave_aqui') {
    console.error('❌ API Key inválida ou não configurada');
    throw new Error('API Key da DeepSeek não configurada. Verifique a variável DEEPSEEK_API_KEY no Cloudflare.');
  }

  console.log('🌐 Chamando API DeepSeek...');
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-coder',
        messages: messages,
        temperature: 0.7,
        max_tokens: 4000,
        stream: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log(`📡 Status da resposta DeepSeek: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro da API DeepSeek:', errorText);
      
      let errorMessage = `Erro DeepSeek: ${response.status}`;
      
      if (response.status === 401) {
        errorMessage = 'API Key inválida ou expirada. Verifique sua chave DeepSeek.';
      } else if (response.status === 429) {
        errorMessage = 'Limite de requisições excedido. Tente novamente em alguns minutos.';
      } else if (response.status === 500) {
        errorMessage = 'Erro interno do servidor DeepSeek. Tente novamente.';
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('✅ Resposta DeepSeek recebida com sucesso');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Estrutura inválida da resposta:', data);
      throw new Error('Resposta inválida da API DeepSeek');
    }

    const responseContent = data.choices[0].message.content;
    
    if (!responseContent || responseContent.trim() === '') {
      throw new Error('Resposta vazia da API DeepSeek');
    }

    return responseContent;

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Timeout: A requisição levou mais de 30 segundos. Tente novamente.');
    }
    
    console.error('💥 Erro na chamada DeepSeek:', error);
    throw error;
  }
}