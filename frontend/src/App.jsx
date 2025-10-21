import React, { useState, useEffect, useRef, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'https://saas-developer-api.eadmms15.workers.dev';

// ===== CONFIGURAÇÕES =====
const LANGUAGE_THEMES = {
  python: { name: 'Python', icon: '🐍', extensions: ['.py'] },
  javascript: { name: 'JavaScript', icon: '⚡', extensions: ['.js', '.jsx'] },
  typescript: { name: 'TypeScript', icon: '🔷', extensions: ['.ts', '.tsx'] },
  java: { name: 'Java', icon: '☕', extensions: ['.java'] },
  go: { name: 'Go', icon: '🐹', extensions: ['.go'] },
  rust: { name: 'Rust', icon: '🦀', extensions: ['.rs'] },
  php: { name: 'PHP', icon: '🐘', extensions: ['.php'] },
  csharp: { name: 'C#', icon: '💚', extensions: ['.cs'] },
  ruby: { name: 'Ruby', icon: '♦️', extensions: ['.rb'] },
  swift: { name: 'Swift', icon: '🕊', extensions: ['.swift'] },
  kotlin: { name: 'Kotlin', icon: '🔶', extensions: ['.kt'] }
};

const AVAILABLE_LANGUAGES = [
  { id: 'python', name: 'Python', icon: '🐍', popular: true },
  { id: 'javascript', name: 'JavaScript', icon: '⚡', popular: true },
  { id: 'typescript', name: 'TypeScript', icon: '🔷', popular: true },
  { id: 'java', name: 'Java', icon: '☕', popular: true },
  { id: 'go', name: 'Go', icon: '🐹', popular: false },
  { id: 'rust', name: 'Rust', icon: '🦀', popular: false },
  { id: 'php', name: 'PHP', icon: '🐘', popular: false },
  { id: 'csharp', name: 'C#', icon: '💚', popular: false },
  { id: 'ruby', name: 'Ruby', icon: '♦️', popular: false },
  { id: 'swift', name: 'Swift', icon: '🕊', popular: false },
  { id: 'kotlin', name: 'Kotlin', icon: '🔶', popular: false }
];

const FRAMEWORKS_BY_LANGUAGE = {
  python: ['Django', 'Flask', 'FastAPI', 'Pyramid', 'Nenhum'],
  javascript: ['React', 'Vue', 'Angular', 'Node.js', 'Express', 'Next.js', 'Nenhum'],
  typescript: ['React', 'Vue', 'Angular', 'Node.js', 'Express', 'Next.js', 'NestJS', 'Nenhum'],
  java: ['Spring', 'Spring Boot', 'Jakarta EE', 'Micronaut', 'Nenhum'],
  go: ['Gin', 'Echo', 'Fiber', 'Beego', 'Nenhum'],
  rust: ['Actix', 'Rocket', 'Warp', 'Tide', 'Nenhum'],
  php: ['Laravel', 'Symfony', 'CodeIgniter', 'CakePHP', 'Nenhum'],
  csharp: ['.NET', 'ASP.NET', 'Blazor', 'Xamarin', 'Nenhum'],
  ruby: ['Ruby on Rails', 'Sinatra', 'Hanami', 'Nenhum'],
  swift: ['Vapor', 'Perfect', 'Kitura', 'Nenhum'],
  kotlin: ['Spring', 'Ktor', 'Micronaut', 'Vert.x', 'Nenhum']
};

const RESPONSE_OPTIONS = [
  { id: 'code', name: '📋 Apenas o código', description: 'Somente o código sem explicações' },
  { id: 'explanation', name: '💡 Explicação do código', description: 'Explicação do que foi implementado' },
  { id: 'usage', name: '🚀 Instruções de uso', description: 'Como usar o código gerado' },
  { id: 'improvements', name: '🔧 Possíveis melhorias', description: 'Sugestões de melhorias e extensões' },
  { id: 'critical', name: '⚠️ Pontos críticos', description: 'Atenções e cuidados importantes' },
  { id: 'examples', name: '📝 Exemplos adicionais', description: 'Exemplos complementares de uso' }
];

// ===== FUNÇÕES UTILITÁRIAS =====
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
      id: Math.random().toString(36).substr(2, 9)
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
  
  if (language === 'java') {
    return code
      .replace(/(public|private|protected|class|interface|static|void|int|String|boolean|if|else|for|while|return|import|package)(?=\s)/g, '<span class="keyword">$1</span>')
      .replace(/(["'])(.*?)\1/g, '<span class="string">$1$2$1</span>')
      .replace(/\/\/(.*)$/gm, '<span class="comment">//$1</span>')
      .replace(/\/\*([\s\S]*?)\*\//g, '<span class="comment">/*$1*/</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>');
  }
  
  return code;
};

// ===== COMPONENTES =====
const CodeBlock = ({ block }) => {
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
    a.download = `code-${block.language}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const highlightedCode = highlightSyntax(block.content, block.language);

  return (
    <div className="code-block-wrapper">
      <div className="code-block">
        <div className="code-header">
          <div className="code-language">
            <span className="lang-icon">
              {LANGUAGE_THEMES[block.language]?.icon || '📝'}
            </span>
            <span className="lang-name">
              {LANGUAGE_THEMES[block.language]?.name || block.language}
            </span>
          </div>
          <div className="code-actions">
            <button 
              className={`action-btn copy-btn ${isCopied ? 'copied' : ''}`}
              onClick={handleCopy}
              title="Copiar código"
            >
              {isCopied ? '✅' : '📋'}
            </button>
            <button 
              className="action-btn download-btn"
              onClick={handleDownload}
              title="Download do código"
            >
              ⬇️
            </button>
          </div>
        </div>
        <div className="code-content-wrapper">
          <pre className="code-content">
            <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
          </pre>
        </div>
      </div>
    </div>
  );
};

const Message = ({ message }) => {
  if (message.type === 'user') {
    return (
      <div className="message user-message">
        <div className="message-avatar">👤</div>
        <div className="message-content">
          <div className="message-text">{message.content}</div>
        </div>
      </div>
    );
  }

  if (message.type === 'assistant') {
    return (
      <div className="message assistant-message">
        <div className="message-avatar">🤖</div>
        <div className="message-content">
          {message.blocks && message.blocks.length > 0 ? (
            message.blocks.map((block, index) =>
              block.type === 'text' ? (
                <div key={index} className="text-block">
                  {block.content}
                </div>
              ) : (
                <CodeBlock key={block.id} block={block} />
              )
            )
          ) : (
            <div className="text-block">
              {message.content}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

const ChatHistoryItem = ({ chat, isActive, onClick }) => {
  return (
    <div 
      className={`chat-history-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="chat-icon">💬</div>
      <div className="chat-info">
        <div className="chat-title">{chat.title}</div>
        <div className="chat-preview">{chat.preview}</div>
        <div className="chat-date">{chat.date}</div>
      </div>
    </div>
  );
};

// ===== COMPONENTE PRINCIPAL =====
function App() {
  // Estados principais
  const [conversation, setConversation] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [instruction, setInstruction] = useState('');
  const [language, setLanguage] = useState('python');
  const [framework, setFramework] = useState('');
  const [mode, setMode] = useState('develop');
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [responseOptions, setResponseOptions] = useState({
    code: true,
    explanation: true,
    usage: true,
    improvements: false,
    critical: false,
    examples: false
  });

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const stickyInputRef = useRef(null);

  // Efeitos
  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  useEffect(() => {
    const handleScroll = () => {
      if (stickyInputRef.current) {
        const rect = stickyInputRef.current.getBoundingClientRect();
        if (rect.top < 100) {
          stickyInputRef.current.style.position = 'fixed';
          stickyInputRef.current.style.bottom = '20px';
          stickyInputRef.current.style.left = '50%';
          stickyInputRef.current.style.transform = 'translateX(-50%)';
          stickyInputRef.current.style.width = 'calc(100% - 400px)';
          stickyInputRef.current.style.zIndex = '1000';
        } else {
          stickyInputRef.current.style.position = 'sticky';
          stickyInputRef.current.style.bottom = '0';
          stickyInputRef.current.style.left = 'auto';
          stickyInputRef.current.style.transform = 'none';
          stickyInputRef.current.style.width = '100%';
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleResponseOption = (optionId) => {
    setResponseOptions(prev => ({
      ...prev,
      [optionId]: !prev[optionId]
    }));
  };

  const buildPrompt = (userInput, language, framework) => {
    const selectedOptions = Object.entries(responseOptions)
      .filter(([_, selected]) => selected)
      .map(([key]) => key);

    if (selectedOptions.length === 0) {
      return `Você é um expert em ${language}${framework ? ` e ${framework}` : ''}.

Gere APENAS o código baseado na seguinte instrução, sem nenhuma explicação adicional:

INSTRUÇÃO: ${userInput}

Forneça somente o código necessário, limpo e bem estruturado.`;
    }

    let prompt = `Você é um expert em ${language}${framework ? ` e ${framework}` : ''}.

Gere código baseado na seguinte instrução:

INSTRUÇÃO: ${userInput}

`;

    if (responseOptions.code) prompt += '1. Código completo, funcional e bem estruturado\n';
    if (responseOptions.explanation) prompt += '2. Explicação detalhada do que foi implementado\n';
    if (responseOptions.usage) prompt += '3. Instruções claras de como usar o código\n';
    if (responseOptions.improvements) prompt += '4. Possíveis melhorias e extensões\n';
    if (responseOptions.critical) prompt += '5. Pontos críticos e cuidados importantes\n';
    if (responseOptions.examples) prompt += '6. Exemplos adicionais de uso\n';

    if (selectedOptions.length === 1 && responseOptions.code) {
      prompt += '\nForneça APENAS o código, sem nenhuma explicação adicional.';
    } else {
      prompt += '\nSeja preciso e profissional na resposta.';
    }

    return prompt;
  };

  const developCode = async () => {
    if (!instruction.trim()) return;

    setLoading(true);
    setIsGenerating(true);
    setIsPaused(false);
    
    const userMessage = {
      type: 'user',
      content: instruction.trim(),
      language,
      framework: framework === 'Nenhum' ? null : framework,
      timestamp: new Date(),
      id: Date.now().toString()
    };
    
    setConversation(prev => [...prev, userMessage]);
    setInstruction('');
    
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const prompt = buildPrompt(userMessage.content, userMessage.language, userMessage.framework);
      
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
        
        // Atualizar histórico de chats
        updateChatHistory(userMessage.content, data.result);
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
      setIsPaused(false);
    }
  };

  const updateChatHistory = (userMessage, assistantResponse) => {
    const newChat = {
      id: Date.now().toString(),
      title: userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : ''),
      preview: assistantResponse.slice(0, 100) + (assistantResponse.length > 100 ? '...' : ''),
      date: new Date().toLocaleDateString('pt-BR'),
      conversation: [...conversation]
    };

    setChatHistory(prev => [newChat, ...prev.slice(0, 9)]); // Mantém apenas 10 chats
    setCurrentChat(newChat.id);
  };

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setIsGenerating(false);
      setLoading(false);
      setIsPaused(false);
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    // Aqui você pode implementar a lógica de pausar/continuar a geração
    // Isso pode requerer modificações no backend para suportar streaming
  };

  const createNewChat = () => {
    setConversation([]);
    setCurrentChat(null);
    setInstruction('');
    inputRef.current?.focus();
  };

  const loadChat = (chatId) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setConversation(chat.conversation);
      setCurrentChat(chatId);
    }
  };

  const availableFrameworks = FRAMEWORKS_BY_LANGUAGE[language] || [];

  return (
    <div className="app deepseek-layout">
      {/* Sidebar - Histórico de Chats */}
      <div className="sidebar">
        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={createNewChat}>
            <span className="btn-icon">+</span>
            Novo Chat
          </button>
        </div>
        
        <div className="chat-history">
          {chatHistory.map(chat => (
            <ChatHistoryItem
              key={chat.id}
              chat={chat}
              isActive={currentChat === chat.id}
              onClick={() => loadChat(chat.id)}
            />
          ))}
          
          {chatHistory.length === 0 && (
            <div className="empty-history">
              <div className="empty-icon">💬</div>
              <p>Nenhum chat anterior</p>
            </div>
          )}
        </div>
        
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">👤</div>
            <span className="user-name">Usuário</span>
          </div>
        </div>
      </div>

      {/* Área Principal */}
      <div className="main-content">
        {/* Área de Conversação */}
        <div className="conversation-area">
          {conversation.length === 0 ? (
            <div className="empty-conversation">
              <div className="welcome-icon">🚀</div>
              <h2>SAAS Developer AI</h2>
              <p>Comece digitando uma instrução para gerar código...</p>
            </div>
          ) : (
            <div className="messages-container">
              {conversation.map((message) => (
                <Message key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Sticky - EXATAMENTE COMO DEEPSEEK */}
        <div className="sticky-input-container" ref={stickyInputRef}>
          <div className="input-wrapper">
            {/* Opções de Resposta */}
            <div className="response-options-bar">
              <div className="options-label">Incluir na resposta:</div>
              <div className="options-list">
                {RESPONSE_OPTIONS.map(option => (
                  <label key={option.id} className="option-checkbox" title={option.description}>
                    <input
                      type="checkbox"
                      checked={responseOptions[option.id]}
                      onChange={() => toggleResponseOption(option.id)}
                    />
                    <span className="option-text">{option.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Área Principal do Input */}
            <div className="main-input-area">
              {/* Seletores */}
              <div className="input-config">
                <div className="config-group">
                  <select 
                    value={mode} 
                    onChange={(e) => setMode(e.target.value)}
                    className="config-select"
                  >
                    <option value="develop">💻 Modo Desenvolvedor</option>
                    <option value="ask">❓ Modo Consultor</option>
                  </select>
                </div>
                
                <div className="config-group">
                  <select 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value)}
                    className="config-select"
                  >
                    {AVAILABLE_LANGUAGES.map(lang => (
                      <option key={lang.id} value={lang.id}>
                        {lang.icon} {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                {mode === 'develop' && (
                  <div className="config-group">
                    <select 
                      value={framework} 
                      onChange={(e) => setFramework(e.target.value)}
                      className="config-select"
                    >
                      <option value="">Framework (opcional)</option>
                      {availableFrameworks.map(fw => (
                        <option key={fw} value={fw}>{fw}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Textarea e Botões */}
              <div className="input-controls">
                <textarea
                  ref={inputRef}
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder={
                    mode === 'develop' 
                      ? `Descreva o código que você precisa em ${LANGUAGE_THEMES[language]?.name}...`
                      : "Faça sua pergunta sobre programação..."
                  }
                  rows="3"
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      developCode();
                    }
                  }}
                />
                
                <div className="input-buttons">
                  {isGenerating ? (
                    <>
                      <button 
                        className="control-btn pause-btn"
                        onClick={togglePause}
                        disabled={!isGenerating}
                      >
                        {isPaused ? '▶️ Continuar' : '⏸️ Pausar'}
                      </button>
                      <button 
                        className="control-btn stop-btn"
                        onClick={stopGeneration}
                      >
                        ⏹️ Parar
                      </button>
                    </>
                  ) : (
                    <button 
                      className="control-btn send-btn"
                      onClick={developCode}
                      disabled={!instruction.trim() || loading}
                    >
                      {loading ? '⏳ Gerando...' : '🚀 Enviar'}
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