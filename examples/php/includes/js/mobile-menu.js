// mobile-menu.js — Mobile nav menu toggle.

let mobileMenuOpen = false;

export function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
    const btn = document.getElementById('mobile-menu-btn');
    const overlay = document.getElementById('mobile-menu-overlay');
    const menu = document.getElementById('mobile-menu');
    if (mobileMenuOpen) {
        btn.classList.add('active');
        overlay.classList.add('open');
        menu.classList.add('open');
        document.body.style.overflow = 'hidden';
    } else {
        btn.classList.remove('active');
        overlay.classList.remove('open');
        menu.classList.remove('open');
        document.body.style.overflow = '';
    }
}

export function closeMobileMenu() {
    if (!mobileMenuOpen) return;
    mobileMenuOpen = false;
    document.getElementById('mobile-menu-btn').classList.remove('active');
    document.getElementById('mobile-menu-overlay').classList.remove('open');
    document.getElementById('mobile-menu').classList.remove('open');
    document.body.style.overflow = '';
}
