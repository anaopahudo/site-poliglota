"""
Mini Python Analytics Microservice
Responsável por computação estatística e processamento de texto.
Utiliza apenas a biblioteca padrão do Python para execução sem dependências externas.
Porta padrão: 5001
"""

import json
import re
import math
from http.server import HTTPServer, BaseHTTPRequestHandler
from collections import Counter

PORT = 5001

# Stopwords básicas em Português e Inglês para filtrar palavras irrelevantes
STOPWORDS = {
    # Português
    'a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas', 'de', 'do', 'da', 'dos', 'das',
    'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'com', 'sem', 'que', 'se', 'e', 'ou',
    'mas', 'como', 'ao', 'aos', 'meu', 'minha', 'seu', 'sua', 'ele', 'ela', 'eles', 'elas',
    'esse', 'essa', 'este', 'esta', 'isso', 'isto', 'nao', 'não', 'mais', 'muito', 'ja', 'já',
    'foi', 'era', 'sao', 'são', 'ser', 'ter', 'estar',
    # Inglês
    'the', 'is', 'at', 'which', 'on', 'in', 'and', 'or', 'to', 'for', 'with', 'a', 'an',
    'of', 'this', 'that', 'it', 'from', 'be', 'are', 'was', 'were', 'not', 'have', 'has'
}

# Léxico simplificado para análise de sentimento
POSITIVE_WORDS = {
    'bom', 'ótimo', 'otimo', 'excelente', 'maravilhoso', 'perfeito', 'incrível', 'incrivel',
    'rápido', 'rapido', 'eficiente', 'adorei', 'gostei', 'sucesso', 'fácil', 'facil',
    'melhor', 'positivo', 'vantagem', 'qualidade', 'inovador', 'recomendo',
    'great', 'good', 'excellent', 'fast', 'amazing', 'perfect', 'awesome', 'love', 'best'
}

NEGATIVE_WORDS = {
    'ruim', 'péssimo', 'pessimo', 'horrível', 'horrivel', 'lento', 'bug', 'erro', 'falha',
    'difícil', 'dificil', 'problema', 'defeito', 'pior', 'negativo', 'odiei', 'trava',
    'travando', 'caro', 'inseguro', 'complicado', 'chato',
    'bad', 'terrible', 'horrible', 'slow', 'error', 'buggy', 'worst', 'poor', 'hate', 'fail'
}

def analyze_text(text: str) -> dict:
    """Executa métricas estatísticas e de PLN leve sobre o texto."""
    if not text or not text.strip():
        return {
            "char_count": 0,
            "char_no_spaces": 0,
            "word_count": 0,
            "sentence_count": 0,
            "reading_time_seconds": 0,
            "lexical_diversity": 0.0,
            "avg_word_length": 0.0,
            "sentiment": {
                "score": 0.0,
                "label": "Neutro",
                "confidence": 1.0,
                "positive_matches": [],
                "negative_matches": []
            },
            "top_words": []
        }

    raw_text = text.strip()
    char_count = len(raw_text)
    char_no_spaces = len(re.sub(r'\s+', '', raw_text))

    # Sentenças (divididas por pontuação . ! ?)
    sentences = [s.strip() for s in re.split(r'[.!?]+', raw_text) if s.strip()]
    sentence_count = max(1, len(sentences))

    # Extração e normalização de palavras
    tokens = re.findall(r'\b[a-zA-ZÀ-ÿ0-9_]+\b', raw_text.lower())
    word_count = len(tokens)

    if word_count == 0:
        return analyze_text("")

    # Média de tamanho das palavras
    total_token_chars = sum(len(t) for t in tokens)
    avg_word_length = round(total_token_chars / word_count, 1)

    # Diversidade lexical (palavras únicas / total de palavras)
    unique_words = set(tokens)
    lexical_diversity = round((len(unique_words) / word_count) * 100, 1)

    # Tempo estimado de leitura (base: 200 palavras por minuto)
    reading_time_seconds = max(1, math.ceil((word_count / 200) * 60))

    # Palavras-chave mais frequentes (filtrando stopwords e pontuações)
    meaningful_words = [w for w in tokens if w not in STOPWORDS and len(w) > 2 and not w.isdigit()]
    word_counts = Counter(meaningful_words)
    top_words = [{"word": word, "count": count} for word, count in word_counts.most_common(6)]

    # Análise de Sentimento Heurística
    pos_matches = [w for w in tokens if w in POSITIVE_WORDS]
    neg_matches = [w for w in tokens if w in NEGATIVE_WORDS]
    
    pos_score = len(pos_matches)
    neg_score = len(neg_matches)
    total_sentiment_words = pos_score + neg_score

    if total_sentiment_words == 0:
        sentiment_score = 0.0
        sentiment_label = "Neutro"
        confidence = 0.8
    else:
        # Score entre -1.0 e 1.0
        sentiment_score = round((pos_score - neg_score) / total_sentiment_words, 2)
        if sentiment_score > 0.15:
            sentiment_label = "Positivo"
        elif sentiment_score < -0.15:
            sentiment_label = "Negativo"
        else:
            sentiment_label = "Neutro"
        confidence = round(min(1.0, 0.5 + (total_sentiment_words / (word_count + 1))), 2)

    return {
        "char_count": char_count,
        "char_no_spaces": char_no_spaces,
        "word_count": word_count,
        "sentence_count": sentence_count,
        "reading_time_seconds": reading_time_seconds,
        "lexical_diversity": lexical_diversity,
        "avg_word_length": avg_word_length,
        "sentiment": {
            "score": sentiment_score,
            "label": sentiment_label,
            "confidence": confidence,
            "positive_matches": list(set(pos_matches)),
            "negative_matches": list(set(neg_matches))
        },
        "top_words": top_words
    }


class AnalyticsRequestHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(204)

    def do_GET(self):
        if self.path == '/health' or self.path == '/':
            self._set_headers(200)
            res = {
                "status": "online",
                "service": "Python Analytics Microservice",
                "version": "1.0.0",
                "port": PORT
            }
            self.wfile.write(json.dumps(res).encode('utf-8'))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Endpoint não encontrado"}).encode('utf-8'))

    def do_POST(self):
        if self.path == '/process':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)

            try:
                data = json.loads(post_data.decode('utf-8'))
                text = data.get('text', '')
                result = analyze_text(text)

                self._set_headers(200)
                response_payload = {
                    "success": True,
                    "engine": "Python Standard Library (Zero-Dependency)",
                    "data": result
                }
                self.wfile.write(json.dumps(response_payload, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                self._set_headers(400)
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode('utf-8'))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Endpoint não encontrado"}).encode('utf-8'))

    def log_message(self, format, *args):
        # Log simplificado no console
        print(f"[PYTHON ENGINE] {self.address_string()} - {args[0]}")


def run_server():
    server_address = ('127.0.0.1', PORT)
    httpd = HTTPServer(server_address, AnalyticsRequestHandler)
    print("==================================================")
    print(f" [*] Python Analytics Engine iniciado com sucesso!")
    print(f" [*] URL: http://127.0.0.1:{PORT}")
    print(f" [*] Health Check: http://127.0.0.1:{PORT}/health")
    print("==================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nFinalizando servidor Python...")
        httpd.server_close()


if __name__ == '__main__':
    run_server()
