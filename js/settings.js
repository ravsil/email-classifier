const type = document.getElementById('classifyingType');
const saveEmails = document.getElementById('saveEmails');

type.value = localStorage.getItem('classifyingType') || 'subject';
type.addEventListener('change', () => {
    localStorage.setItem('classifyingType', type.value);
});

saveEmails.checked = localStorage.getItem('saveEmails') == 'true';
localStorage.setItem('saveEmails', 'false');
saveEmails.addEventListener('change', () => {
    localStorage.setItem('saveEmails', saveEmails.checked);
});
