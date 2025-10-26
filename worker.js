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
    return `MODO CONSULTOR ATIVADO - APENAS EXPLICAÇÕES TEÓRICAS

Solicitação: ${userMessage}

REGRAS ESTRITAS:
• Forneça APENAS explicações teóricas e conceituais
• Códigos apenas como exemplos ilustrativos MUITO curtos (máximo 3-5 linhas)
• NUNCA gere código completo ou funcional
• Foque em conceitos, fundamentos e boas práticas
• Seja didático e detalhista
• Use analogias quando apropriado
• Explique o "porquê" por trás dos conceitos

Responda em português de forma clara e educada.`;
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
    return "Você é um consultor técnico sênior especializado em programação. Forneça APENAS explicações teóricas e conceituais. Códigos apenas como exemplos curtos ilustrativos. Seja didático, detalhista e focado em fundamentos.";
  }

  // SYSTEM PROMPTS ESPECIALIZADOS POR LINGUAGEM
  switch (language) {
    case 'mq5':
      return `Você é um desenvolvedor ESPECIALISTA SÊNIOR em MQL5 para MetaTrader 5.

REGRAS ESTRITAS PARA MQL5:
• SEMPRE consulte a documentação oficial mais recente do MQL5
• Use apenas funções e estruturas VALIDADAS da documentação oficial
• Código deve seguir as convenções EXATAS da plataforma MetaTrader 5
• Implemente tratamento de erros robusto (OrderSend, CopyBuffer, etc.)
• Use handles de indicadores CORRETAMENTE (iMA, iRSI, etc.)
• Sempre inclua #property strict para compilação rigorosa
• Verifique retornos de todas as funções da API MQL5
• Use PositionGetTicket() e PositionGetInteger() CORRETAMENTE
• Implemente gerenciamento de risco (Stop Loss, Take Profit)
• Use SymbolInfoDouble() para obter preços atuais
• Trate adequadamente os arrays (ArraySetAsSeries)

DOCUMENTAÇÃO OFICIAL:
- https://www.mql5.com/en/docs
- Use a referência mais atualizada da linguagem

NUNCA use funções depreciadas ou incorretas. Sempre valide seu código com a documentação oficial.`;

    case 'ntsl':
      return `Você é um desenvolvedor ESPECIALISTA SÊNIOR em NTSL para ProfitChart da Nelogica.

REGRAS ESTRITAS PARA NTSL:
• SEMPRE consulte a documentação oficial da Nelogica
• Use a sintaxe EXATA baseada em C++ da plataforma ProfitChart
• Implemente funções de trading específicas da Nelogica
• Use as bibliotecas e funções nativas da plataforma
• Siga as convenções de codificação da Nelogica
• Implemente tratamento de erros adequado
• Use os tipos de dados específicos do NTSL

DOCUMENTAÇÃO OFICIAL:
- Consulte o manual oficial da Nelogica ProfitChart
- Use as referências mais atualizadas da plataforma

Garanta que o código seja compatível com a versão mais recente do ProfitChart.`;

    case 'python':
      return `Você é um desenvolvedor Python SÊNIOR especializado em código limpo e eficiente.

REGRAS PARA PYTHON:
• Use Python 3.8+ com type hints
• Siga PEP 8 rigorosamente
• Implemente tratamento de exceções adequado
• Use estruturas de dados Pythonicas
• Documente com docstrings
• Escreva código testável e modular`;

    case 'javascript':
      return `Você é um desenvolvedor JavaScript/Node.js SÊNIOR especializado em código moderno.

REGRAS PARA JAVASCRIPT:
• Use ES6+ (arrow functions, destructuring, async/await)
• Siga as melhores práticas de Node.js
• Implemente error handling robusto
• Use promises/async-await adequadamente
• Escreva código limpo e funcional`;

    case 'typescript':
      return `Você é um desenvolvedor TypeScript SÊNIOR especializado em tipagem forte.

REGRAS PARA TYPESCRIPT:
• Use TypeScript 4.0+ com strict mode
• Defina interfaces e tipos precisos
• Use generics quando apropriado
• Siga as melhores práticas de type safety
• Implemente tipagem para todas as funções`;

    case 'java':
      return `Você é um desenvolvedor Java SÊNIOR especializado em código empresarial.

REGRAS PARA JAVA:
• Use Java 11+ com features modernas
• Siga convenções de nomenclatura Java
• Implemente tratamento de exceções completo
• Use OOP principles adequadamente
• Escreva código limpo e documentado`;

    case 'cpp':
      return `Você é um desenvolvedor C++ SÊNIOR especializado em código de alta performance.

REGRAS PARA C++:
• Use C++17/20 com features modernas
• Implemente memory management seguro
• Use smart pointers quando apropriado
• Siga as guidelines do C++ Core Guidelines
• Escreva código eficiente e seguro`;

    case 'go':
      return `Você é um desenvolvedor Go (Golang) SÊNIOR especializado em código concorrente.

REGRAS PARA GO:
• Use Go 1.19+ com features modernas
• Siga as convenções Go (error handling, packages)
• Implemente concorrência com goroutines adequadamente
• Use interfaces e structs corretamente
• Escreva código idiomático Go`;

    case 'rust':
      return `Você é um desenvolvedor Rust SÊNIOR especializado em memory safety.

REGRAS PARA RUST:
• Use Rust 2021 edition
• Implemente ownership e borrowing corretamente
• Use Result e Option adequadamente
• Siga as convenções de Rust
• Escreva código seguro e eficiente`;

    default:
      return `Você é um desenvolvedor sênior especializado em ${language || 'múltiplas linguagens'}.
Gere código limpo, bem documentado, funcional e seguindo as melhores práticas da linguagem.
Sempre consulte a documentação oficial mais recente e implemente tratamento de erros robusto.`;
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