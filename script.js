// Web 1.0 Blog - Mode toggle + Tag filter

// --- Тема (сохраняется между страницами) ---
const THEME_KEY = 'blog-mode';
let currentMode = 'light';
const body = document.body;
const toggleBtn = document.getElementById('mode-toggle');

function applyMode(mode) {
    body.classList.remove('light', 'dark');
    body.classList.add(mode);
    currentMode = mode;
    if (toggleBtn) {
        toggleBtn.textContent = mode === 'dark'
            ? 'Переключить на БЕЛЫЙ режим'
            : 'Переключить на ЧЁРНЫЙ режим';
    }
}

try {
    const savedMode = localStorage.getItem(THEME_KEY);
    if (savedMode === 'light' || savedMode === 'dark') {
        applyMode(savedMode);
    }
} catch (e) {
    // localStorage недоступен — остаёмся на светлой теме
}

if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
        const next = currentMode === 'light' ? 'dark' : 'light';
        applyMode(next);
        try {
            localStorage.setItem(THEME_KEY, next);
        } catch (e) {}
    });
}

// --- Фильтр по тегам ---
const postCards = document.querySelectorAll('.post-card');

function cardTags(card) {
    return (card.getAttribute('data-tags') || '')
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);
}

// Синхронизация кнопок с реальными тегами карточек
const tagsNav = document.querySelector('.tags-nav');
const tagButtons = document.querySelectorAll('.tag-btn');

if (tagsNav && tagButtons.length) {
    const allTags = [];
    postCards.forEach(card => {
        cardTags(card).forEach(tag => {
            if (!allTags.includes(tag)) allTags.push(tag);
        });
    });

    const covered = new Set();
    tagButtons.forEach(btn => {
        const tag = btn.getAttribute('data-tag');
        if (tag === 'all') return;
        if (allTags.includes(tag)) {
            covered.add(tag);
        } else {
            btn.hidden = true;
        }
    });

    allTags.forEach(tag => {
        if (covered.has(tag)) return;
        const btn = document.createElement('button');
        btn.className = 'tag-btn';
        btn.setAttribute('data-tag', tag);
        btn.textContent = '#' + tag;
        tagsNav.appendChild(btn);
    });

    const filterButtons = document.querySelectorAll('.tag-btn');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const selectedTag = btn.getAttribute('data-tag');

            postCards.forEach(card => {
                const show = selectedTag === 'all' || cardTags(card).includes(selectedTag);
                card.style.display = show ? '' : 'none';
            });
        });
    });
}
