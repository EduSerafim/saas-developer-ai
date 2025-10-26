// Cloudflare Worker - Backend do SAAS Developer AI
export default {
  async fetch(request, env) {
     // ⚠️ DEBUG DA API KEY - ADICIONE ESTAS LINHAS (LINHAS 3-9)
    console.log('🔍🔍🔍 DEBUG DO ENVIRONMENT:');
    console.log('API Key exists?:', !!env.DEEPSEEK_API_KEY);
    console.log('API Key type:', typeof env.DEEPSEEK_API_KEY);
    console.log('API Key length:', env.DEEPSEEK_API_KEY?.length);
    console.log('API Key first 10 chars:', env.DEEPSEEK_API_KEY?.substring(0, 10));
    console.log('All env keys:', Object.keys(env));
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Headers CORS para permitir requests do frontend
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Lidar com preflight OPTIONS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Rota principal - health check
      if (pathname === '/' || pathname === '/health') {
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

      // Rota principal para chat
      if (request.method === 'POST') {
        return await handleChatRequest(request, env, corsHeaders);
      }

      // Rota não encontrada
      return new Response(
        JSON.stringify({ error: 'Endpoint not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } catch (error) {
      console.error('Error:', error);
      return new Response(
        JSON.stringify({ 
          error: error.message,
          type: 'server_error'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  }
};

// Função principal para lidar com requests do chat
async function handleChatRequest(request, env, corsHeaders) {
  try {
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
      isConsultor, 
      language, 
      messageLength: message.length 
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

    console.log('📤 Prompt construído:', prompt.substring(0, 200) + '...');

    const responseText = await callDeepSeekAPI(messages, env.DEEPSEEK_API_KEY);

    // ⚠️ VERIFICAÇÃO CRÍTICA DA RESPOSTA
    console.log('🤖 Resposta da DeepSeek (primeiros 500 chars):', responseText?.substring(0, 500));
    
    if (!responseText || responseText.trim() === '') {
      throw new Error('Resposta vazia da API DeepSeek');
    }

    return new Response(
      JSON.stringify({ 
        response: responseText, // ⚠️ GARANTIDO: campo 'response'
        codeId: `#${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        debug: { 
          message: 'API call successful',
          isConsultor: isConsultor,
          language: language,
          responseLength: responseText.length
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Erro em handleChatRequest:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        debug: { type: 'chat_error', step: 'processing' }
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

// Função para obter system prompt baseado no modo
function getSystemPrompt(isConsultor, language) {
  if (isConsultor) {
    return "Você é um consultor técnico sênior especializado em programação. Forneça APENAS explicações teóricas e conceituais. Códigos apenas como exemplos curtos ilustrativos. Seja didático, detalhista e focado em fundamentos.";
  }

  if (language === 'mq5') {
    return "Você é um desenvolvedor especialista em MQL5 para MetaTrader 5. Gere código limpo, bem estruturado e seguindo as convenções da plataforma. Inclua comentários relevantes.";
  }

  if (language === 'ntsl') {
    return "Você é um desenvolvedor especialista em NTSL para ProfitChat da Nelogica. Gere código baseado em C++ seguindo a sintaxe específica da plataforma. Seja preciso e profissional.";
  }

  return "Você é um desenvolvedor sênior especializado em múltiplas linguagens de programação. Gere código limpo, bem documentado e funcional. Seja preciso e profissional.";
}

// Função para chamar a API DeepSeek
async function callDeepSeekAPI(messages, apiKey) {
  console.log('🔑 Verificando API Key...');
  
  // Verificar se a API Key está configurada
  if (!apiKey || apiKey === 'sua_chave_aqui') {
    throw new Error('API Key da DeepSeek não configurada. Configure a variável DEEPSEEK_API_KEY no Cloudflare.');
  }

  // Verificar formato da API Key (deve começar com sk-)
  if (!apiKey.startsWith('sk-')) {
    throw new Error('Formato inválido da API Key. Deve começar com "sk-". Verifique sua chave DeepSeek.');
  }

  console.log('🌐 Chamando API DeepSeek...');
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

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

    console.log(`📡 Status da resposta: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro da API:', errorText);
      
      let errorMessage = `DeepSeek API error: ${response.status}`;
      
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
    console.log('✅ Resposta da API recebida com sucesso');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Resposta inválida da API DeepSeek - estrutura incorreta');
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
    
    throw error;
  }
}