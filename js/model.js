import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';
import { examples } from "./examples.js";

let embedder = null;
let exampleEmbeddings = [];
const CACHE_KEY = 'exampleEmbeddings';

function cosineSim(a, b) {
    const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
    const normA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
    const normB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
    return dot / (normA * normB);
}

export async function initializeModel() {
    const loadingText = document.querySelector('.loading-text');
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('mainContent').classList.remove('show');

    try {
        const cachedEmbeddings = localStorage.getItem(CACHE_KEY);
        if (cachedEmbeddings) {
            exampleEmbeddings = JSON.parse(cachedEmbeddings);
            if (loadingText) loadingText.textContent = 'Carregando modelo...';
            embedder = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2');
        } else {
            if (loadingText) loadingText.textContent = 'Carregando modelo...';
            embedder = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2');
            for (let i = 0; i < examples.length; i++) {
                const ex = examples[i];
                const out = await embedder(ex.text, { pooling: 'mean', normalize: true });
                exampleEmbeddings.push({ embedding: Array.from(out.data), label: ex.label });
                if (loadingText) {
                    loadingText.textContent = `Carregando exemplos ${Math.round(((i + 1) / examples.length) * 100)}%`;
                    await new Promise(r => setTimeout(r, 10));
                }
            }
            localStorage.setItem(CACHE_KEY, JSON.stringify(exampleEmbeddings));
        }
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('mainContent').classList.add('show');
    } catch (err) {
        console.error(err);
        if (loadingText) {
            loadingText.textContent = 'Erro ao carregar o modelo.';
            loadingText.style.color = '#ef4444';
        }
    }
}

export function suggestReply(msg) {
    msg = msg.toLowerCase();
    if (/cronograma|agenda|reuniao|chamada/.test(msg)) return "Vou verificar a agenda e confirmar.";
    if (/relatorio|documento|feedback/.test(msg)) return "Vou revisar e fornecer feedback.";
    if (/aprovacao|orcamento|contrato/.test(msg)) return "Vou revisar e aprovar se estiver tudo certo.";
    if (/senha|conta|acesso/.test(msg)) return "Vou redefinir e enviar os dados de acesso.";
    if (/servidor|erro|problema|bug/.test(msg)) return "Vou investigar o problema e atualizar você.";
    if (/confirmar|presenca/.test(msg)) return "Confirmo minha presença.";
    if (/permissao|repositorio|acessos/.test(msg)) return "Vou liberar o acesso solicitado.";
    if (/fatura|pagamento|cobranca/.test(msg)) return "Vou confirmar o status do pagamento.";
    if (/slides|apresentacao/.test(msg)) return "Vou revisar os slides e ajustar se necessário.";
    if (/backup|implantacao|publicacao/.test(msg)) return "Vou acompanhar o processo e garantir que ocorra bem.";
    return "Entendido, vou retornar em breve.";
}

function standardizeMessage(msg) {
    msg = msg.toLowerCase();
    msg = msg.replace(/ç/g, 'c');
    msg = msg.replace(/ã/g, 'a');
    msg = msg.replace(/á/g, 'a');
    msg = msg.replace(/é/g, 'e');
    msg = msg.replace(/í/g, 'i');
    msg = msg.replace(/ó/g, 'o');
    msg = msg.replace(/ú/g, 'u');
    msg = msg.replace(/[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g, '');
    return msg;
}

export async function classifyMessage(msg) {
    if (!embedder) {
        return 'Productive';
    }
    msg = standardizeMessage(msg.trim());

    try {
        const out = await embedder(msg, { pooling: 'mean', normalize: true });
        const emb = out.data;

        let best = { label: '', score: -1 };
        for (let ex of exampleEmbeddings) {
            const sim = cosineSim(emb, ex.embedding);
            if (sim > best.score) best = { label: ex.label, score: sim };
        }

        return best.label.toLowerCase();
    } catch (err) {
        console.error(err);
        return 'Productive';
    }
}