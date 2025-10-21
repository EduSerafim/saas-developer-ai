import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

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
    <div className="code-block">
      <div className="code-header">
        <div className="flex items-center gap-2">
          <span className="text-sm">{LANGUAGE_THEMES[block.language]?.icon || '📝'}</span>
          <span className="text-sm font-medium text-gray-300">
            {LANGUAGE_THEMES[block.language]?.name || block.language}
          </span>
          <span className="text-xs bg-primary-600 text-white px-2 py-1 rounded">
            #{block.id.toString().padStart(3, '0')}
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={handleExplain}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            title="Explicar este código"
          >
            <span>💡</span>
            Explicar
          </button>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              isCopied 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
            title="Copiar código"
          >
            <span>{isCopied ? '✅' : '📋'}</span>
            {isCopied ? 'Copiado!' : 'Copiar'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            title="Download do código"
          >
            <span>⬇️</span>
            Download
          </button>
        </div>
      </div>
      <div className="max-h-96 overflow-auto">
        <pre className="code-content">
          <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        </pre>
      </div>
    </div>
  );
});

const Message = React.memo(({ message, onExplainCode }) => {
  if (message.type === 'user') {
    return (
      <div className="message-user">
        <div className="flex-1 max-w-3xl">
          <div className="bg-primary-600 text-white p-4 rounded-2xl rounded-br-md">
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        </div>
        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
          👤
        </div>
      </div>
    );
  }

  if (message.type === 'assistant') {
    return (
      <div className="message-assistant">
        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
          🤖
        </div>
        <div className="flex-1 max-w-3xl">
          {message.blocks && message.blocks.length > 0 ? (
            message.blocks.map((block, index) =>
              block.type === 'text' ? (
                <div key={index} className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-4 leading-relaxed">
                  {block.content}
                </div>
              ) : (
                <CodeBlock key={block.id} block={block} onExplainCode={onExplainCode} />
              )
            )
          ) : (
            <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {message.content}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
});

const ChatHistoryItem = ({ chat, isActive, onClick, onRename, onPin, onShare, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div 
      className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
        isActive 
          ? 'bg-primary-100 border border-primary-300 dark:bg-primary-900 dark:border-primary-700' 
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${
          chat.pinned ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-gray-100 dark:bg-gray-700'
        }`}>
          {chat.pinned ? '📌' : '💬'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {chat.title}
            </h3>
            {chat.pinned && (
              <span className="text-yellow-500 text-xs">📌</span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1">
            {chat.preview}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {chat.date}
          </p>
        </div>
      </div>
      
      {/* Menu de Ações */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          ⋮
        </button>
        
        {showMenu && (
          <div 
            ref={menuRef}
            className="absolute right-0 top-6 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 py-1"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRename(chat.id);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <span>✏️</span> Renomear
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPin(chat.id);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <span>📌</span> {chat.pinned ? 'Desfixar' : 'Fixar'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare(chat.id);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <span>🔗</span> Compartilhar
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(chat.id);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <span>🗑️</span> Deletar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  
  // Opções de resposta - agora funcionais
  const [responseOptions, setResponseOptions] = useState({
    code: true,
    explanation: false,
    usage: false,
    improvements: false,
    critical: false,
    examples: false
  });

  // Estados para renomear chat
  const [renamingChat, setRenamingChat] = useState(null);
  const [newChatName, setNewChatName] = useState('');

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Efeitos
  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleResponseOption = (optionId) => {
    setResponseOptions(prev => ({
      ...prev,
      [optionId]: !prev[optionId]
    }));
  };

  // Função para construir prompt baseado nas opções selecionadas - CORRIGIDA
  const buildPrompt = (userInput, language, framework, conversationHistory = []) => {
    // Se só código foi selecionado, retornar prompt minimalista
    if (responseOptions.code && Object.values(responseOptions).filter(v => v).length === 1) {
      return `Gere APENAS o código ${language}${framework ? ` com ${framework}` : ''} para: ${userInput}. Nada mais.`;
    }

    let prompt = `Contexto da conversa:\n`;
    conversationHistory.forEach(msg => {
      if (msg.type === 'user') {
        prompt += `Usuário: ${msg.content}\n`;
      } else if (msg.type === 'assistant') {
        prompt += `Assistente: [Resposta anterior]\n`;
      }
    });
    
    prompt += `\nInstrução atual: ${userInput}\n\n`;
    prompt += `Linguagem: ${language}${framework ? `, Framework: ${framework}` : ''}\n\n`;
    prompt += `Forneça:\n`;

    if (responseOptions.code) prompt += `- Código completo e funcional\n`;
    if (responseOptions.explanation) prompt += `- Explicação detalhada do código\n`;
    if (responseOptions.usage) prompt += `- Instruções de uso\n`;
    if (responseOptions.improvements) prompt += `- Possíveis melhorias\n`;
    if (responseOptions.critical) prompt += `- Pontos críticos\n`;
    if (responseOptions.examples) prompt += `- Exemplos adicionais\n`;

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
    
    const updatedConversation = [...conversation, userMessage];
    setConversation(updatedConversation);
    setInstruction('');
    
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const prompt = buildPrompt(userMessage.content, userMessage.language, userMessage.framework, conversation);
      
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
        
        const finalConversation = [...updatedConversation, assistantMessage];
        setConversation(finalConversation);
        
        // Atualizar histórico de chats
        updateChatHistory(userMessage.content, data.result, finalConversation);
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

  const updateChatHistory = (userMessage, assistantResponse, fullConversation) => {
    const newChat = {
      id: Date.now().toString(),
      title: userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : ''),
      preview: assistantResponse.slice(0, 100) + (assistantResponse.length > 100 ? '...' : ''),
      date: new Date().toLocaleDateString('pt-BR'),
      conversation: fullConversation,
      pinned: false,
      timestamp: new Date().toISOString()
    };

    setChatHistory(prev => [newChat, ...prev.filter(chat => chat.id !== newChat.id)]);
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
    // Lógica de pausa/continuação pode ser implementada com streaming
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

  // Funções do menu de chat
  const handleRenameChat = (chatId) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setRenamingChat(chatId);
      setNewChatName(chat.title);
    }
  };

  const confirmRename = () => {
    if (renamingChat && newChatName.trim()) {
      setChatHistory(prev => 
        prev.map(chat => 
          chat.id === renamingChat 
            ? { ...chat, title: newChatName.trim() }
            : chat
        )
      );
      setRenamingChat(null);
      setNewChatName('');
    }
  };

  const handlePinChat = (chatId) => {
    setChatHistory(prev => 
      prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, pinned: !chat.pinned }
          : chat
      ).sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.timestamp) - new Date(a.timestamp);
      })
    );
  };

  const handleShareChat = (chatId) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      const shareData = {
        title: chat.title,
        conversation: chat.conversation,
        timestamp: chat.timestamp
      };
      const shareText = JSON.stringify(shareData, null, 2);
      navigator.clipboard.writeText(shareText);
      alert('Conversa copiada para a área de transferência!');
    }
  };

  const handleDeleteChat = (chatId) => {
    if (window.confirm('Tem certeza que deseja deletar este chat?')) {
      setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
      if (currentChat === chatId) {
        setConversation([]);
        setCurrentChat(null);
      }
    }
  };

  const handleExplainCode = (codeId) => {
    const explainPrompt = `Explique o código com ID #${codeId.toString().padStart(3, '0')} da conversa atual.`;
    setInstruction(explainPrompt);
    inputRef.current?.focus();
  };

  const availableFrameworks = FRAMEWORKS_BY_LANGUAGE[language] || [];

  // Chats ordenados (pinned first)
  const sortedChatHistory = [...chatHistory].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  return (
    <div className={`flex h-screen bg-white dark:bg-gray-900 transition-colors ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Header da Sidebar */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center text-white font-bold">
                  {/* SUA LOGO AQUI */}
                  🚀
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">SAAS Developer</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
                title="Fechar sidebar"
              >
                ←
              </button>
            </div>
            
            <button
              onClick={createNewChat}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-lg">+</span>
              Novo Chat
            </button>
          </div>
          
          {/* Lista de Chats */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {sortedChatHistory.map(chat => (
                <ChatHistoryItem
                  key={chat.id}
                  chat={chat}
                  isActive={currentChat === chat.id}
                  onClick={() => loadChat(chat.id)}
                  onRename={handleRenameChat}
                  onPin={handlePinChat}
                  onShare={handleShareChat}
                  onDelete={handleDeleteChat}
                />
              ))}
              
              {chatHistory.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <div className="text-4xl mb-2">💬</div>
                  <p>Nenhum chat anterior</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Footer da Sidebar */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 p-2">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                👤
              </div>
              <span className="font-medium text-gray-900 dark:text-white">Usuário</span>
            </div>
          </div>
        </div>
      )}

      {/* Área Principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
                  title="Abrir sidebar"
                >
                  ☰
                </button>
              )}
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {currentChat ? chatHistory.find(c => c.id === currentChat)?.title : 'Novo Chat'}
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
                title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </header>

        {/* Área de Conversação */}
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50 dark:bg-gray-900">
          {conversation.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-2xl">
                <div className="text-6xl mb-4">🚀</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  SAAS Developer AI
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
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

        {/* Input Sticky */}
        <div className="sticky-input-container">
          <div className="max-w-4xl mx-auto">
            {/* Opções de Resposta - Agora Discretas */}
            <div className="mb-3 flex items-center gap-4 text-sm">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Incluir:</span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(responseOptions).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={() => toggleResponseOption(key)}
                      className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    />
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      {key === 'code' && '💻'}
                      {key === 'explanation' && '💡'} 
                      {key === 'usage' && '🚀'}
                      {key === 'improvements' && '🔧'}
                      {key === 'critical' && '⚠️'}
                      {key === 'examples' && '📝'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Área Principal do Input */}
            <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg overflow-hidden">
              {/* Configurações */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 flex flex-wrap gap-3">
                <select 
                  value={mode} 
                  onChange={(e) => setMode(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="develop">💻 Desenvolver</option>
                  <option value="ask">❓ Consultar</option>
                </select>
                
                <select 
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {AVAILABLE_LANGUAGES.map(lang => (
                    <option key={lang.id} value={lang.id}>
                      {lang.icon} {lang.name}
                    </option>
                  ))}
                </select>

                {mode === 'develop' && (
                  <select 
                    value={framework} 
                    onChange={(e) => setFramework(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Framework (opcional)</option>
                    {availableFrameworks.map(fw => (
                      <option key={fw} value={fw}>{fw}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Textarea e Botões */}
              <div className="p-4">
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
                    rows="3"
                    disabled={loading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        developCode();
                      }
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  
                  <div className="flex flex-col gap-2">
                    {isGenerating ? (
                      <>
                        <button 
                          onClick={togglePause}
                          disabled={!isGenerating}
                          className="flex items-center gap-2 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                        >
                          {isPaused ? '▶️' : '⏸️'}
                        </button>
                        <button 
                          onClick={stopGeneration}
                          className="flex items-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                        >
                          ⏹️
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={developCode}
                        disabled={!instruction.trim() || loading}
                        className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
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

      {/* Modal de Renomear */}
      {renamingChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Renomear Chat
            </h3>
            <input
              type="text"
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Nome do chat..."
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setRenamingChat(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmRename}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;