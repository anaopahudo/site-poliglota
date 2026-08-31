/**
 * Mini Polyglot Backend - Node.js API Gateway & Static Server
 * Porta padrão: 3000
 * Comunica-se com o serviço Python na porta 5001.
 * Utiliza 100% recursos nativos do Node.js (Zero dependências externas).
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const url = require('node:url');

const PORT = process.env.PORT || 3000;
const PYTHON_SERVICE_URL = process.env.PYTHON_URL || 'http://127.0.0.1:5001';
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

// Histórico em memória de análises recentes
const analysisHistory = [];
const MAX_HISTORY = 12;

// Tipos MIME para arquivos estáticos do frontend
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

/**
 * Função utilitária para enviar requisição HTTP ao microserviço Python
 */
function callPythonEngine(endpoint, method = 'GET', payload = null) {
  return new Promise((resolve, reject) => {
    const targetUrl = new URL(endpoint, PYTHON_SERVICE_URL);
    const postData = payload ? JSON.stringify(payload) : null;

    const options = {
      hostname: targetUrl.hostname,
      port: targetUrl.port,
      path: targetUrl.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      },
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (err) {
          resolve({ statusCode: res.statusCode, raw: data });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout ao conectar com o serviço Python'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

/**
 * Helper para responder JSON
 */
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

/**
 * Servidor de arquivos estáticos do Frontend
 */
function serveStaticFile(reqPath, res) {
  let filePath = path.join(FRONTEND_DIR, reqPath === '/' ? 'index.html' : reqPath);
  filePath = path.normalize(filePath);

  // Segurança: impedir diretory traversal fora de frontend
  if (!filePath.startsWith(FRONTEND_DIR)) {
    sendJson(res, 403, { error: 'Acesso negado' });
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Se não achar arquivo direto, tenta index.html
      filePath = path.join(FRONTEND_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        sendJson(res, 404, { error: 'Arquivo não encontrado' });
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
}

/**
 * Criação do Servidor HTTP Node.js
 */
const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
  const pathname = reqUrl.pathname;
  const method = req.method;

  // CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // Rota de Health Check Integrado
  if (pathname === '/api/health' && method === 'GET') {
    let pythonStatus = { status: 'offline', error: null };
    try {
      const pyRes = await callPythonEngine('/health', 'GET');
      pythonStatus = pyRes.data;
    } catch (err) {
      pythonStatus = { status: 'offline', error: err.message };
    }

    return sendJson(res, 200, {
      nodeGateway: {
        status: 'online',
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        nodeVersion: process.version
      },
      pythonEngine: pythonStatus,
      timestamp: new Date().toISOString()
    });
  }

  // Rota de Análise de Texto (BFF / Gateway -> Python)
  if (pathname === '/api/analyze' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      const startTime = Date.now();

      try {
        const payload = JSON.parse(body || '{}');
        const text = payload.text || '';

        if (!text.trim()) {
          return sendJson(res, 400, {
            success: false,
            error: 'O campo "text" não pode estar vazio.'
          });
        }

        // Delegar o processamento pesado de PLN ao microserviço Python
        const pyResult = await callPythonEngine('/process', 'POST', { text });
        const latencyMs = Date.now() - startTime;

        if (pyResult.statusCode !== 200 || !pyResult.data.success) {
          return sendJson(res, 502, {
            success: false,
            error: 'Falha no processamento pelo motor Python.',
            details: pyResult.data
          });
        }

        const analysisRecord = {
          id: 'REQ-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
          snippet: text.length > 50 ? text.substring(0, 50) + '...' : text,
          fullLength: text.length,
          metrics: pyResult.data.data,
          meta: {
            pipeline: 'Frontend -> Node.js (Gateway) -> Python (Engine)',
            processingTimeMs: latencyMs,
            timestamp: new Date().toLocaleTimeString('pt-BR')
          }
        };

        // Salva histórico em memória
        analysisHistory.unshift(analysisRecord);
        if (analysisHistory.length > MAX_HISTORY) {
          analysisHistory.pop();
        }

        return sendJson(res, 200, {
          success: true,
          result: analysisRecord
        });

      } catch (err) {
        return sendJson(res, 500, {
          success: false,
          error: 'Erro interno ao processar requisição.',
          message: err.message
        });
      }
    });
    return;
  }

  // Rota para obter histórico recente
  if (pathname === '/api/history' && method === 'GET') {
    return sendJson(res, 200, {
      success: true,
      history: analysisHistory
    });
  }

  // Rota estática do frontend
  serveStaticFile(pathname, res);
});

server.listen(PORT, () => {
  console.log('==================================================');
  console.log(` [*] Node.js Gateway & Server ativo na porta ${PORT}`);
  console.log(` [*] Interface Web: http://localhost:${PORT}`);
  console.log(` [*] Proxy Python: ${PYTHON_SERVICE_URL}`);
  console.log('==================================================');
});
