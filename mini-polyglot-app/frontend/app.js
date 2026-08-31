/**
 * Frontend Logic - Polyglot Analytics Lab
 * Comunicação direta com a API do Node.js Gateway
 */

// Elementos DOM
const textInput = document.getElementById('textInput');
const liveCounters = document.getElementById('liveCounters');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');

// Amostras de Teste
const samplePosBtn = document.getElementById('samplePosBtn');
const sampleNegBtn = document.getElementById('sampleNegBtn');
const sampleTechBtn = document.getElementById('sampleTechBtn');

// Status e Health Check
const nodeStatusBadge = document.getElementById('nodeStatusBadge');
const nodeStatusText = document.getElementById('nodeStatusText');
const pythonStatusBadge = document.getElementById('pythonStatusBadge');
const pythonStatusText = document.getElementById('pythonStatusText');

// Seções de Resultado
const emptyState = document.getElementById('emptyState');
const resultsContent = document.getElementById('resultsContent');
const latencyTag = document.getElementById('latencyTag');

// Métricas DOM
const valWords = document.getElementById('valWords');
const valAvgLength = document.getElementById('valAvgLength');
const valChars = document.getElementById('valChars');
const valCharsNoSpace = document.getElementById('valCharsNoSpace');
const valSentences = document.getElementById('valSentences');
const valReadingTime = document.getElementById('valReadingTime');
const valLexical = document.getElementById('valLexical');
const valLexicalBadge = document.getElementById('valLexicalBadge');
const lexicalProgress = document.getElementById('lexicalProgress');

// Sentimento DOM
const sentEmoji = document.getElementById('sentEmoji');
const sentTitle = document.getElementById('sentTitle');
const sentScore = document.getElementById('sentScore');
const sentConfidence = document.getElementById('sentConfidence');
const polarityPointer = document.getElementById('polarityPointer');
const matchedWordsContainer = document.getElementById('matchedWordsContainer');

// Palavras-chave e Pipeline
const keywordsCloud = document.getElementById('keywordsCloud');
const reqIdBadge = document.getElementById('reqIdBadge');
const valTotalLatency = document.getElementById('valTotalLatency');

// Histórico DOM
const historyCount = document.getElementById('historyCount');
const historyList = document.getElementById('historyList');
const toastContainer = document.getElementById('toastContainer');

// Textos de Amostra Pré-definidos
const SAMPLE_TEXTS = {
  positive: "O novo sistema com Node.js e Python ficou incrível! A performance é excelente, muito rápida e a arquitetura de microsserviços facilitou bastante o desenvolvimento. Recomendo com entusiasmo!",
  negative: "O software apresentou um problema terrível e erro crítico de conexão. Foi péssimo e muito difícil depurar esse bug horrível.",
  tech: "A arquitetura poliglota em engenharia de software desacopla componentes especializados. O Node.js atua com alta performance em I/O assíncrono para o Gateway, enquanto o motor Python processa tarefas computacionais, métricas estatísticas e análise de linguagem natural com elegância e eficiência."
};

/**
 * Atualiza o contador de palavras e caracteres em tempo real
 */
function updateLiveCounters() {
  const text = textInput.value;
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  liveCounters.textContent = `${chars} caracteres | ${words} palavras`;
}

/**
 * Exibe Toast de Notificação
 */
function showToast(message, type = 'error') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'error' ? '❌' : '✅'}</span>
    <span>${message}</span>
  `;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Consulta a saúde dos serviços (Health Check)
 */
async function checkSystemHealth() {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Falha no Gateway Node.js');
    const data = await res.json();

    // Atualiza Node.js Badge
    if (data.nodeGateway && data.nodeGateway.status === 'online') {
      nodeStatusBadge.className = 'status-badge online';
      nodeStatusText.textContent = `Online (${data.nodeGateway.memoryUsageMb}MB)`;
    } else {
      nodeStatusBadge.className = 'status-badge offline';
      nodeStatusText.textContent = 'Offline';
    }

    // Atualiza Python Badge
    if (data.pythonEngine && data.pythonEngine.status === 'online') {
      pythonStatusBadge.className = 'status-badge online';
      pythonStatusText.textContent = 'Online';
    } else {
      pythonStatusBadge.className = 'status-badge offline';
      pythonStatusText.textContent = 'Offline / Erro';
    }
  } catch (err) {
    nodeStatusBadge.className = 'status-badge offline';
    nodeStatusText.textContent = 'Indisponível';
    pythonStatusBadge.className = 'status-badge offline';
    pythonStatusText.textContent = 'Indisponível';
  }
}

/**
 * Renderiza os Resultados da Análise na Interface
 */
function renderResults(resultRecord) {
  const m = resultRecord.metrics;
  const meta = resultRecord.meta;

  emptyState.classList.add('hidden');
  resultsContent.classList.remove('hidden');

  // Métricas Básicas
  valWords.textContent = m.word_count;
  valAvgLength.textContent = `${m.avg_word_length} caracteres médios`;
  valChars.textContent = m.char_count;
  valCharsNoSpace.textContent = `${m.char_no_spaces} sem espaços`;
  valSentences.textContent = m.sentence_count;
  valReadingTime.textContent = `${m.reading_time_seconds}s`;

  // Diversidade Lexical
  valLexical.textContent = `${m.lexical_diversity}%`;
  lexicalProgress.style.width = `${Math.min(100, m.lexical_diversity)}%`;
  if (m.lexical_diversity > 70) {
    valLexicalBadge.textContent = 'Alta Variedade';
    valLexicalBadge.style.color = '#4ADE80';
  } else if (m.lexical_diversity > 45) {
    valLexicalBadge.textContent = 'Média / Boa';
    valLexicalBadge.style.color = '#A5B4FC';
  } else {
    valLexicalBadge.textContent = 'Repetitivo';
    valLexicalBadge.style.color = '#F87171';
  }

  // Sentimento
  const s = m.sentiment;
  sentScore.textContent = `Score: ${s.score.toFixed(2)}`;
  sentConfidence.textContent = `Confiança: ${Math.round(s.confidence * 100)}%`;

  if (s.label === 'Positivo') {
    sentEmoji.textContent = '🎉';
    sentTitle.textContent = 'Positivo';
    sentTitle.style.color = '#4ADE80';
  } else if (s.label === 'Negativo') {
    sentEmoji.textContent = '⚠️';
    sentTitle.textContent = 'Negativo';
    sentTitle.style.color = '#FB7185';
  } else {
    sentEmoji.textContent = '⚖️';
    sentTitle.textContent = 'Neutro';
    sentTitle.style.color = '#F8FAFC';
  }

  // Posicionar o ponteiro na régua de polaridade (-1.0 = 0%, 0.0 = 50%, +1.0 = 100%)
  const pointerPercent = ((s.score + 1.0) / 2.0) * 100;
  polarityPointer.style.left = `${Math.max(5, Math.min(95, pointerPercent))}%`;

  // Palavras que engilharam sentimento
  matchedWordsContainer.innerHTML = '';
  if (s.positive_matches.length > 0) {
    s.positive_matches.forEach(w => {
      const tag = document.createElement('span');
      tag.className = 'sent-match-tag pos';
      tag.textContent = `+ ${w}`;
      matchedWordsContainer.appendChild(tag);
    });
  }
  if (s.negative_matches.length > 0) {
    s.negative_matches.forEach(w => {
      const tag = document.createElement('span');
      tag.className = 'sent-match-tag neg';
      tag.textContent = `- ${w}`;
      matchedWordsContainer.appendChild(tag);
    });
  }
  if (s.positive_matches.length === 0 && s.negative_matches.length === 0) {
    matchedWordsContainer.innerHTML = '<span style="font-size:0.75rem; color:var(--text-muted);">Sem termos polarizados evidentes</span>';
  }

  // Palavras-chave
  keywordsCloud.innerHTML = '';
  if (m.top_words && m.top_words.length > 0) {
    m.top_words.forEach(item => {
      const pill = document.createElement('div');
      pill.className = 'keyword-pill';
      pill.innerHTML = `<span>${item.word}</span> <span class="keyword-count">${item.count}x</span>`;
      keywordsCloud.appendChild(pill);
    });
  } else {
    keywordsCloud.innerHTML = '<span style="font-size:0.75rem; color:var(--text-muted);">Pouco texto para extração de keywords.</span>';
  }

  // Metadados
  reqIdBadge.textContent = resultRecord.id;
  valTotalLatency.textContent = `${meta.processingTimeMs}ms`;
  latencyTag.textContent = `Processado em ${meta.processingTimeMs}ms`;
}

/**
 * Envia o texto para a API do Node.js
 */
async function handleAnalyze() {
  const text = textInput.value.trim();
  if (!text) {
    showToast('Por favor, digite algum texto antes de analisar.');
    textInput.focus();
    return;
  }

  analyzeBtn.disabled = true;
  analyzeBtn.querySelector('.btn-text').textContent = 'Processando...';

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Erro no processamento');
    }

    renderResults(data.result);
    loadHistory();
    showToast('Processamento concluído com sucesso!', 'success');
  } catch (err) {
    showToast(`Erro na análise: ${err.message}`);
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.querySelector('.btn-text').textContent = 'Processar Pipeline';
  }
}

/**
 * Carrega e renderiza o histórico recente
 */
async function loadHistory() {
  try {
    const res = await fetch('/api/history');
    if (!res.ok) return;
    const data = await res.json();

    if (!data.history || data.history.length === 0) {
      historyList.innerHTML = '<div class="history-empty">Nenhuma análise no histórico recente.</div>';
      historyCount.textContent = '0 requisições armazenadas';
      return;
    }

    historyCount.textContent = `${data.history.length} requisições no BFF`;
    historyList.innerHTML = '';

    data.history.forEach(item => {
      const card = document.createElement('div');
      card.className = 'history-item';
      card.innerHTML = `
        <div class="history-item-top">
          <span>${item.id}</span>
          <span>${item.meta.timestamp}</span>
        </div>
        <div class="history-snippet">"${item.snippet}"</div>
        <div class="history-badges">
          <span class="history-badge">${item.metrics.word_count} palavras</span>
          <span class="history-badge">${item.metrics.sentiment.label}</span>
          <span class="history-badge" style="color: var(--accent-cyan)">${item.meta.processingTimeMs}ms</span>
        </div>
      `;
      card.addEventListener('click', () => {
        textInput.value = item.snippet.endsWith('...') ? item.snippet.replace('...', '') : item.snippet;
        updateLiveCounters();
        renderResults(item);
      });
      historyList.appendChild(card);
    });
  } catch (err) {
    console.error('Erro ao buscar histórico:', err);
  }
}

// Event Listeners
textInput.addEventListener('input', updateLiveCounters);

textInput.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    handleAnalyze();
  }
});

clearBtn.addEventListener('click', () => {
  textInput.value = '';
  updateLiveCounters();
  textInput.focus();
});

samplePosBtn.addEventListener('click', () => {
  textInput.value = SAMPLE_TEXTS.positive;
  updateLiveCounters();
  handleAnalyze();
});

sampleNegBtn.addEventListener('click', () => {
  textInput.value = SAMPLE_TEXTS.negative;
  updateLiveCounters();
  handleAnalyze();
});

sampleTechBtn.addEventListener('click', () => {
  textInput.value = SAMPLE_TEXTS.tech;
  updateLiveCounters();
  handleAnalyze();
});

analyzeBtn.addEventListener('click', handleAnalyze);

// Inicialização
updateLiveCounters();
checkSystemHealth();
loadHistory();

// Polling suave de status a cada 6 segundos
setInterval(checkSystemHealth, 6000);
