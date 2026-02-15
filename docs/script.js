function detectAndRedirect() {
    // Only redirect if on root index.html and no preference stored
    const isRoot = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    if (!isRoot) return;

    const storedLang = localStorage.getItem('archrisk_lang');
    if (storedLang === 'ko') {
        window.location.href = 'ko.html';
        return;
    }

    if (storedLang === 'en') return;

    // Auto-detect
    const userLang = navigator.language || navigator.userLanguage;
    if (userLang.toLowerCase().includes('ko')) {
        // Only redirect if we are sure it's the first visit
        // But for static pages, usually we just offer the link.
        // Let's NOT auto-redirect to avoid annoying users who prefer English despite locale.
        // User can click "Korean" in header.
    }
}

function setLang(lang) {
    localStorage.setItem('archrisk_lang', lang);
}

document.addEventListener('DOMContentLoaded', () => {
    // Highlight active link
    const path = window.location.pathname;
    if (path.includes('ko.html')) {
        document.getElementById('lang-ko').classList.add('active');
        document.getElementById('lang-ko').style.fontWeight = 'bold';
    } else {
        document.getElementById('lang-en').classList.add('active');
        document.getElementById('lang-en').style.fontWeight = 'bold';
    }
});
