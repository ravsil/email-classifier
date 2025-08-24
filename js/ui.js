import { hasMore, isParsing, getEmails } from "./email.js"

const productiveTab = document.getElementById('productiveTab');
const unproductiveTab = document.getElementById('unproductiveTab');
const emailList = document.getElementById('emailList');
const statusEl = document.getElementById('status');

let activeTab = 'productive';

export function getActiveTab() {
    return activeTab;
}

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
    updateStatus();
}

export function renderEmails() {
    emailList.innerHTML = '';
    const list = getEmails(activeTab);
    if (localStorage.getItem('saveEmails') == 'true') {
        localStorage.setItem('productiveEmails', JSON.stringify(getEmails('productive')));
        localStorage.setItem('unproductiveEmails', JSON.stringify(getEmails('unproductive')));
    } else {
        localStorage.removeItem('productiveEmails');
        localStorage.removeItem('unproductiveEmails');
    }

    const frag = document.createDocumentFragment();
    list.forEach(email => {
        const emailElement = document.createElement('div');
        emailElement.className = 'email-item border-b border-gray-700 last:border-b-0';
        emailElement.innerHTML = `
            <div class="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700/50 hover:shadow-[0_0_8px_2px_rgba(168,85,247,0.5)] transition-shadow duration-200" style="border-radius: 0.5rem;">
                <div class="flex-grow min-w-0" onclick="toggleEmailContent('${email.id}')" style="cursor: pointer;">
                    <p class="font-medium text-gray-100 truncate">${email.from}</p>
                    <p class="text-sm text-gray-400 truncate">${email.subject}</p>
                </div>
                <button class="move-btn bg-purple-600 text-white text-xs font-bold py-1 px-3 rounded-full hover:bg-purple-700 ml-4" onclick="moveEmail(event, '${email.id}')" style="cursor: pointer;">
                    Mover
                </button>
            </div>
            <div id="${email.id}" class="email-content px-4 pb-4">
                <div class="border-t border-gray-700 pt-4">
                    <p class="text-sm text-gray-400 mb-4"><strong>Data:</strong> ${email.date}</p>
                    <pre class="whitespace-pre-wrap text-sm text-gray-300">${escapeHTML(email.body)}</pre>
                    ${email.reply ? `
                    <div class="mt-4">
                        <p class="text-xs text-gray-500 mb-1">Sugestão:</p>
                        <div class="flex items-center space-x-2">
                            <pre id="reply-${email.id}" class="whitespace-pre-wrap text-xs bg-gray-800 text-gray-200 p-2 rounded border border-gray-700 flex-1" onclick="
                                navigator.clipboard.writeText(this.textContent);
                                this.style.opacity='0.3';
                                setTimeout(() => { this.style.opacity='1' }, 150);
                            " style="cursor: pointer;">${escapeHTML(email.reply)}</pre>
                        </div>
                    </div>
                    ` : ''}
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
        statusEl.textContent = `Processados: ${getEmails(activeTab).length} e-mails.`;
    } else {
        statusEl.textContent = `Concluído: ${getEmails(activeTab).length} e-mails processados.`;
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