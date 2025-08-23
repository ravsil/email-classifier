import { initializeModel } from "./model.js";
import { switchTab } from "./ui.js"
import { handleFile, processNextBatch } from "./email.js"


const productiveTab = document.getElementById('productiveTab');
const unproductiveTab = document.getElementById('unproductiveTab');
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');


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

window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
        if ((!parsingDone || emailBuffer.length > 0) && !isProcessing) {
            processNextBatch();
        }
    }
});
