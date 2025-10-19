// Cloudflare Worker - Backend do SAAS Developer AI
export default {
  async fetch(request, env) {
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
      // Rota principal - health check (CORRIGIDO)
      if (pathname === '/' || pathname === '/api' || pathname === '/health') {
        return new Response(
          JSON.stringify({
            message: '🚀 SAAS Developer AI API - Cloudflare Workers',
            status: 'online',
            endpoints: ['/api/develop', '/api/ask'],
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

      // Rota de desenvolvimento de código
      if (pathname === '/api/develop' && request.method === 'POST') {
        return await handleDevelop(request, env, corsHeaders);
      }

      // Rota de perguntas técnicas
      if (pathname === '/api/ask' && request.method === 'POST') {
        return await handleAsk(request, env, corsHeaders);
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
          success: false, 
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

// Função para gerar código
async function handleDevelop(request, env, corsHeaders) {
  try {
    const data = await request.json();
    const { instruction, language = 'python', framework } = data;

    // Validar dados
    if (!instruction || instruction.trim() === '') {
      return new Response(
        JSON.stringify({ success: false, error: 'Instruction is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('📦 Recebido request para develop:', { language, framework, instructionLength: instruction.length });

    const prompt = `Você é um expert em ${language}${framework ? ` e ${framework}` : ''}.

Gere código baseado na seguinte instrução:

INSTRUÇÃO: ${instruction}

Forneça:
1. Código completo, funcional e bem estruturado
2. Explicação do que foi implementado
3. Instruções de uso
4. Possíveis melhorias

Seja preciso e profissional.`;

    const messages = [
      {
        role: "system",
        content: `Você é um desenvolvedor sênior especializado em ${language}${framework ? ` e ${framework}` : ''}. Gere código limpo e bem documentado.`
      },
      { role: "user", content: prompt }
    ];

    const result = await callDeepSeekAPI(messages, env.DEEPSEEK_API_KEY);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        result,
        debug: { message: 'API call successful' }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Erro em handleDevelop:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        debug: { type: 'develop_error', step: 'processing' }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

// Função para responder perguntas
async function handleAsk(request, env, corsHeaders) {
  try {
    const data = await request.json();
    const { question, language } = data;

    // Validar dados
    if (!question || question.trim() === '') {
      return new Response(
        JSON.stringify({ success: false, error: 'Question is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('📦 Recebido request para ask:', { language, questionLength: question.length });

    const prompt = `Você é um consultor técnico sênior.

Responda a seguinte pergunta${language ? ` sobre ${language}` : ' sobre programação'}:

PERGUNTA: ${question}

Forneça uma resposta completa incluindo:
1. Explicação clara e detalhada
2. Exemplos práticos quando aplicável
3. Casos de uso reais
4. Melhores práticas
5. Armadilhas comuns a evitar

Seja didático e profissional.`;

    const messages = [
      {
        role: "system",
        content: "Você é um consultor técnico com vasta experiência em arquitetura de software e desenvolvimento."
      },
      { role: "user", content: prompt }
    ];

    const result = await callDeepSeekAPI(messages, env.DEEPSEEK_API_KEY);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        answer: result,
        debug: { message: 'API call successful' }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Erro em handleAsk:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        debug: { type: 'ask_error', step: 'processing' }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
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
    
    if (!data.choices || !data.choices[0]) {
      throw new Error('Resposta inválida da API DeepSeek - nenhuma choice disponível');
    }

    return data.choices[0].message.content;

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Timeout: A requisição levou mais de 30 segundos. Tente novamente.');
    }
    
    throw error;
  }
}