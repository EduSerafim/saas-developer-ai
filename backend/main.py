from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from typing import Optional

# ==================== CONFIGURAÇÃO ====================
app = FastAPI(
    title="SAAS Developer AI",
    description="API para geração de código em qualquer linguagem",
    version="1.0.0"
)

# Configura CORS para permitir requests de qualquer frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, troque pelo domínio do seu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== CLIENTE DEEPSEEK ====================
class DeepSeekAPI:
    def __init__(self):
        # A API Key virá da variável de ambiente no Railway
        self.api_key = os.getenv("DEEPSEEK_API_KEY")
        self.base_url = "https://api.deepseek.com/v1/chat/completions"
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
    
    def generate_response(self, messages, temperature=0.7, max_tokens=4000):
        """Faz chamada para API da DeepSeek"""
        if not self.api_key:
            return "❌ ERRO: API Key da DeepSeek não configurada. Configure a variável de ambiente DEEPSEEK_API_KEY no Railway."
        
        payload = {
            "model": "deepseek-coder",
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        try:
            response = requests.post(self.base_url, headers=self.headers, json=payload, timeout=30)
            response.raise_for_status()
            return response.json()['choices'][0]['message']['content']
        except requests.exceptions.RequestException as e:
            return f"❌ Erro na comunicação com DeepSeek API: {str(e)}"
        except Exception as e:
            return f"❌ Erro inesperado: {str(e)}"

# ==================== MODELOS DE DADOS ====================
class DevelopRequest(BaseModel):
    instruction: str
    language: str = "python"
    framework: Optional[str] = None

class AskRequest(BaseModel):
    question: str
    language: Optional[str] = None

# ==================== INICIALIZAÇÃO ====================
deepseek = DeepSeekAPI()

# ==================== ENDPOINTS DA API ====================
@app.get("/")
async def root():
    """Endpoint raiz - Status da API"""
    return {
        "message": "🚀 SAAS Developer AI API",
        "status": "online",
        "version": "1.0.0",
        "endpoints": {
            "develop": "/api/develop - POST - Gerar código",
            "ask": "/api/ask - POST - Perguntas técnicas"
        }
    }

@app.get("/health")
async def health_check():
    """Health check para monitoramento"""
    return {"status": "healthy", "service": "SAAS Developer AI"}

@app.post("/api/develop")
async def develop_code(request: DevelopRequest):
    """
    Gera código baseado na instrução do usuário
    
    Exemplo de request:
    {
        "instruction": "Crie uma função que calcula Fibonacci",
        "language": "python",
        "framework": "fastapi"
    }
    """
    if not request.instruction.strip():
        raise HTTPException(status_code=400, detail="Instruction é obrigatória")
    
    prompt = f"""
    Gere código em {request.language} {f'usando o framework {request.framework} ' if request.framework else ''}baseado na instrução:
    
    INSTRUÇÃO: {request.instruction}
    
    Forneça:
    1. Código completo, funcional e bem estruturado
    2. Explicação do que foi implementado
    3. Instruções de como usar/executar
    4. Possíveis melhorias ou extensões
    
    Seja preciso, profissional e forneça código de produção.
    """
    
    messages = [
        {
            "role": "system", 
            "content": f"Você é um expert em {request.language} {f'e {request.framework} ' if request.framework else ''}com anos de experiência. Gere código limpo e eficiente."
        },
        {"role": "user", "content": prompt}
    ]
    
    result = deepseek.generate_response(messages)
    return {"success": True, "result": result}

@app.post("/api/ask")
async def ask_question(request: AskRequest):
    """
    Responde perguntas técnicas sobre programação
    
    Exemplo de request:
    {
        "question": "Qual a diferença entre async/await e Promises?",
        "language": "javascript"
    }
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question é obrigatória")
    
    prompt = f"""
    Responda esta pergunta técnica {'sobre ' + request.language if request.language else 'sobre programação'}:
    
    PERGUNTA: {request.question}
    
    Forneça uma resposta completa incluindo:
    1. Explicação clara e detalhada
    2. Exemplos práticos de código quando aplicável
    3. Casos de uso reais
    4. Melhores práticas
    5. Armadilhas comuns a evitar
    
    Seja didático e profissional.
    """
    
    messages = [
        {
            "role": "system", 
            "content": "Você é um consultor técnico sênior com vasta experiência em arquitetura de software e melhores práticas de desenvolvimento."
        },
        {"role": "user", "content": prompt}
    ]
    
    result = deepseek.generate_response(messages)
    return {"success": True, "answer": result}

# ==================== CONFIGURAÇÃO SERVIDOR ====================
if __name__ == "__main__":
    import uvicorn
    # Usa porta da variável de ambiente (Railway) ou 8000 local
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)