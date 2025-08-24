import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';
import { examples, replies } from "./examples.js";

let embedder = null;
let exampleEmbeddings = [];

function cosineSim(a, b) {
    const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
    const normA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
    const normB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
    return dot / (normA * normB);
}

function generateExamples() {
    let customExamples = localStorage.getItem('customClassifiers')
    let type = localStorage.getItem('classifyingType') == 'message'
    let exs = []
    if (customExamples) {
        customExamples = JSON.parse(customExamples);
    }
    for (let c of customExamples || []) {
        exs.push({ text: (type) ? standardizeMessage(c.body) : standardizeMessage(c.subject), label: (c.category == 'productive') ? 'Productive' : 'Unproductive' });
    }
    return [...exs, ...examples];
}

export async function initializeModel() {
    const loadingText = document.querySelector('.loading-text');
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('mainContent').classList.remove('show');

    try {
        const cachedEmbeddings = localStorage.getItem('exampleEmbeddings');
        if (cachedEmbeddings) {
            exampleEmbeddings = JSON.parse(cachedEmbeddings);
            if (loadingText) loadingText.textContent = 'Carregando modelo...';
            embedder = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2');
        } else {
            if (loadingText) loadingText.textContent = 'Carregando modelo...';
            embedder = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2');
            let exs = generateExamples();
            for (let i = 0; i < exs.length; i++) {
                await train(exs[i])
                if (loadingText) {
                    loadingText.textContent = `Carregando exemplos ${Math.round(((i + 1) / exs.length) * 100)}%`;
                    await new Promise(r => setTimeout(r, 10));
                }
            }
            localStorage.setItem('exampleEmbeddings', JSON.stringify(exampleEmbeddings));
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

export async function train(msg) {
    const out = await embedder(msg.text, { pooling: 'mean', normalize: true });
    exampleEmbeddings.push({ embedding: Array.from(out.data), label: msg.label });
}

export function suggestReply(msg) {
    msg = msg.toLowerCase();
    let customReplies = localStorage.getItem('customReplies')
    if (customReplies) {
        customReplies = [...JSON.parse(customReplies), ...replies];
        for (let r of customReplies) {
            if (typeof r.trigger == 'string') {
                r.trigger = new RegExp(r.trigger.replaceAll(' ', '|'));
            }
            if (r.trigger.test(standardizeMessage(msg))) return r.reply;
        }
    } else {
        for (let r of replies) {
            if (r.trigger.test(standardizeMessage(msg))) return r.reply;
        }
    }
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