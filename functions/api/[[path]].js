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
      // Rota principal - health check
      if (pathname === '/' || pathname === '/api') {
        return new Response(
          JSON.stringify({
            message: '🚀 SAAS Developer AI API - Cloudflare Workers',
            status: 'online',
            endpoints: ['/api/develop', '/api/ask']
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
      return new Response(
        JSON.stringify({ error: error.message }),
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
        content: `Você é um desenvolvedor sênior especializado em ${language}${framework ? ` e ${framework}` : ''}.`
      },
      { role: "user", content: prompt }
    ];

    const result = await callDeepSeekAPI(messages, env.DEEPSEEK_API_KEY);
    
    return new Response(
      JSON.stringify({ success: true, result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
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
      JSON.stringify({ success: true, answer: result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

// Função para chamar a API DeepSeek
async function callDeepSeekAPI(messages, apiKey) {
  // Verificar se a API Key está configurada
  if (!apiKey || apiKey === 'sua_chave_aqui') {
    throw new Error('API Key da DeepSeek não configurada. Configure a variável DEEPSEEK_API_KEY no Cloudflare.');
  }

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
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0]) {
    throw new Error('Resposta inválida da API DeepSeek');
  }

  return data.choices[0].message.content;
}