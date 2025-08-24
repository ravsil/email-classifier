import { initializeModel } from "./model.js";
import { switchTab, renderEmails } from "./ui.js";
import { handleFile, processNextBatch, loadEmails, hasMore, addManualEmail } from "./email.js";



const productiveTab = document.getElementById('productiveTab');
const unproductiveTab = document.getElementById('unproductiveTab');
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const addEmailBtn = document.getElementById('addEmailBtn');
const addEmailModal = document.getElementById('addEmailModal');
const closeAddEmailModal = document.getElementById('closeAddEmailModal');
const cancelAddEmail = document.getElementById('cancelAddEmail');

const addEmailForm = document.getElementById('addEmailForm');
const loadFromFileModalBtn = document.getElementById('loadFromFileModalBtn');


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
addEmailBtn.addEventListener('click', () => {
    addEmailModal.classList.remove('hidden');
});
closeAddEmailModal.addEventListener('click', () => {
    addEmailModal.classList.add('hidden');
});
cancelAddEmail.addEventListener('click', () => {
    addEmailModal.classList.add('hidden');
});
addEmailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const from = document.getElementById('addEmailFrom').value.trim();
    const subject = document.getElementById('addEmailSubject').value.trim();
    const body = document.getElementById('addEmailBody').value.trim();
    const date = new Date().toLocaleString('pt-BR');
    await addManualEmail({ from, subject, date, body });
    dropArea.classList.add('hidden');
    addEmailModal.classList.add('hidden');
    addEmailForm.reset();
    renderEmails();
});
loadFromFileModalBtn.addEventListener('click', () => {
    fileInput.click();
    addEmailModal.classList.add('hidden');
});

window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
        if (hasMore(false)) {
            processNextBatch();
        }
    }
});

if (localStorage.getItem('saveEmails') == 'false') {
    localStorage.removeItem('productiveEmails');
    localStorage.removeItem('unproductiveEmails');
}

if (localStorage.getItem('productiveEmails') != null && localStorage.getItem('unproductiveEmails') != null) {
    loadEmails()
}