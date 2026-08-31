# 🚀 Polyglot Analytics Lab (Node.js + Python + Modern Frontend)

Mini projeto de **Engenharia de Software Full Stack** demonstrando uma **Arquitetura Poliglota de Microsserviços**, ultra leve e sem dependências externas pesadas (zero `npm install` ou `pip install` obrigatórios).

---

## 🏛️ Arquitetura do Sistema

```
[ Navegador Web (HTML5 / CSS3 / ES6) ]
               │
      (HTTP POST /api/analyze)
               ▼
[ Node.js API Gateway / BFF ] (Porta 3000)
  ├── Servidor de arquivos estáticos
  ├── Validação de payload e rate handling
  └── Histórico em memória
               │
       (HTTP JSON Proxy)
               ▼
[ Python Data Engine ] (Porta 5001)
  ├── Processamento estatístico de texto
  ├── Classificação de sentimento (heurística NLP)
  ├── Cálculo de diversidade lexical e tempo de leitura
  └── Extração de palavras-chave com filtro de stopwords
```

---

## 📁 Estrutura de Diretórios

```text
mini-polyglot-app/
│
├── frontend/                 # Interface Web Moderna (Glassmorphism & Dark Theme)
│   ├── index.html            # Estrutura semântica e acessível
│   ├── style.css             # Design System com CSS puro e micro-animações
│   └── app.js                # Lógica cliente, pooling de status e renderização
│
├── backend-node/             # API Gateway & Backend em Node.js
│   ├── package.json          # Configuração básica de scripts
│   └── server.js             # Servidor HTTP nativo do Node.js (Porta 3000)
│
├── service-python/           # Microserviço de Processamento de Dados
│   └── engine.py             # Servidor HTTP nativo em Python (Porta 5001)
│
├── start.bat                 # Script de inicialização em 1 clique para Windows
└── README.md                 # Documentação técnica do projeto
```

---

## ⚡ Como Executar

### Opção 1: Via Script 1-Clique (Windows)
Basta dar um duplo clique no arquivo `start.bat` ou executar no terminal:
```powershell
.\start.bat
```

### Opção 2: Manualmente em 2 Terminais

**Terminal 1 (Microserviço Python):**
```powershell
python service-python\engine.py
```
*(Inicia na porta 5001)*

**Terminal 2 (API Gateway Node.js):**
```powershell
node backend-node\server.js
```
*(Inicia na porta 3000)*

Abra o seu navegador em: **`http://localhost:3000`**

---

## 🎯 Conceitos de Engenharia de Software Aplicados

1. **Arquitetura Poliglota (Polyglot Architecture)**: Uso da tecnologia ideal para cada responsabilidade (Node.js para alta concorrência de I/O de rede e distribuição de arquivos estáticos; Python para algoritmos e computação de dados).
2. **Padrão BFF (Backend for Frontend) & Gateway**: O cliente web conversa unicamente com o Node.js, que abstrai os serviços internos, orquestra chamadas e aplica regras de negócio.
3. **Desacoplamento e Baixo Acoplamento**: Os serviços comunicam-se via contratos HTTP/JSON padronizados.
4. **Health Check & Rastreabilidade**: Endpoint unificado `/api/health` para monitoramento distribuído e geração de identificadores de requisição (`REQ-XXXX`).
5. **Zero-Overhead / Clean Code**: Implementado com bibliotecas padrão de ambas as linguagens, eliminando riscos de vulnerabilidades de dependências externas.
