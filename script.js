import * as tf from 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js';
import { pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';
import { examples } from "./examples.js";

const messageInput = document.getElementById('message-input');
const classifyBtn = document.getElementById('classify-btn');
const resultOutput = document.getElementById('result-output');
const loader = document.getElementById('loader');
const buttonText = document.getElementById('button-text');

let embedder = null;

let exampleEmbeddings = [];

const cosineSim = (a, b) => {
    const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
    const normA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
    const normB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
    return dot / (normA * normB);
};

const setUIState = (isLoading, message = '') => {
    classifyBtn.disabled = isLoading;
    if (isLoading) {
        loader.classList.remove('hidden');
        buttonText.textContent = 'Carregando...';
        if (message) resultOutput.innerHTML = `<p class="text-blue-500">${message}</p>`;
    } else {
        loader.classList.add('hidden');
        buttonText.textContent = 'Classificar';
        if (message) resultOutput.innerHTML = message;
    }
};

const initializeModel = async () => {
    try {
        setUIState(true, 'Carregando modelo de embeddings...');
        embedder = await pipeline('feature-extraction', 'Xenova/paraphrase-multilingual-MiniLM-L12-v2');
        for (let ex of examples) {
            const out = await embedder(ex.text, { pooling: 'mean', normalize: true });
            exampleEmbeddings.push({ embedding: out.data, label: ex.label });
        }
        setUIState(false, 'Modelo carregado. Pronto para classificar!');
    } catch (err) {
        console.error(err);
        setUIState(false, '<p class="text-red-500">Erro ao carregar o modelo.</p>');
    }
};

const suggestReply = (msg) => {
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
};

const standardizeMessage = (msg) => {
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
};

classifyBtn.addEventListener('click', async () => {
    const msg = standardizeMessage(messageInput.value.trim());
    if (!msg) {
        resultOutput.innerHTML = '<p class="text-yellow-500">Por favor, digite uma mensagem.</p>';
        return;
    }
    if (!embedder) {
        resultOutput.innerHTML = '<p class="text-red-500">Modelo não está pronto.</p>';
        return;
    }

    classifyBtn.disabled = true;
    loader.classList.remove('hidden');
    buttonText.textContent = 'Classificando...';
    resultOutput.innerHTML = '';

    try {
        const out = await embedder(msg, { pooling: 'mean', normalize: true });
        const emb = out.data;

        let best = { label: '', score: -1 };
        for (let ex of exampleEmbeddings) {
            const sim = cosineSim(emb, ex.embedding);
            if (sim > best.score) best = { label: ex.label, score: sim };
        }

        const labelText = best.label === 'Productive' ? 'Produtiva' : 'Improdutiva';
        const resultColor = best.label === 'Productive' ? 'text-green-500' : 'text-orange-500';
        let html = `
      <p>Esta mensagem é: <strong class="${resultColor}">${labelText}</strong></p>
      <p class="text-sm text-gray-400">Similaridade: ${(best.score * 100).toFixed(1)}%</p>
    `;

        if (best.label === "Productive") {
            const reply = suggestReply(msg);
            html += `
        <div class="mt-4 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-left">
          <p class="text-gray-600 dark:text-gray-300 text-sm mb-1">Resposta Sugerida:</p>
          <p class="text-gray-800 dark:text-gray-100 font-medium">${reply}</p>
        </div>
      `;
        }

        resultOutput.innerHTML = html;
    } catch (err) {
        console.error(err);
        resultOutput.innerHTML = '<p class="text-red-500">Erro na classificação.</p>';
    } finally {
        classifyBtn.disabled = false;
        loader.classList.add('hidden');
        buttonText.textContent = 'Classificar';
    }
});

initializeModel();
