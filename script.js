import { initializeModel, classifyMessage } from "./model.js";

const productiveTab = document.getElementById('productiveTab');
const unproductiveTab = document.getElementById('unproductiveTab');
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const emailList = document.getElementById('emailList');
const statusEl = document.getElementById('status');

let productiveEmails = [];
let unproductiveEmails = [];
let activeTab = 'productive';
let parsedCount = 0;
let parsingDone = false;
let emailBuffer = [];
let reader = null;
let isProcessing = false;

initializeModel();
productiveTab.addEventListener('click', () => switchTab('productive'));
unproductiveTab.addEventListener('click', () => switchTab('unproductive'));

dropArea.addEventListener('dragover', (e) => { e.preventDefault(); dropArea.classList.add('border-purple-400', 'bg-gray-700'); });
dropArea.addEventListener('dragleave', () => { dropArea.classList.remove('border-purple-400', 'bg-gray-700'); });
dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('border-purple-400', 'bg-gray-700');
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFile(files[0]);
});
fileInput.addEventListener('change', (e) => { if (e.target.files.length > 0) handleFile(e.target.files[0]); });

// Infinite scroll functionality
window.addEventListener('scroll', () => {
    // Check if we're near the bottom of the page (within 200px)
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
        // Only load more if we have more emails to process and we're not already processing
        if ((!parsingDone || emailBuffer.length > 0) && !isProcessing) {
            processNextBatch();
        }
    }
});

function switchTab(tab) {
    activeTab = tab;
    if (tab === 'productive') {
        productiveTab.classList.add('tab-active');
        productiveTab.classList.remove('text-gray-400', 'hover:bg-gray-700', 'border-transparent');
        unproductiveTab.classList.remove('tab-active');
        unproductiveTab.classList.add('text-gray-400', 'hover:bg-gray-700', 'border-transparent');
    } else {
        unproductiveTab.classList.add('tab-active');
        unproductiveTab.classList.remove('text-gray-400', 'hover:bg-gray-700', 'border-transparent');
        productiveTab.classList.remove('tab-active');
        productiveTab.classList.add('text-gray-400', 'hover:bg-gray-700', 'border-transparent');
    }
    renderEmails();
}

async function handleFile(file) {
    if (!file.name.endsWith('.mbox')) return;
    dropArea.style.display = 'none';
    statusEl.classList.remove('hidden');
    statusEl.textContent = 'Preparando...';

    // Reset state
    productiveEmails = [];
    unproductiveEmails = [];
    emailBuffer = [];
    parsedCount = 0;
    parsingDone = false;
    isProcessing = false;

    const stream = file.stream()
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(splitStream(/\r?\n/));

    reader = stream.getReader();

    // Process first batch
    await processNextBatch();
}

function splitStream(separatorRegex) {
    let buffer = '';
    return new TransformStream({
        transform(chunk, controller) {
            buffer += chunk;
            const parts = buffer.split(separatorRegex);
            buffer = parts.pop();
            for (const p of parts) controller.enqueue(p);
        },
        flush(controller) { if (buffer) controller.enqueue(buffer); }
    });
}

function cleanEmailBody(body) {
    if (!body || typeof body !== 'string') {
        return 'Este e-mail não possui corpo de texto.';
    }

    let cleaned = body;

    // Try to decode base64 if the entire body looks like base64
    if (/^[A-Za-z0-9+/\s]{20,}={0,2}\s*$/.test(cleaned.trim())) {
        try {
            const decoded = atob(cleaned.replace(/\s/g, ''));
            cleaned = new TextDecoder('utf-8').decode(
                new Uint8Array([...decoded].map(char => char.charCodeAt(0)))
            );
        } catch (e) {
            // If base64 decoding fails, continue with original content
        }
    }

    // Remove HTML tags and decode HTML entities
    cleaned = cleaned.replace(/<[^>]*>/g, ' ');
    cleaned = cleaned.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ')
        .replace(/&aacute;/g, 'á').replace(/&eacute;/g, 'é').replace(/&iacute;/g, 'í')
        .replace(/&oacute;/g, 'ó').replace(/&uacute;/g, 'ú').replace(/&ccedil;/g, 'ç')
        .replace(/&atilde;/g, 'ã').replace(/&otilde;/g, 'õ').replace(/&acirc;/g, 'â')
        .replace(/&ecirc;/g, 'ê').replace(/&icirc;/g, 'î').replace(/&ocirc;/g, 'ô')
        .replace(/&ucirc;/g, 'û');

    // Decode quoted-printable encoding
    cleaned = cleaned.replace(/=([0-9A-F]{2})/gi, (match, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
    });

    // Decode common UTF-8 quoted-printable sequences
    cleaned = cleaned.replace(/=C3=A1/g, 'á').replace(/=C3=A9/g, 'é').replace(/=C3=AD/g, 'í')
        .replace(/=C3=B3/g, 'ó').replace(/=C3=BA/g, 'ú').replace(/=C3=A7/g, 'ç')
        .replace(/=C3=A3/g, 'ã').replace(/=C3=B5/g, 'õ').replace(/=C3=A2/g, 'â')
        .replace(/=C3=AA/g, 'ê').replace(/=C3=AE/g, 'î').replace(/=C3=B4/g, 'ô')
        .replace(/=C3=BB/g, 'û').replace(/=C3=A0/g, 'à').replace(/=C3=A8/g, 'è');

    // Remove MIME boundaries and multipart declarations
    cleaned = cleaned.replace(/--[a-zA-Z0-9_=\-\+\/\.]+/g, '');
    cleaned = cleaned.replace(/This is a multi-part message in MIME format\./gi, '');
    cleaned = cleaned.replace(/Content-Type:.*$/gm, '');
    cleaned = cleaned.replace(/Content-Transfer-Encoding:.*$/gm, '');
    cleaned = cleaned.replace(/charset=.*$/gm, '');

    // Remove long URLs and tracking links
    cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '');

    // Remove base64 encoded blocks (lines that look like base64)
    cleaned = cleaned.replace(/^[A-Za-z0-9+/]{40,}={0,2}$/gm, '');

    // Remove email headers that might appear in the body
    cleaned = cleaned.replace(/^(From|To|Subject|Date|Message-ID|Content-.*|X-.*|DKIM-.*|ARC-.*|Return-Path|Received.*):.*$/gm, '');

    // Remove tracking pixels and image references
    cleaned = cleaned.replace(/\[image:.*?\]/gi, '');
    cleaned = cleaned.replace(/\[Google\]/gi, '');

    // Remove excessive whitespace
    cleaned = cleaned.replace(/\s{3,}/g, ' ');
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');

    // Remove leading and trailing whitespace
    cleaned = cleaned.trim();

    // Remove empty lines at the beginning and end
    cleaned = cleaned.replace(/^\s*\n+/, '').replace(/\n+\s*$/, '');

    // If the result is too short or empty, return a default message
    if (cleaned.length < 10) {
        return 'Este e-mail não possui corpo de texto legível.';
    }

    return cleaned;
}

async function processNextBatch() {
    if (isProcessing || !reader) return;

    isProcessing = true;
    statusEl.textContent = `Processando e-mails... ${parsedCount} processados`;

    const batchSize = 50;
    let processedInBatch = 0;

    // Process emails from buffer first
    while (emailBuffer.length > 0 && processedInBatch < batchSize) {
        const emailLines = emailBuffer.shift();
        await addParsed(await buildEmail(emailLines));
        processedInBatch++;
    }

    // If we still need more emails and haven't reached the end of file
    if (processedInBatch < batchSize && !parsingDone) {
        let currentEmail = [];
        let seenAny = false;

        try {
            while (processedInBatch < batchSize) {
                const { done, value } = await reader.read();

                if (done) {
                    // End of file
                    if (currentEmail.length > 0) {
                        await addParsed(await buildEmail(currentEmail));
                        processedInBatch++;
                    }
                    parsingDone = true;
                    break;
                }

                const line = value;

                if (line.startsWith('From ')) {
                    if (seenAny && currentEmail.length > 0) {
                        if (processedInBatch < batchSize) {
                            await addParsed(await buildEmail(currentEmail));
                            processedInBatch++;
                        } else {
                            // Save for next batch
                            emailBuffer.push(currentEmail);
                        }
                        currentEmail = [];
                    }
                    seenAny = true;
                } else {
                    currentEmail.push(line);
                }
            }

            // Save any remaining email for next batch
            if (currentEmail.length > 0 && processedInBatch >= batchSize) {
                emailBuffer.push(currentEmail);
            }
        } catch (error) {
            console.error('Error reading stream:', error);
            parsingDone = true;
        }
    }

    isProcessing = false;
    updateStatus();
    renderEmails();
}

async function addParsed(emailObj) {
    if (emailObj.category == 'unproductive') unproductiveEmails.push(emailObj);
    else productiveEmails.push(emailObj);
    console.log(emailObj);
    parsedCount++;
}

async function buildEmail(lines) {
    const rawEmail = lines.join('\n');
    const m = /\n\s*\n/.exec(rawEmail);
    let headerPart = rawEmail;
    let bodyPart = 'Este e-mail não possui corpo de texto.';
    if (m) {
        headerPart = rawEmail.slice(0, m.index);
        bodyPart = rawEmail.slice(m.index + m[0].length).trim();
    }

    const unfolded = headerPart.replace(/\r/g, '').replace(/\n[ \t]+/g, ' ');
    const subjectMatch = unfolded.match(/^Subject:\s*(.*)$/mi);
    const fromMatch = unfolded.match(/^From:\s*(.*)$/mi);
    const dateMatch = unfolded.match(/^Date:\s*(.*)$/mi);
    let s = decodeMimeEncodedStr(subjectMatch[1])
    return {
        id: `email-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        subject: subjectMatch ? s : 'Sem Assunto',
        from: fromMatch ? decodeMimeEncodedStr(fromMatch[1]) : 'Desconhecido',
        date: dateMatch ? dateMatch[1] : 'Sem Data',
        body: cleanEmailBody(bodyPart),
        category: await classifyMessage(s)
    };
}

function decodeMimeEncodedStr(str) {
    return str.replace(/=\?([^?]+)\?([BQ])\?([^?]+)\?=/g, (_, charset, enc, text) => {
        try {
            if (enc.toUpperCase() === 'B') {
                const bin = atob(text);
                const bytes = new Uint8Array(bin.length);
                for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
                return new TextDecoder(charset || 'utf-8').decode(bytes);
            } else {
                const qp = text.replace(/_/g, ' ').replace(/=([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
                const bytes = new Uint8Array(qp.length);
                for (let i = 0; i < qp.length; i++) bytes[i] = qp.charCodeAt(i);
                return new TextDecoder(charset || 'utf-8').decode(bytes);
            }
        } catch { return str; }
    });
}

function renderEmails() {
    emailList.innerHTML = '';
    const list = activeTab === 'productive' ? productiveEmails : unproductiveEmails;

    const frag = document.createDocumentFragment();
    list.forEach(email => {
        const emailElement = document.createElement('div');
        emailElement.className = 'email-item border-b border-gray-700 last:border-b-0';
        emailElement.innerHTML = `
            <div class="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700/50">
                <div class="flex-grow min-w-0" onclick="toggleEmailContent('${email.id}')">
                    <p class="font-medium text-gray-100 truncate">${email.from}</p>
                    <p class="text-sm text-gray-400 truncate">${email.subject}</p>
                </div>
                <button class="move-btn bg-purple-600 text-white text-xs font-bold py-1 px-3 rounded-full hover:bg-purple-700 ml-4" onclick="moveEmail(event, '${email.id}')">
                    Mover
                </button>
            </div>
            <div id="${email.id}" class="email-content px-4 pb-4">
                <div class="border-t border-gray-700 pt-4">
                    <p class="text-sm text-gray-400 mb-4"><strong>Data:</strong> ${email.date}</p>
                    <pre class="whitespace-pre-wrap text-sm text-gray-300">${escapeHTML(email.body)}</pre>
                </div>
            </div>
        `;
        frag.appendChild(emailElement);
    });
    emailList.appendChild(frag);

    // Show loading indicator at bottom if there are more emails to process
    const hasMore = !parsingDone || emailBuffer.length > 0;
    if (hasMore && isProcessing) {
        const loadingElement = document.createElement('div');
        loadingElement.className = 'p-4 text-center text-gray-400';
        loadingElement.innerHTML = `
            <div class="flex items-center justify-center space-x-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                <span>Carregando mais e-mails...</span>
            </div>
        `;
        emailList.appendChild(loadingElement);
    }
}

function updateStatus() {
    statusEl.classList.remove('hidden');
    if (parsingDone) {
        statusEl.textContent = `Concluído: ${parsedCount} e-mails processados.`;
    } else {
        statusEl.textContent = `Processados: ${parsedCount} e-mails.`;
    }
}

window.toggleEmailContent = function (id) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('open');
};

window.moveEmail = function (event, id) {
    event.stopPropagation();
    let from = activeTab === 'productive' ? productiveEmails : unproductiveEmails;
    let to = activeTab === 'productive' ? unproductiveEmails : productiveEmails;
    const idx = from.findIndex(e => e.id === id);
    if (idx > -1) {
        const item = from.splice(idx, 1)[0];
        item.category = activeTab === 'productive' ? 'unproductive' : 'productive';
        to.push(item);
        renderEmails();
    }
};

function escapeHTML(str) {
    const p = document.createElement('p');
    p.textContent = str || '';
    return p.innerHTML; // <pre> já preserva quebras
}