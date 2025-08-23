import { hasMore, isParsing, getParsedCount, getEmails } from "./email.js"

const productiveTab = document.getElementById('productiveTab');
const unproductiveTab = document.getElementById('unproductiveTab');
const emailList = document.getElementById('emailList');
const statusEl = document.getElementById('status');

let activeTab = 'productive';

export function switchTab(tab) {
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

export function renderEmails() {
    emailList.innerHTML = '';
    const list = getEmails(activeTab);

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
    if (hasMore()) {
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

export function updateStatus() {
    statusEl.classList.remove('hidden');
    if (isParsing()) {
        statusEl.textContent = `Processados: ${getParsedCount()} e-mails.`;
    } else {
        statusEl.textContent = `Concluído: ${getParsedCount()} e-mails processados.`;
    }
}

function escapeHTML(str) {
    const p = document.createElement('p');
    p.textContent = str || '';
    return p.innerHTML; // <pre> já preserva quebras
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
