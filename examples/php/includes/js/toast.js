// toast.js — Toast notification system.

const toastContainer = document.createElement('div');
toastContainer.className = 'toast-container';
toastContainer.id = 'toast-container';
document.body.appendChild(toastContainer);

export function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = 'toast' + (type === 'error' ? ' error' : type === 'success' ? ' success' : '');
    toast.textContent = message;
    toastContainer.appendChild(toast);
    requestAnimationFrame(() => { toast.classList.add('show'); });
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => { toast.remove(); }, 300);
    }, 3500);
}
