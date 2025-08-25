const type = document.getElementById('classifyingType');
const saveEmails = document.getElementById('saveEmails');
let localExamples = [];
let localReplies = [];

function renderRepliesList() {
    const list = document.getElementById('repliesList');
    list.innerHTML = '';
    localReplies.forEach((rep, idx) => {
        const div = document.createElement('div');
        div.className = 'flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0 bg-gray-700/60 rounded-lg p-4 mb-3 shadow';
        div.innerHTML = `
                <div class="flex-1 mb-2 md:mb-0">
                    <input type="text" value="${rep.trigger.replace(/"/g, '&quot;')}" class="w-full rounded p-2 bg-gray-800 text-gray-200 border border-gray-600 focus:ring-2 focus:ring-purple-500 transition" data-idx="${idx}" data-type="trigger" placeholder="agenda reuniao chamada">
                </div>
                <div class="flex-1 mb-2 md:mb-0">
                    <input type="text" value="${rep.reply.replace(/"/g, '&quot;')}" class="w-full rounded p-2 bg-gray-800 text-gray-200 border border-gray-600 focus:ring-2 focus:ring-purple-500 transition" data-idx="${idx}" data-type="reply" placeholder="Vou verificar a agenda e confirmar.">
                </div>
                <div class="flex items-end">
                    <button class="removeReplyBtn px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition" data-idx="${idx}">Remover</button>
                </div>
        `;
        list.appendChild(div);
    });
}

function openRepliesModal() {
    document.getElementById('manageRepliesModal').classList.remove('hidden');
    localReplies = localStorage.getItem('customReplies');
    if (localReplies) {
        localReplies = JSON.parse(localReplies);
    } else {
        localReplies = [];
    }
    renderRepliesList();
}

function closeRepliesModal() {
    document.getElementById('manageRepliesModal').classList.add('hidden');
}

function renderExamplesList() {
    const list = document.getElementById('examplesList');
    list.innerHTML = '';
    localExamples.forEach((ex, idx) => {
        const div = document.createElement('div');
        let l = ex.category
        let s = ex.subject
        let b = ex.body
        let c = localStorage.getItem('classifyingType') === 'message' ? b : s;
        div.className = 'flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0 bg-gray-700/60 rounded-lg p-4 mb-3 shadow';
        div.innerHTML = `
                <div class="flex-1 mb-2 md:mb-0">
                    <input type="text" value="${c.replace(/"/g, '&quot;')}" class="w-full rounded p-2 bg-gray-800 text-gray-200 border border-gray-600 focus:ring-2 focus:ring-purple-500 transition" data-idx="${idx}" data-type="text">
                </div>
                <div class="w-44 mb-2 md:mb-0">
                    <select class="w-full rounded p-2 bg-gray-800 text-gray-200 border border-gray-600 focus:ring-2 focus:ring-purple-500 transition" data-idx="${idx}" data-type="label">
                        <option value="Productive" ${l === 'productive' ? 'selected' : ''}>Produtivo</option>
                        <option value="Unproductive" ${l === 'unproductive' ? 'selected' : ''}>Não Produtivo</option>
                    </select>
                </div>
                <div class="flex items-end">
                    <button class="removeExampleBtn px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition" data-idx="${idx}">Remover</button>
                </div>
        `;
        list.appendChild(div);
    });
}

function openExamplesModal() {
    document.getElementById('manageExamplesModal').classList.remove('hidden');
    localExamples = localStorage.getItem('customClassifiers');
    if (localExamples) {
        localExamples = JSON.parse(localExamples);
    } else {
        localExamples = [];
    }
    renderExamplesList();
}

function closeExamplesModal() {
    document.getElementById('manageExamplesModal').classList.add('hidden');
}


document.addEventListener('DOMContentLoaded', () => {
    // Examples modal
    const btn = document.getElementById('manageExamplesBtn');
    const modal = document.getElementById('manageExamplesModal');
    const closeBtn = document.getElementById('closeExamplesModal');
    const saveBtn = document.getElementById('saveExamplesBtn');
    const addBtn = document.getElementById('addExampleBtn');
    const list = document.getElementById('examplesList');

    btn.addEventListener('click', openExamplesModal);
    closeBtn.addEventListener('click', closeExamplesModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeExamplesModal();
    });

    saveBtn.addEventListener('click', () => {
        localStorage.setItem('customClassifiers', JSON.stringify(localExamples));
        closeExamplesModal();
        window.location.reload();
    });

    addBtn.addEventListener('click', () => {
        localExamples.push({ subject: '', body: '', label: 'Productive' });
        renderExamplesList();
    });

    list.addEventListener('input', (e) => {
        const idx = e.target.getAttribute('data-idx');
        const type = e.target.getAttribute('data-type');
        if (idx !== null && type) {
            if (type === 'text') localExamples[idx].text = e.target.value;
            if (type === 'label') localExamples[idx].label = e.target.value;
        }
    });

    list.addEventListener('click', (e) => {
        if (e.target.classList.contains('removeExampleBtn')) {
            const idx = e.target.getAttribute('data-idx');
            if (idx !== null) {
                localExamples.splice(idx, 1);
                renderExamplesList();
            }
        }
    });

    // Replies modal
    const repliesBtn = document.getElementById('manageRepliesBtn');
    const repliesModal = document.getElementById('manageRepliesModal');
    const closeRepliesBtn = document.getElementById('closeRepliesModal');
    const saveRepliesBtn = document.getElementById('saveRepliesBtn');
    const addReplyBtn = document.getElementById('addReplyBtn');
    const repliesList = document.getElementById('repliesList');

    repliesBtn.addEventListener('click', openRepliesModal);
    closeRepliesBtn.addEventListener('click', closeRepliesModal);
    repliesModal.addEventListener('click', (e) => {
        if (e.target === repliesModal) closeRepliesModal();
    });

    saveRepliesBtn.addEventListener('click', () => {
        localStorage.setItem('customReplies', JSON.stringify(localReplies));
        closeRepliesModal();
        window.location.reload();
    });

    addReplyBtn.addEventListener('click', () => {
        localReplies.push({ trigger: '', reply: '' });
        renderRepliesList();
    });

    repliesList.addEventListener('input', (e) => {
        const idx = e.target.getAttribute('data-idx');
        const type = e.target.getAttribute('data-type');
        if (idx !== null && type) {
            if (type === 'trigger') localReplies[idx].trigger = e.target.value;
            if (type === 'reply') localReplies[idx].reply = e.target.value;
        }
    });

    repliesList.addEventListener('click', (e) => {
        if (e.target.classList.contains('removeReplyBtn')) {
            const idx = e.target.getAttribute('data-idx');
            if (idx !== null) {
                localReplies.splice(idx, 1);
                renderRepliesList();
            }
        }
    });
});

type.value = localStorage.getItem('classifyingType') || 'subject';
type.addEventListener('change', () => {
    localStorage.setItem('classifyingType', type.value);
});

saveEmails.checked = localStorage.getItem('saveEmails') == 'true';
if (localStorage.getItem('saveEmails') == null) {
    localStorage.setItem('saveEmails', 'false');
}
saveEmails.addEventListener('change', () => {
    localStorage.setItem('saveEmails', saveEmails.checked);
});