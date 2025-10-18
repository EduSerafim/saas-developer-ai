import React, { useState, useEffect } from 'react'

// URL da API - será configurada via environment variable no Vercel
const API_URL = import.meta.env.VITE_API_URL || 'https://saas-developer-api.[seu-usuario].workers.dev';

function App() {
  const [instruction, setInstruction] = useState('')
  const [language, setLanguage] = useState('python')
  const [framework, setFramework] = useState('')
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('develop')
  const [apiStatus, setApiStatus] = useState('checking')

  // Verificar status da API
  useEffect(() => {
    checkApiStatus()
  }, [])

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
        setResponse(data.result)
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
      
    } catch (error) {
      setResponse(`❌ Erro: ${error.message}\n\n💡 Verifique:\n• Backend está rodando\n• URL da API está correta\n• Sua API Key está configurada`)
    }
    setLoading(false)
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
        setResponse(data.answer)
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
    <div className="app">
      <header className="app-header">
        <h1>🚀 SAAS Developer AI</h1>
        <p>Desenvolva em qualquer linguagem • Hospedado na Nuvem</p>
        <div className="status-indicator" style={{ backgroundColor: getStatusColor() }}>
          {getStatusText()}
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

      {mode === 'develop' ? (
        <div className="input-section">
          <h3>Desenvolver Código</h3>
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
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              disabled={loading}
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="java">Java</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
              <option value="php">PHP</option>
              <option value="csharp">C#</option>
            </select>
            
            <input
              type="text"
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              placeholder="Framework (opcional) - Ex: react, django, spring"
              disabled={loading}
            />
            
            <button 
              className="action-btn"
              onClick={developCode}
              disabled={loading || !instruction.trim()}
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
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              disabled={loading}
            >
              <option value="any">Qualquer Linguagem</option>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="java">Java</option>
              <option value="go">Go</option>
            </select>
            
            <button 
              className="action-btn"
              onClick={askQuestion}
              disabled={loading || !question.trim()}
            >
              {loading ? '⏳ Pesquisando...' : '🤔 Fazer Pergunta'}
            </button>
          </div>
        </div>
      )}

      {response && (
        <div className="response-section">
          <h3>📝 Resposta:</h3>
          <pre>{response}</pre>
          <button className="copy-btn" onClick={copyToClipboard}>
            📋 Copiar Resposta
          </button>
        </div>
      )}
    </div>
  )
}

export default App