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
};

const FRAMEWORKS_BY_LANGUAGE = {
  python: ['Django', 'Flask', 'FastAPI', 'Nenhum'],
  javascript: ['React', 'Vue', 'Angular', 'Node.js', 'Nenhum'],
  typescript: ['React', 'Vue', 'Angular', 'Node.js', 'NestJS', 'Nenhum'],
  java: ['Spring', 'Spring Boot', 'Nenhum'],
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
                  <CodeBlock key={block.id} block={block} onExplainCode={onExplainCode} />
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
  
  return code;
};

// ===== COMPONENTE PRINCIPAL =====
function App() {
  const [conversation, setConversation] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [instruction, setInstruction] = useState('');
  const [language, setLanguage] = useState('python');
  const [framework, setFramework] = useState('');
  const [mode, setMode] = useState('develop');
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true); // TEMA ESCURO POR PADRÃO

  // Opções de resposta - CORRIGIDAS para funcionar
  const [responseOptions, setResponseOptions] = useState({
    code: true,
    explanation: false,
    usage: false,
    improvements: false,
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  // TEMA ESCURO FUNCIONANDO - aplica ao HTML
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleResponseOption = (optionId) => {
    setResponseOptions(prev => ({
      ...prev,
      [optionId]: !prev[optionId]
    }));
  };

  // FUNÇÃO CORRIGIDA - Respeita REALMENTE as opções
  const buildPrompt = (userInput, language, framework) => {
    const selectedOptions = Object.entries(responseOptions)
      .filter(([_, selected]) => selected)
      .map(([key]) => key);

    // Se só código foi selecionado - ENVIA APENAS CÓDIGO
    if (selectedOptions.length === 1 && responseOptions.code) {
      return `Gere APENAS o código ${language}${framework ? ` com ${framework}` : ''} para: ${userInput}. \n\nNÃO inclua explicações, instruções de uso, melhorias, exemplos ou qualquer texto adicional. Apenas o código puro.`;
    }

    // Se nenhuma opção selecionada, padrão para código
    if (selectedOptions.length === 0) {
      return `Gere APENAS o código ${language}${framework ? ` com ${framework}` : ''} para: ${userInput}. \n\nNÃO inclua explicações, instruções de uso, melhorias, exemplos ou qualquer texto adicional. Apenas o código puro.`;
    }

    // Se múltiplas opções selecionadas
    let prompt = `Instrução: ${userInput}\n\n`;
    prompt += `Linguagem: ${language}${framework ? `, Framework: ${framework}` : ''}\n\n`;
    prompt += `Forneça SOMENTE:\n`;

    if (responseOptions.code) prompt += `• Código completo (em blocos de código)\n`;
    if (responseOptions.explanation) prompt += `• Explicação do que foi implementado\n`;
    if (responseOptions.usage) prompt += `• Instruções de como usar\n`;
    if (responseOptions.improvements) prompt += `• Possíveis melhorias e extensões\n`;

    prompt += `\nNÃO inclua nada além do que foi solicitado acima.`;

    return prompt;
  };

  const developCode = async () => {
    if (!instruction.trim()) return;

    setLoading(true);
    setIsGenerating(true);
    
    const userMessage = {
      type: 'user',
      content: instruction.trim(),
      language,
      framework: framework === 'Nenhum' ? null : framework,
      timestamp: new Date(),
      id: Date.now().toString()
    };
    
    const updatedConversation = [...conversation, userMessage];
    setConversation(updatedConversation);
    setInstruction('');
    
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const prompt = buildPrompt(userMessage.content, userMessage.language, userMessage.framework);
      
      console.log('📤 Enviando prompt:', prompt);
      
      const response = await fetch(`${API_URL}/api/develop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: prompt,
          language: userMessage.language,
          framework: userMessage.framework
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const assistantMessage = {
          type: 'assistant',
          content: data.result,
          blocks: extractCodeBlocks(data.result),
          timestamp: new Date(),
          id: (Date.now() + 1).toString()
        };
        
        setConversation(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Erro desconhecido do servidor');
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
    setConversation([]);
    setCurrentChat(null);
    setInstruction('');
    inputRef.current?.focus();
  };

  const handleExplainCode = (codeId) => {
    const explainPrompt = `Explique o código com ID #${codeId.toString().padStart(3, '0')}`;
    setInstruction(explainPrompt);
    inputRef.current?.focus();
  };

  const availableFrameworks = FRAMEWORKS_BY_LANGUAGE[language] || [];

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold">
                  🚀
                </div>
                <span className="font-semibold">SAAS Developer</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400"
              >
                ←
              </button>
            </div>
            
            <button
              onClick={createNewChat}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-lg">+</span>
              Novo Chat
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {chatHistory.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">💬</div>
                <p>Nenhum chat anterior</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Área Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400"
                >
                  ☰
                </button>
              )}
              <h1 className="text-xl font-semibold">
                {currentChat ? 'Chat' : 'Novo Chat'}
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </header>

        {/* Área de Conversação */}
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-900">
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

        {/* Input Sticky - LAYOT DEEPSEEK CORRETO */}
        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="bg-gray-800 border border-gray-600 rounded-lg">
              <div className="flex flex-col lg:flex-row">
                {/* Área Principal do Input */}
                <div className="flex-1 p-4">
                  {/* Configurações Compactas */}
                  <div className="flex gap-3 mb-3 flex-wrap">
                    <select 
                      value={mode} 
                      onChange={(e) => setMode(e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="develop">💻 Desenvolver</option>
                      <option value="ask">❓ Consultar</option>
                    </select>
                    
                    <select 
                      value={language} 
                      onChange={(e) => setLanguage(e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="python">🐍 Python</option>
                      <option value="javascript">⚡ JavaScript</option>
                      <option value="typescript">🔷 TypeScript</option>
                      <option value="java">☕ Java</option>
                    </select>

                    {mode === 'develop' && (
                      <select 
                        value={framework} 
                        onChange={(e) => setFramework(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Framework (opcional)</option>
                        {availableFrameworks.map(fw => (
                          <option key={fw} value={fw}>{fw}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Input e Botões */}
                  <div className="flex gap-3">
                    <textarea
                      ref={inputRef}
                      value={instruction}
                      onChange={(e) => setInstruction(e.target.value)}
                      placeholder={
                        mode === 'develop' 
                          ? `Descreva o código que você precisa em ${LANGUAGE_THEMES[language]?.name}... (Ctrl+Enter para enviar)`
                          : "Faça sua pergunta sobre programação... (Ctrl+Enter para enviar)"
                      }
                      rows="2"
                      disabled={loading}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          developCode();
                        }
                      }}
                      className="flex-1 px-4 py-3 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                    />
                    
                    <div className="flex flex-col gap-2">
                      {isGenerating ? (
                        <button 
                          onClick={stopGeneration}
                          className="flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors text-sm"
                        >
                          ⏹️ Parar
                        </button>
                      ) : (
                        <button 
                          onClick={developCode}
                          disabled={!instruction.trim() || loading}
                          className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded font-medium transition-colors disabled:cursor-not-allowed text-sm"
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

                {/* Opções de Resposta - MESMO FUNDO ESCURO */}
                <div className="lg:w-64 bg-gray-800 lg:border-l border-gray-700 p-4 border-t lg:border-t-0">
                  <div className="text-sm font-medium text-gray-300 mb-3">
                    Incluir na resposta:
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                    {RESPONSE_OPTIONS.map(option => (
                      <label key={option.id} className="flex items-center gap-2 cursor-pointer hover:text-blue-400 transition-colors">
                        <input
                          type="checkbox"
                          checked={responseOptions[option.id]}
                          onChange={() => toggleResponseOption(option.id)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-600 bg-gray-700 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-300">
                          {option.name}
                        </span>
                      </label>
                    ))}
                  </div>
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