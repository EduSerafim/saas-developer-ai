import React, { useState, useEffect, useRef } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'https://saas-developer-api.eadmms15.workers.dev'

// Configurações de temas por linguagem
const LANGUAGE_THEMES = {
  python: { primary: '#3776AB', secondary: '#FFD43B', name: 'Python' },
  javascript: { primary: '#F7DF1E', secondary: '#000000', name: 'JavaScript' },
  typescript: { primary: '#3178C6', secondary: '#FFFFFF', name: 'TypeScript' },
  java: { primary: '#007396', secondary: '#ED8B00', name: 'Java' },
  go: { primary: '#00ADD8', secondary: '#FFFFFF', name: 'Go' },
  rust: { primary: '#000000', secondary: '#DEA584', name: 'Rust' },
  php: { primary: '#777BB4', secondary: '#FFFFFF', name: 'PHP' },
  csharp: { primary: '#239120', secondary: '#FFFFFF', name: 'C#' },
  ruby: { primary: '#CC342D', secondary: '#FFFFFF', name: 'Ruby' },
  swift: { primary: '#FA7343', secondary: '#FFFFFF', name: 'Swift' },
  kotlin: { primary: '#7F52FF', secondary: '#FFFFFF', name: 'Kotlin' }
}

// Linguagens disponíveis
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
]

// Frameworks por linguagem
const FRAMEWORKS_BY_LANGUAGE = {
  python: ['Django', 'Flask', 'FastAPI', 'Pyramid', 'Bottle', 'CherryPy', 'Nenhum'],
  javascript: ['React', 'Vue', 'Angular', 'Node.js', 'Express', 'Next.js', 'Nuxt.js', 'Svelte', 'Nenhum'],
  typescript: ['React', 'Vue', 'Angular', 'Node.js', 'Express', 'Next.js', 'Nuxt.js', 'NestJS', 'Nenhum'],
  java: ['Spring', 'Spring Boot', 'Jakarta EE', 'Micronaut', 'Quarkus', 'Vert.x', 'Play', 'Nenhum'],
  go: ['Gin', 'Echo', 'Fiber', 'Beego', 'Revel', 'Nenhum'],
  rust: ['Actix', 'Rocket', 'Warp', 'Tide', 'Nenhum'],
  php: ['Laravel', 'Symfony', 'CodeIgniter', 'CakePHP', 'Yii', 'Nenhum'],
  csharp: ['.NET', 'ASP.NET', 'Blazor', 'Xamarin', 'Unity', 'Nenhum'],
  ruby: ['Ruby on Rails', 'Sinatra', 'Hanami', 'Nenhum'],
  swift: ['Vapor', 'Perfect', 'Kitura', 'Nenhum'],
  kotlin: ['Spring', 'Ktor', 'Micronaut', 'Vert.x', 'Nenhum']
}

// Quick Templates
const QUICK_TEMPLATES = [
  { id: 'crud', name: '📊 CRUD API', prompt: 'Crie uma API REST completa com operações CRUD' },
  { id: 'auth', name: '🔐 Sistema de Autenticação', prompt: 'Implemente um sistema de autenticação JWT' },
  { id: 'database', name: '🗄️ Modelo de Banco', prompt: 'Crie modelos de banco de dados com relacionamentos' },
  { id: 'component', name: '⚛️ Componente React', prompt: 'Desenvolva um componente React reutilizável' },
  { id: 'form', name: '📝 Formulário com Validação', prompt: 'Crie um formulário com validação completa' },
  { id: 'api', name: '🌐 API REST', prompt: 'Desenvolva uma API REST com endpoints documentados' }
]

// Opções de resposta modular
const RESPONSE_OPTIONS = [
  { id: 'code', name: '📋 Apenas o código', description: 'Somente o código sem explicações' },
  { id: 'explanation', name: '💡 Explicação do código', description: 'Explicação do que foi implementado' },
  { id: 'usage', name: '🚀 Instruções de uso', description: 'Como usar o código gerado' },
  { id: 'improvements', name: '🔧 Possíveis melhorias', description: 'Sugestões de melhorias e extensões' },
  { id: 'critical', name: '⚠️ Pontos críticos', description: 'Atenções e cuidados importantes' },
  { id: 'examples', name: '📝 Exemplos adicionais', description: 'Exemplos complementares de uso' }
]

// Função para extrair blocos de código da resposta
const extractCodeBlocks = (text) => {
  if (!text) return [];
  
  const blocks = [];
  const codeBlockRegex = /```(\w+)?\s*([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Texto antes do bloco de código (explicação)
    const textBefore = text.slice(lastIndex, match.index).trim();
    if (textBefore) {
      blocks.push({ type: 'text', content: textBefore });
    }

    // Bloco de código
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

  // Texto restante após o último bloco de código
  const remainingText = text.slice(lastIndex).trim();
  if (remainingText) {
    blocks.push({ type: 'text', content: remainingText });
  }

  // Se não encontrou blocos de código, trata tudo como texto
  if (blocks.length === 0 && text.trim()) {
    blocks.push({ type: 'text', content: text });
  }

  return blocks;
}

// Função para syntax highlighting básico
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
  
  // Para outras linguagens, retorna o código sem highlight
  return code;
}

function App() {
  const [instruction, setInstruction] = useState('')
  const [language, setLanguage] = useState('python')
  const [framework, setFramework] = useState('')
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [responseBlocks, setResponseBlocks] = useState([])
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('develop')
  const [apiStatus, setApiStatus] = useState('checking')
  const [darkMode, setDarkMode] = useState(true)
  const [typingAnimation, setTypingAnimation] = useState(true)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [abortController, setAbortController] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [conversation, setConversation] = useState([])
  const [responseOptions, setResponseOptions] = useState({
    code: true,
    explanation: true,
    usage: true,
    improvements: true,
    critical: false,
    examples: false
  })

  const responseEndRef = useRef(null)
  const inputAreaRef = useRef(null)
  const stickyInputRef = useRef(null)

  // Frameworks disponíveis para a linguagem atual
  const availableFrameworks = FRAMEWORKS_BY_LANGUAGE[language] || []

  useEffect(() => {
    checkApiStatus()
  }, [])

  useEffect(() => {
    // Scroll para baixo quando nova resposta chegar
    if (responseEndRef.current) {
      responseEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [responseBlocks, conversation])

  // Efeito para garantir que o sticky input fique sempre visível
  useEffect(() => {
    const updateStickyPosition = () => {
      if (stickyInputRef.current) {
        const rect = stickyInputRef.current.getBoundingClientRect()
        if (rect.top < 60) { // Se estiver saindo da tela por cima
          stickyInputRef.current.style.position = 'fixed'
          stickyInputRef.current.style.top = '60px'
          stickyInputRef.current.style.left = `${rect.left}px`
          stickyInputRef.current.style.right = `${window.innerWidth - rect.right}px`
        } else {
          stickyInputRef.current.style.position = 'sticky'
          stickyInputRef.current.style.top = '0'
          stickyInputRef.current.style.left = 'auto'
          stickyInputRef.current.style.right = 'auto'
        }
      }
    }

    window.addEventListener('scroll', updateStickyPosition)
    return () => window.removeEventListener('scroll', updateStickyPosition)
  }, [])

  const checkApiStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/`)
      if (response.ok) {
        setApiStatus('online')
      } else {
        setApiStatus('error')
      }
    } catch (error) {
      setApiStatus('error')
    }
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible)
  }

  const toggleResponseOption = (optionId) => {
    setResponseOptions(prev => ({
      ...prev,
      [optionId]: !prev[optionId]
    }))
  }

  const applyTemplate = (template) => {
    setInstruction(template.prompt)
    if (inputAreaRef.current) {
      inputAreaRef.current.focus()
    }
  }

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort()
      setIsGenerating(false)
      setLoading(false)
      const errorMessage = {
        type: 'error',
        content: '⏹️ Geração interrompida pelo usuário.',
        timestamp: new Date()
      }
      setConversation(prev => [...prev, errorMessage])
    }
  }

  // Função para construir o prompt baseado nas opções selecionadas - CORRIGIDA
  const buildPrompt = (userInput, language, framework) => {
    const selectedOptions = Object.entries(responseOptions)
      .filter(([_, selected]) => selected)
      .map(([key]) => key)

    if (selectedOptions.length === 0) {
      return `Você é um expert em ${language}${framework ? ` e ${framework}` : ''}.

Gere APENAS o código baseado na seguinte instrução, sem nenhuma explicação adicional:

INSTRUÇÃO: ${userInput}

Forneça somente o código necessário, limpo e bem estruturado.`
    }

    let prompt = `Você é um expert em ${language}${framework ? ` e ${framework}` : ''}.

Gere código baseado na seguinte instrução:

INSTRUÇÃO: ${userInput}

`;

    // CORREÇÃO: Usar condições específicas para cada opção
    if (responseOptions.code) {
      prompt += '1. Código completo, funcional e bem estruturado\n'
    }
    if (responseOptions.explanation) {
      prompt += '2. Explicação detalhada do que foi implementado\n'
    }
    if (responseOptions.usage) {
      prompt += '3. Instruções claras de como usar o código\n'
    }
    if (responseOptions.improvements) {
      prompt += '4. Possíveis melhorias e extensões\n'
    }
    if (responseOptions.critical) {
      prompt += '5. Pontos críticos e cuidados importantes\n'
    }
    if (responseOptions.examples) {
      prompt += '6. Exemplos adicionais de uso\n'
    }

    // CORREÇÃO: Adicionar instrução específica para "apenas código"
    if (selectedOptions.length === 1 && responseOptions.code) {
      prompt += '\nForneça APENAS o código, sem nenhuma explicação adicional.'
    } else {
      prompt += '\nSeja preciso e profissional na resposta.'
    }

    return prompt
  }

  const developCode = async () => {
    if (!instruction.trim()) {
      alert('Por favor, digite uma instrução!')
      return
    }

    setLoading(true)
    setIsGenerating(true)
    
    const userMessage = {
      type: 'user',
      content: instruction.trim(),
      language,
      framework: framework === 'Nenhum' ? null : framework,
      timestamp: new Date()
    }
    
    setConversation(prev => [...prev, userMessage])
    setInstruction('')
    
    const controller = new AbortController()
    setAbortController(controller)

    try {
      console.log('🔄 Enviando requisição para:', `${API_URL}/api/develop`)
      
      // CORREÇÃO: Usar a função buildPrompt corrigida
      const prompt = buildPrompt(userMessage.content, userMessage.language, userMessage.framework)
      console.log('📝 Prompt enviado:', prompt)
      
      const response = await fetch(`${API_URL}/api/develop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instruction: prompt,
          language: userMessage.language,
          framework: userMessage.framework
        }),
        signal: controller.signal
      })

      console.log('📡 Status da resposta:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Resposta recebida:', data)
      
      if (data.success) {
        const assistantMessage = {
          type: 'assistant',
          content: data.result,
          blocks: extractCodeBlocks(data.result),
          timestamp: new Date()
        }
        
        setConversation(prev => [...prev, assistantMessage])
        
        if (typingAnimation) {
          await simulateTypingAnimation(assistantMessage)
        } else {
          setResponseBlocks(assistantMessage.blocks)
        }
      } else {
        throw new Error(data.error || 'Erro desconhecido do servidor')
      }
      
    } catch (error) {
      console.error('❌ Erro completo:', error)
      
      const errorMessage = {
        type: 'error',
        content: error.name === 'AbortError' 
          ? '⏹️ Geração interrompida pelo usuário.'
          : `❌ Erro: ${error.message}`,
        timestamp: new Date()
      }
      
      setConversation(prev => [...prev, errorMessage])
    }
    setLoading(false)
    setIsGenerating(false)
  }

  const askQuestion = async () => {
    if (!question.trim()) {
      alert('Por favor, digite uma pergunta!')
      return
    }

    setLoading(true)
    setIsGenerating(true)
    
    const userMessage = {
      type: 'user',
      content: question.trim(),
      timestamp: new Date()
    }
    
    setConversation(prev => [...prev, userMessage])
    setQuestion('')
    
    const controller = new AbortController()
    setAbortController(controller)

    try {
      console.log('🔄 Enviando requisição para:', `${API_URL}/api/ask`)
      
      const response = await fetch(`${API_URL}/api/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage.content,
          language: language !== 'any' ? language : null
        }),
        signal: controller.signal
      })

      console.log('📡 Status da resposta:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`)
      }

      const data = await response.json()
      console.log('✅ Resposta recebida:', data)
      
      if (data.success) {
        const assistantMessage = {
          type: 'assistant',
          content: data.answer,
          blocks: extractCodeBlocks(data.answer),
          timestamp: new Date()
        }
        
        setConversation(prev => [...prev, assistantMessage])
        
        if (typingAnimation) {
          await simulateTypingAnimation(assistantMessage)
        } else {
          setResponseBlocks(assistantMessage.blocks)
        }
      } else {
        throw new Error(data.error || 'Erro desconhecido do servidor')
      }
      
    } catch (error) {
      console.error('❌ Erro completo:', error)
      
      const errorMessage = {
        type: 'error',
        content: error.name === 'AbortError' 
          ? '⏹️ Geração interrompida pelo usuário.'
          : `❌ Erro: ${error.message}`,
        timestamp: new Date()
      }
      
      setConversation(prev => [...prev, errorMessage])
    }
    setLoading(false)
    setIsGenerating(false)
  }

  const simulateTypingAnimation = async (message) => {
    let currentText = ''
    const fullText = message.content
    
    for (let i = 0; i < fullText.length; i++) {
      if (!isGenerating) break
      
      currentText += fullText.charAt(i)
      
      if (i % 50 === 0 || i === fullText.length - 1) {
        const updatedMessage = {
          ...message,
          content: currentText,
          blocks: extractCodeBlocks(currentText)
        }
        
        setConversation(prev => {
          const newConversation = [...prev]
          newConversation[newConversation.length - 1] = updatedMessage
          return newConversation
        })
      }
      
      await new Promise(resolve => setTimeout(resolve, 1))
    }
  }

  const copyCodeToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      alert('✅ Código copiado para a área de transferência!')
    } catch (error) {
      alert('❌ Erro ao copiar o código')
    }
  }

  const clearConversation = () => {
    if (window.confirm('Tem certeza que deseja limpar toda a conversa?')) {
      setConversation([])
      setResponse('')
      setResponseBlocks([])
      setInstruction('')
      setQuestion('')
      stopGeneration()
    }
  }

  const getStatusColor = () => {
    switch (apiStatus) {
      case 'online': return '#28a745'
      case 'error': return '#dc3545'
      default: return '#ffc107'
    }
  }

  const getStatusText = () => {
    switch (apiStatus) {
      case 'online': return '✅ Backend Online'
      case 'error': return '❌ Backend Offline'
      default: return '🟡 Verificando...'
    }
  }

  // Componente para renderizar blocos de código com syntax highlighting
  const CodeBlock = ({ block }) => {
    const [isCopied, setIsCopied] = useState(false)

    const handleCopy = async () => {
      await copyCodeToClipboard(block.content)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }

    const highlightedCode = highlightSyntax(block.content, block.language)

    return (
      <div className="code-block">
        <div className="code-header">
          <span className="code-language">
            {block.language === 'text' ? '📄 Texto' : 
             block.language === 'python' ? '🐍 Python' :
             block.language === 'javascript' ? '⚡ JavaScript' :
             block.language === 'typescript' ? '🔷 TypeScript' :
             block.language === 'java' ? '☕ Java' :
             block.language === 'go' ? '🐹 Go' :
             block.language === 'rust' ? '🦀 Rust' :
             block.language === 'php' ? '🐘 PHP' :
             block.language === 'csharp' ? '💚 C#' :
             block.language === 'ruby' ? '♦️ Ruby' :
             block.language === 'swift' ? '🕊 Swift' :
             block.language === 'kotlin' ? '🔶 Kotlin' :
             `📝 ${block.language}`}
          </span>
          <button 
            className={`copy-btn ${isCopied ? 'copied' : ''}`}
            onClick={handleCopy}
          >
            {isCopied ? '✅ Copiado!' : '📋 Copiar'}
          </button>
        </div>
        <pre className="code-content">
          <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        </pre>
      </div>
    )
  }

  // Componente para renderizar mensagens da conversa
  const Message = ({ message }) => {
    if (message.type === 'user') {
      return (
        <div className="message user-message">
          <div className="message-header">
            <span className="message-avatar">👤</span>
            <span className="message-info">Você • {message.language || 'Pergunta'}</span>
          </div>
          <div className="message-content">
            {message.content}
          </div>
        </div>
      )
    }

    if (message.type === 'assistant') {
      return (
        <div className="message assistant-message">
          <div className="message-header">
            <span className="message-avatar">🤖</span>
            <span className="message-info">SAAS Developer AI</span>
          </div>
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
      )
    }

    if (message.type === 'error') {
      return (
        <div className="message error-message">
          <div className="message-header">
            <span className="message-avatar">❌</span>
            <span className="message-info">Erro</span>
          </div>
          <div className="message-content">
            {message.content}
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className={`app ${darkMode ? 'dark-theme' : 'light-theme'}`}>
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <button 
            className="sidebar-toggle"
            onClick={toggleSidebar}
            title={sidebarVisible ? 'Ocultar menu' : 'Mostrar menu'}
          >
            {sidebarVisible ? '◀️' : '▶️'}
          </button>
          <h1>🚀 SAAS Developer AI</h1>
          <span className="subtitle">Code • Generate • Deploy</span>
        </div>
        <div className="header-right">
          <div className="status-badge" style={{ backgroundColor: getStatusColor() }}>
            {getStatusText()}
          </div>
          <button className="theme-toggle-btn" onClick={toggleDarkMode}>
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <div className="main-container">
        {/* Sidebar */}
        {sidebarVisible && (
          <div className="sidebar">
            <div className="sidebar-section">
              <h3>🎯 Linguagens</h3>
              <div className="languages-list">
                {AVAILABLE_LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    className={`lang-btn ${language === lang.id ? 'active' : ''}`}
                    onClick={() => {
                      setLanguage(lang.id)
                      setFramework('')
                    }}
                  >
                    <span className="lang-icon">{lang.icon}</span>
                    <span className="lang-name">{lang.name}</span>
                    {lang.popular && <span className="popular-dot"></span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="sidebar-section">
              <h3>⚡ Templates</h3>
              <div className="templates-list">
                {QUICK_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    className="template-btn"
                    onClick={() => applyTemplate(template)}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className={`main-content ${!sidebarVisible ? 'expanded' : ''}`}>
          {/* Conversation Area */}
          <div className="conversation-area">
            <div className="conversation-header">
              <h3>💬 Conversa</h3>
              <div className="conversation-controls">
                <span className="conversation-count">{conversation.length} mensagens</span>
                {conversation.length > 0 && (
                  <button className="clear-btn" onClick={clearConversation}>
                    🗑️ Limpar
                  </button>
                )}
              </div>
            </div>
            
            <div className="conversation-messages">
              {conversation.length === 0 ? (
                <div className="empty-conversation">
                  <div className="empty-icon">💭</div>
                  <h4>Nenhuma conversa ainda</h4>
                  <p>Faça uma pergunta ou solicite um código para começar!</p>
                </div>
              ) : (
                conversation.map((message, index) => (
                  <Message key={index} message={message} />
                ))
              )}
              <div ref={responseEndRef} />
            </div>
          </div>

          {/* STICKY INPUT AREA - SEMPRE VISÍVEL E NA ORDEM CORRETA */}
          <div className="sticky-input-area" ref={stickyInputRef}>
            <div className="input-container">
              {/* 1. MODE SELECTOR - SEMPRE VISÍVEL */}
              <div className="mode-selector">
                <button 
                  className={`mode-btn ${mode === 'develop' ? 'active' : ''}`}
                  onClick={() => setMode('develop')}
                >
                  💻 Desenvolver
                </button>
                <button 
                  className={`mode-btn ${mode === 'ask' ? 'active' : ''}`}
                  onClick={() => setMode('ask')}
                >
                  ❓ Consultor
                </button>
              </div>

              {/* 2. FRAMEWORK SELECTOR - SEMPRE VISÍVEL (apenas no modo develop) */}
              {mode === 'develop' && (
                <div className="framework-selector">
                  <select 
                    value={framework} 
                    onChange={(e) => setFramework(e.target.value)}
                    className="framework-select"
                  >
                    <option value="">Framework (opcional)</option>
                    {availableFrameworks.map((fw) => (
                      <option key={fw} value={fw}>{fw}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 3. INPUT AREA - SEMPRE VISÍVEL */}
              <div className="input-area">
                <textarea
                  ref={inputAreaRef}
                  value={mode === 'develop' ? instruction : question}
                  onChange={(e) => mode === 'develop' ? setInstruction(e.target.value) : setQuestion(e.target.value)}
                  placeholder={
                    mode === 'develop' 
                      ? `Descreva o código que você precisa em ${LANGUAGE_THEMES[language]?.name}...`
                      : "Faça sua pergunta sobre programação..."
                  }
                  rows="3"
                  disabled={loading}
                />
                
                <div className="input-actions">
                  <div className="action-controls">
                    <label className="control-item">
                      <input
                        type="checkbox"
                        checked={typingAnimation}
                        onChange={(e) => setTypingAnimation(e.target.checked)}
                      />
                      <span>Animação</span>
                    </label>
                  </div>
                  
                  <div className="action-buttons">
                    {isGenerating ? (
                      <button 
                        className="stop-btn"
                        onClick={stopGeneration}
                      >
                        ⏹️ Parar
                      </button>
                    ) : (
                      <button 
                        className="generate-btn"
                        onClick={mode === 'develop' ? developCode : askQuestion}
                        disabled={loading || (mode === 'develop' ? !instruction.trim() : !question.trim())}
                      >
                        {mode === 'develop' ? '🚀 Gerar Código' : '🤔 Perguntar'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. RESPONSE OPTIONS - ABAIXO DO INPUT */}
              <div className="response-options">
                <div className="options-header">
                  <span>📋 Opções de Resposta:</span>
                </div>
                <div className="options-grid">
                  {RESPONSE_OPTIONS.map(option => (
                    <label key={option.id} className="option-item" title={option.description}>
                      <input
                        type="checkbox"
                        checked={responseOptions[option.id]}
                        onChange={() => toggleResponseOption(option.id)}
                      />
                      <span>{option.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App