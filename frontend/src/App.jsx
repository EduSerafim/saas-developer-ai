import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'https://saas-developer-api.eadmms15.workers.dev';

// ===== CONFIGURAÇÕES =====
const LANGUAGE_THEMES = {
  python: { name: 'Python', icon: '🐍' },
  javascript: { name: 'JavaScript', icon: '⚡' },
  typescript: { name: 'TypeScript', icon: '🔷' },
  java: { name: 'Java', icon: '☕' },
  go: { name: 'Go', icon: '🐹' },
  rust: { name: 'Rust', icon: '🦀' },
  cpp: { name: 'C++', icon: '⚙️' },
  php: { name: 'PHP', icon: '🐘' },
  ruby: { name: 'Ruby', icon: '💎' },
  html: { name: 'HTML', icon: '🌐' },
  css: { name: 'CSS', icon: '🎨' },
  sql: { name: 'SQL', icon: '🗄️' },
  bash: { name: 'Bash', icon: '💻' },
  mq5: { name: 'MQL5', icon: '📈' },
  ntsl: { name: 'NTSL', icon: '💹' }
};

const RESPONSE_OPTIONS = [
  { id: 'code', name: '💻 Código', description: 'Somente o código' },
  { id: 'explanation', name: '💡 Explicação', description: 'Explicação do código' },
  { id: 'usage', name: '🚀 Uso', description: 'Instruções de uso' },
  { id: 'improvements', name: '🔧 Melhorias', description: 'Sugestões de melhorias' },
];

// ===== COMPONENTES =====
const CodeBlock = React.memo(({ block, onExplainCode }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(block.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([block.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code-${block.language}-${block.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExplain = () => {
    onExplainCode(block.id);
  };

  const highlightedCode = highlightSyntax(block.content, block.language);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden my-4">
      <div className="flex justify-between items-center px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm">{LANGUAGE_THEMES[block.language]?.icon || '📝'}</span>
          <span className="text-sm font-medium text-gray-300">
            {LANGUAGE_THEMES[block.language]?.name || block.language}
          </span>
          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
            #{block.id.toString().padStart(3, '0')}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExplain}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            <span>💡</span>
            Explicar
          </button>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 px-3 py-1 text-xs rounded transition-colors ${
              isCopied ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            <span>{isCopied ? '✅' : '📋'}</span>
            {isCopied ? 'Copiado!' : 'Copiar'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          >
            <span>⬇️</span>
            Download
          </button>
        </div>
      </div>
      <div className="max-h-96 overflow-auto">
        <pre className="p-4 bg-gray-900 text-gray-100 font-mono text-sm">
          <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        </pre>
      </div>
    </div>
  );
});

const Message = React.memo(({ message, onExplainCode }) => {
  if (message.type === 'user') {
    return (
      <div className="flex justify-end mb-6">
        <div className="flex items-start gap-3 max-w-4xl">
          <div className="flex-1">
            <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-br-md">
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
            👤
          </div>
        </div>
      </div>
    );
  }

  if (message.type === 'assistant') {
    return (
      <div className="flex mb-6">
        <div className="flex items-start gap-3 max-w-4xl">
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
            🤖
          </div>
          <div className="flex-1">
            {message.blocks && message.blocks.length > 0 ? (
              message.blocks.map((block, index) =>
                block.type === 'text' ? (
                  <div key={index} className="text-gray-200 whitespace-pre-wrap mb-4 leading-relaxed">
                    {block.content}
                  </div>
                ) : (
                  <CodeBlock key={block.id} block={block} onExplainCode={handleExplainCode}
                  />
                )
              )
            ) : (
              <div className="text-gray-200 whitespace-pre-wrap">
                {message.content}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
});

// ===== FUNÇÕES UTILITÁRIAS =====
let codeCounter = 1;

const extractCodeBlocks = (text) => {
  if (!text) return [];
  
  const blocks = [];
  const codeBlockRegex = /```(\w+)?\s*([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const textBefore = text.slice(lastIndex, match.index).trim();
    if (textBefore) {
      blocks.push({ type: 'text', content: textBefore });
    }

    const language = match[1] || 'text';
    const code = match[2].trim();
    blocks.push({ 
      type: 'code', 
      language, 
      content: code,
      id: codeCounter++
    });

    lastIndex = match.index + match[0].length;
  }

  const remainingText = text.slice(lastIndex).trim();
  if (remainingText) {
    blocks.push({ type: 'text', content: remainingText });
  }

  if (blocks.length === 0 && text.trim()) {
    blocks.push({ type: 'text', content: text });
  }

  return blocks;
};

const highlightSyntax = (code, language) => {
  if (language === 'python') {
    return code
      .replace(/(def|class|if|else|elif|for|while|return|import|from|as|try|except|finally|with)(?=\s)/g, '<span class="keyword">$1</span>')
      .replace(/(["'`])(.*?)\1/g, '<span class="string">$1$2$1</span>')
      .replace(/#(.*)$/gm, '<span class="comment">#$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>')
      .replace(/(\w+)\s*\(/g, '<span class="function">$1</span>(');
  }
  
  if (language === 'javascript' || language === 'typescript') {
    return code
      .replace(/(function|const|let|var|class|if|else|for|while|return|import|export|default|from)(?=\s)/g, '<span class="keyword">$1</span>')
      .replace(/(["'`])(.*?)\1/g, '<span class="string">$1$2$1</span>')
      .replace(/\/\/(.*)$/gm, '<span class="comment">//$1</span>')
      .replace(/\/\*([\s\S]*?)\*\//g, '<span class="comment">/*$1*/</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>')
      .replace(/(\w+)\s*\(/g, '<span class="function">$1</span>(');
  }

  if (language === 'mq5') {
    return code
      .replace(/(#property|input|extern|int|double|bool|string|void|return|if|else|for|while)(?=\s)/g, '<span class="keyword">$1</span>')
      .replace(/(OnInit|OnDeinit|OnTick|OnCalculate)(?=\s*\()/g, '<span class="function">$1</span>')
      .replace(/(["'])(.*?)\1/g, '<span class="string">$1$2$1</span>')
      .replace(/\/\/(.*)$/gm, '<span class="comment">//$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>');
  }

  if (language === 'ntsl') {
    return code
      .replace(/(function|var|if|else|for|while|return|class)(?=\s)/g, '<span class="keyword">$1</span>')
      .replace(/(["'])(.*?)\1/g, '<span class="string">$1$2$1</span>')
      .replace(/\/\/(.*)$/gm, '<span class="comment">//$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>')
      .replace(/(\w+)\s*\(/g, '<span class="function">$1</span>(');
  }
  
  return code;
};

// ===== COMPONENTE PRINCIPAL =====
function App() {
  const [conversation, setConversation] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [instruction, setInstruction] = useState('');
  const [language, setLanguage] = useState('python');
  const [isConsultor, setIsConsultor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Opções de resposta
  const [responseOptions, setResponseOptions] = useState({
    code: true,
    explanation: true,
    usage: true,
    improvements: true,
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Carregar histórico do localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('saas-developer-chats');
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Salvar histórico no localStorage
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem('saas-developer-chats', JSON.stringify(chatHistory));
    }
  }, [chatHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleResponseOption = (optionId) => {
    if (isConsultor) return; // Não permite alterar opções no modo consultor
    setResponseOptions(prev => ({
      ...prev,
      [optionId]: !prev[optionId]
    }));
  };

  // FUNÇÃO CORRIGIDA - Respeita REALMENTE as opções e modo consultor
  const buildPrompt = (userInput, language) => {
    if (isConsultor) {
      return `MODO CONSULTOR ATIVADO - APENAS EXPLICAÇÕES TEÓRICAS

Solicitação: ${userInput}

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

    const selectedOptions = Object.entries(responseOptions)
      .filter(([_, selected]) => selected)
      .map(([key]) => key);

    // Se só código foi selecionado - APENAS CÓDIGO
    if (selectedOptions.length === 1 && responseOptions.code) {
      return `Gere APENAS o código ${language} para: ${userInput}. 

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
      return `Gere APENAS o código ${language} para: ${userInput}. 

NÃO inclua explicações, instruções de uso, melhorias, exemplos ou qualquer texto adicional. Apenas o código puro.`;
    }

    // Se múltiplas opções selecionadas
    let prompt = `Instrução: ${userInput}\n\n`;
    
    if (language) {
      prompt += `Linguagem: ${language}\n\n`;
    }
    
    prompt += `Forneça SOMENTE:\n`;

    if (responseOptions.code) prompt += `• Código completo e funcional (em blocos de código)\n`;
    if (responseOptions.explanation) prompt += `• Explicação detalhada do que foi implementado\n`;
    if (responseOptions.usage) prompt += `• Instruções claras de como usar\n`;
    if (responseOptions.improvements) prompt += `• Possíveis melhorias e extensões\n`;

    prompt += `\n\nNÃO inclua nada além do que foi solicitado acima.`;

    return prompt;
  };

  const developCode = async () => {
    if (!instruction.trim()) return;

    setLoading(true);
    setIsGenerating(true);
    
    const userMessage = {
      type: 'user',
      content: instruction.trim(),
      language: isConsultor ? null : language,
      isConsultor: isConsultor,
      timestamp: new Date(),
      id: Date.now().toString()
    };
    
    const updatedConversation = [...conversation, userMessage];
    setConversation(updatedConversation);
    setInstruction('');
    
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const prompt = buildPrompt(userMessage.content, userMessage.language);
      
      console.log('📤 Enviando prompt:', prompt);
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          options: responseOptions,
          language: isConsultor ? null : language,
          isConsultor: isConsultor
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage = {
        type: 'assistant',
        content: data.response,
        blocks: extractCodeBlocks(data.response),
        timestamp: new Date(),
        id: (Date.now() + 1).toString()
      };
      
      setConversation(prev => [...prev, assistantMessage]);
      
      // Atualizar histórico
      if (currentChat) {
        setChatHistory(prev => prev.map(chat => 
          chat.id === currentChat.id 
            ? { ...chat, messages: [...updatedConversation, assistantMessage] }
            : chat
        ));
      }
      
    } catch (error) {
      console.error('Erro:', error);
      
      const errorMessage = {
        type: 'error',
        content: error.name === 'AbortError' 
          ? '⏹️ Geração interrompida pelo usuário.'
          : `❌ Erro: ${error.message}`,
        timestamp: new Date(),
        id: Date.now().toString()
      };
      
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  };

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setIsGenerating(false);
      setLoading(false);
    }
  };

  const createNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: 'Novo Chat',
      messages: [],
      createdAt: new Date().toISOString()
    };
    
    setCurrentChat(newChat);
    setConversation([]);
    setChatHistory(prev => [newChat, ...prev]);
    setInstruction('');
    inputRef.current?.focus();
  };

  const selectChat = (chat) => {
    setCurrentChat(chat);
    setConversation(chat.messages);
  };

  const handleExplainCode = (codeId) => {
    const explainPrompt = `Explique o código com ID #${codeId.toString().padStart(3, '0')}`;
    setInstruction(explainPrompt);
    inputRef.current?.focus();
  };

  return (
  <div className="flex h-screen bg-[#151517] text-white">
    {/* Sidebar */}
    {sidebarOpen && (
      <div className="w-64 bg-[#1B1B1C] border-r border-gray-800 flex flex-col">
        <div className="p-3 border-b border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                🚀
              </div>
              <span className="font-semibold text-sm">SAAS Developer</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-gray-800 rounded transition-colors text-gray-400"
            >
              ←
            </button>
          </div>
          
          <button
            onClick={createNewChat}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <span className="text-sm">+</span>
            Novo Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {chatHistory.map(chat => (
            <div
              key={chat.id}
              onClick={() => selectChat(chat)}
              className={`p-3 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors ${
                currentChat?.id === chat.id ? 'bg-gray-800 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="font-medium text-sm truncate">{chat.title}</div>
              <div className="text-xs text-gray-400 mt-1">
                {chat.messages.length} mensagens
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Área Principal */}
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header REDUZIDO */}
      <header className="bg-[#1B1B1C] border-b border-gray-800 px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400"
              >
                ☰
              </button>
            )}
            <h1 className="text-lg font-semibold">
              {currentChat ? currentChat.title : 'SAAS Developer AI'}
            </h1>
          </div>
        </div>
      </header>

      {/* Área de Conversação - COR #151517 */}
      <div className="flex-1 overflow-y-auto px-6 py-4 bg-[#151517]">
        {conversation.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-2xl">
              <div className="text-6xl mb-4">🚀</div>
              <h2 className="text-2xl font-bold mb-2">
                SAAS Developer AI
              </h2>
              <p className="text-gray-400 text-lg">
                Comece digitando uma instrução para gerar código...
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8 pb-32">
            {conversation.map((message) => (
              <Message 
                key={message.id} 
                message={message} 
                onExplainCode={handleExplainCode}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Sticky - LAYOUT CORRIGIDO */}
      <div className="sticky bottom-0 bg-[#1B1B1C] border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4">
          
          {/* Opções acima do input */}
          <div className="mb-4 bg-[#2C2C2E] rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isConsultor}
                  onChange={(e) => setIsConsultor(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-300">Modo Consultor</span>
              </label>
              <span className="text-xs text-gray-400">
                {isConsultor ? 'Apenas explicações teóricas' : 'Geração de código ativada'}
              </span>
            </div>

            <div className={`space-y-3 ${isConsultor ? 'opacity-50' : ''}`}>
              {/* Opções de Resposta */}
              <div className="flex flex-wrap gap-3">
                {RESPONSE_OPTIONS.map(option => (
                  <label 
                    key={option.id} 
                    className={`flex items-center space-x-2 cursor-pointer ${isConsultor ? 'cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={responseOptions[option.id]}
                      onChange={() => toggleResponseOption(option.id)}
                      disabled={isConsultor}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
                    />
                    <span className={`text-sm ${isConsultor ? 'text-gray-500' : 'text-gray-300'}`}>
                      {option.name}
                    </span>
                  </label>
                ))}
              </div>

              {/* Seleção de Linguagem */}
              {!isConsultor && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Linguagem de Programação:
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={isConsultor}
                    className="w-full bg-[#2C2C2E] border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  >
                    {Object.entries(LANGUAGE_THEMES).map(([key, theme]) => (
                      <option key={key} value={key}>
                        {theme.icon} {theme.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Input Principal - Box separado com largura reduzida */}
          <div className="bg-[#2C2C2E] rounded-lg p-4">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder={
                  isConsultor 
                    ? "Faça uma pergunta sobre programação ou peça uma explicação..."
                    : "Descreva o código que você precisa..."
                }
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    developCode();
                  }
                }}
                className="flex-1 max-w-[calc(100%-120px)] px-4 py-3 border border-gray-600 rounded-lg bg-[#2C2C2E] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              
              <div className="flex flex-col gap-2">
                {isGenerating ? (
                  <button 
                    onClick={stopGeneration}
                    className="flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    ⏹️ Parar
                  </button>
                ) : (
                  <button 
                    onClick={developCode}
                    disabled={!instruction.trim() || loading}
                    className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed text-sm"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Gerando...
                      </>
                    ) : (
                      <>
                        <span>🚀</span>
                        Enviar
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
);
}

export default App;