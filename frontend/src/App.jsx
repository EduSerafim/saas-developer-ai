import React, { useState, useEffect } from 'react'

// URL da API - será configurada via environment variable no Vercel
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

// Linguagens disponíveis com ícones (usaremos emojis por enquanto)
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

// Quick Templates para casos comuns
const QUICK_TEMPLATES = [
  { id: 'crud', name: '📊 CRUD API', prompt: 'Crie uma API REST completa com operações CRUD' },
  { id: 'auth', name: '🔐 Sistema de Autenticação', prompt: 'Implemente um sistema de autenticação JWT' },
  { id: 'database', name: '🗄️ Modelo de Banco', prompt: 'Crie modelos de banco de dados com relacionamentos' },
  { id: 'component', name: '⚛️ Componente React', prompt: 'Desenvolva um componente React reutilizável' },
  { id: 'form', name: '📝 Formulário com Validação', prompt: 'Crie um formulário com validação completa' },
  { id: 'api', name: '🌐 API REST', prompt: 'Desenvolva uma API REST com endpoints documentados' }
]

function App() {
  const [instruction, setInstruction] = useState('')
  const [language, setLanguage] = useState('python')
  const [framework, setFramework] = useState('')
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('develop')
  const [apiStatus, setApiStatus] = useState('checking')
  
  // NOVOS ESTADOS PARA TEMAS E FEATURES
  const [darkMode, setDarkMode] = useState(true)
  const [languageTheme, setLanguageTheme] = useState(LANGUAGE_THEMES.python)
  const [typingAnimation, setTypingAnimation] = useState(true)
  const [showTemplates, setShowTemplates] = useState(false)

  // Verificar status do backend
  useEffect(() => {
    checkApiStatus()
  }, [])

  // Atualizar tema quando linguagem mudar
  useEffect(() => {
    setLanguageTheme(LANGUAGE_THEMES[language] || LANGUAGE_THEMES.python)
  }, [language])

  const checkApiStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/health`)
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
  }

  const developCode = async () => {
    if (!instruction.trim()) {
      alert('Por favor, digite uma instrução!')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/develop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instruction: instruction.trim(),
          language,
          framework: framework.trim() || null
        })
      })

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        if (typingAnimation) {
          // Simular typing animation
          simulateTypingAnimation(data.result)
        } else {
          setResponse(data.result)
        }
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
      
    } catch (error) {
      setResponse(`❌ Erro: ${error.message}\n\n💡 Verifique:\n• Backend está rodando\n• URL da API está correta\n• Sua API Key está configurada`)
    }
    setLoading(false)
  }

  const simulateTypingAnimation = (text) => {
    setResponse('')
    let index = 0
    const timer = setInterval(() => {
      if (index < text.length) {
        setResponse(prev => prev + text.charAt(index))
        index++
        
        // Auto-scroll para baixo
        const responseElement = document.querySelector('.response-section')
        if (responseElement) {
          responseElement.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }
      } else {
        clearInterval(timer)
      }
    }, 10) // Velocidade da animação
  }

  const askQuestion = async () => {
    if (!question.trim()) {
      alert('Por favor, digite uma pergunta!')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/api/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          language: language !== 'any' ? language : null
        })
      })

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        if (typingAnimation) {
          simulateTypingAnimation(data.answer)
        } else {
          setResponse(data.answer)
        }
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
      
    } catch (error) {
      setResponse(`❌ Erro: ${error.message}\n\n💡 Verifique se o backend está rodando.`)
    }
    setLoading(false)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(response)
      alert('✅ Resposta copiada para a área de transferência!')
    } catch (error) {
      alert('❌ Erro ao copiar a resposta')
    }
  }

  const downloadCode = () => {
    const element = document.createElement('a')
    const file = new Blob([response], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `code-${language}-${Date.now()}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const clearConversation = () => {
    if (window.confirm('Tem certeza que deseja limpar a conversa?')) {
      setResponse('')
      setInstruction('')
      setQuestion('')
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

  return (
    <div className={`app ${darkMode ? 'dark-theme' : 'light-theme'}`}>
      <header className="app-header" style={{ 
        background: `linear-gradient(135deg, ${languageTheme.primary} 0%, ${languageTheme.secondary} 100%)` 
      }}>
        <div className="header-content">
          <h1>🚀 SAAS Developer AI</h1>
          <p>Desenvolva em qualquer linguagem • Hospedado na Nuvem</p>
          <div className="header-controls">
            <div className="status-indicator" style={{ backgroundColor: getStatusColor() }}>
              {getStatusText()}
            </div>
            <button className="theme-toggle" onClick={toggleDarkMode}>
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </div>
      </header>

      <div className="mode-selector">
        <button 
          className={`mode-btn ${mode === 'develop' ? 'active' : ''}`}
          onClick={() => setMode('develop')}
        >
          💻 Desenvolver Código
        </button>
        <button 
          className={`mode-btn ${mode === 'ask' ? 'active' : ''}`}
          onClick={() => setMode('ask')}
        >
          ❓ Consultor Técnico
        </button>
      </div>

      {/* Grid de Linguagens */}
      <div className="languages-grid-section">
        <h3>🎯 Selecione a Linguagem</h3>
        <div className="languages-grid">
          {AVAILABLE_LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              className={`language-card ${language === lang.id ? 'selected' : ''} ${lang.popular ? 'popular' : ''}`}
              onClick={() => setLanguage(lang.id)}
              style={{
                borderColor: language === lang.id ? languageTheme.primary : 'transparent',
                background: language === lang.id ? `${languageTheme.primary}20` : 'transparent'
              }}
            >
              <span className="language-icon">{lang.icon}</span>
              <span className="language-name">{lang.name}</span>
              {lang.popular && <span className="popular-badge">🔥</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Templates */}
      <div className="templates-section">
        <button 
          className="templates-toggle"
          onClick={() => setShowTemplates(!showTemplates)}
        >
          {showTemplates ? '▼' : '►'} Quick Templates
        </button>
        
        {showTemplates && (
          <div className="templates-grid">
            {QUICK_TEMPLATES.map((template) => (
              <button
                key={template.id}
                className="template-card"
                onClick={() => applyTemplate(template)}
              >
                {template.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {mode === 'develop' ? (
        <div className="input-section">
          <h3>Desenvolver Código <span className="language-tag" style={{ backgroundColor: languageTheme.primary }}>{LANGUAGE_THEMES[language]?.name}</span></h3>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Ex: Crie um sistema de autenticação JWT com Node.js e React
Ex: Desenvolva uma API REST em Python com FastAPI
Ex: Implemente um componente React com TypeScript e Tailwind"
            rows="6"
            disabled={loading}
          />
          
          <div className="controls">
            <input
              type="text"
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              placeholder={`Framework para ${LANGUAGE_THEMES[language]?.name} (opcional)`}
              disabled={loading}
            />
            
            <button 
              className="action-btn"
              onClick={developCode}
              disabled={loading || !instruction.trim()}
              style={{
                background: `linear-gradient(135deg, ${languageTheme.primary}, ${languageTheme.secondary})`
              }}
            >
              {loading ? '⏳ Gerando Código...' : '🚀 Gerar Código'}
            </button>
          </div>
        </div>
      ) : (
        <div className="input-section">
          <h3>Consultor Técnico</h3>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ex: Qual a diferença entre microserviços e arquitetura monolítica?
Ex: Como implementar clean architecture em TypeScript?
Ex: Melhores práticas para segurança em APIs REST?"
            rows="6"
            disabled={loading}
          />
          
          <div className="controls">
            <button 
              className="action-btn"
              onClick={askQuestion}
              disabled={loading || !question.trim()}
              style={{
                background: `linear-gradient(135deg, ${languageTheme.primary}, ${languageTheme.secondary})`
              }}
            >
              {loading ? '⏳ Pesquisando...' : '🤔 Fazer Pergunta'}
            </button>
          </div>
        </div>
      )}

      {/* Controles de Animação e Ações */}
      <div className="controls-section">
        <div className="animation-controls">
          <label className="animation-toggle">
            <input
              type="checkbox"
              checked={typingAnimation}
              onChange={(e) => setTypingAnimation(e.target.checked)}
            />
            <span>✍️ Animação de Digitação</span>
          </label>
        </div>

        {response && (
          <div className="action-buttons">
            <button className="action-btn secondary" onClick={copyToClipboard}>
              📋 Copiar
            </button>
            <button className="action-btn secondary" onClick={downloadCode}>
              💾 Download
            </button>
            <button className="action-btn secondary" onClick={clearConversation}>
              🗑️ Limpar
            </button>
          </div>
        )}
      </div>

      {response && (
        <div className="response-section">
          <h3>📝 Resposta:</h3>
          <pre className={typingAnimation ? 'typing-animation' : ''}>{response}</pre>
        </div>
      )}
    </div>
  )
}

export default App