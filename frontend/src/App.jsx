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
  const [showTemplates, setShowTemplates] = useState(false)
  const [abortController, setAbortController] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [conversation, setConversation] = useState([])

  const responseEndRef = useRef(null)
  const inputAreaRef = useRef(null)

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

  const applyTemplate = (template) => {
    setInstruction(template.prompt)
    setShowTemplates(false)
    if (inputAreaRef.current) {
      inputAreaRef.current.focus()
    }
  }

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort()
      setIsGenerating(false)
      setLoading(false)
      setResponse(prev => prev + '\n\n⏹️ Geração interrompida pelo usuário.')
    }
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
    setInstruction('') // Limpa o input após enviar
    
    const controller = new AbortController()
    setAbortController(controller)

    try {
      console.log('🔄 Enviando requisição para:', `${API_URL}/api/develop`)
      
      const response = await fetch(`${API_URL}/api/develop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instruction: userMessage.content,
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
    setQuestion('') // Limpa o input após enviar
    
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
      
      // Atualiza os blocos em tempo real a cada 50 caracteres
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
      
      await new Promise(resolve => setTimeout(resolve, 1)) // Muito rápido
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
      {/* Header estilo CodePen */}
      <header className="code-pen-header">
        <div className="header-left">
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

      <div className="main-container split-layout">
        {/* Painel Esquerdo - Input e Controles */}
        <div className="left-panel">
          <div className="panel-content">
            {/* Mode Selector */}
            <div className="mode-tabs">
              <button 
                className={`tab-btn ${mode === 'develop' ? 'active' : ''}`}
                onClick={() => setMode('develop')}
              >
                💻 Desenvolver
              </button>
              <button 
                className={`tab-btn ${mode === 'ask' ? 'active' : ''}`}
                onClick={() => setMode('ask')}
              >
                ❓ Consultor
              </button>
            </div>

            {/* Input Area */}
            <div className="input-area" ref={inputAreaRef}>
              {mode === 'develop' ? (
                <>
                  <div className="input-header">
                    <h3>Desenvolver Código em {LANGUAGE_THEMES[language]?.name}</h3>
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
                  </div>
                  
                  <textarea
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    placeholder="Descreva o código que você precisa...
Ex: Crie um sistema de autenticação JWT
Ex: Desenvolva uma API REST completa
Ex: Implemente um componente React com TypeScript"
                    rows="4"
                    disabled={loading}
                  />
                  
                  <div className="action-bar">
                    <button 
                      className="generate-btn"
                      onClick={developCode}
                      disabled={loading || !instruction.trim()}
                    >
                      {loading ? '⚡ Gerando...' : '🚀 Gerar Código'}
                    </button>
                    {isGenerating && (
                      <button 
                        className="stop-btn"
                        onClick={stopGeneration}
                      >
                        ⏹️ Parar
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="input-header">
                    <h3>Consultor Técnico</h3>
                  </div>
                  
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Faça sua pergunta sobre programação...
Ex: Qual a diferença entre microserviços e monólito?
Ex: Como implementar clean architecture?
Ex: Melhores práticas para segurança em APIs?"
                    rows="4"
                    disabled={loading}
                  />
                  
                  <div className="action-bar">
                    <button 
                      className="generate-btn"
                      onClick={askQuestion}
                      disabled={loading || !question.trim()}
                    >
                      {loading ? '🔍 Pesquisando...' : '🤔 Perguntar'}
                    </button>
                    {isGenerating && (
                      <button 
                        className="stop-btn"
                        onClick={stopGeneration}
                      >
                        ⏹️ Parar
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Quick Templates */}
            <div className="templates-section">
              <h3>⚡ Templates Rápidos</h3>
              <div className="templates-grid">
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

            {/* Controls */}
            <div className="controls-section">
              <label className="control-item">
                <input
                  type="checkbox"
                  checked={typingAnimation}
                  onChange={(e) => setTypingAnimation(e.target.checked)}
                />
                <span>Animação de Digitação</span>
              </label>
              
              {conversation.length > 0 && (
                <button className="clear-btn" onClick={clearConversation}>
                  🗑️ Limpar Conversa
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Painel Direito - Conversação */}
        <div className="right-panel">
          <div className="conversation-area">
            <div className="conversation-header">
              <h3>💬 Conversa</h3>
              <span className="conversation-count">{conversation.length} mensagens</span>
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
        </div>
      </div>
    </div>
  )
}

export default App