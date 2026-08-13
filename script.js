// Web 1.0 Blog - Mode toggle + Tag filter
let currentMode = 'light';
const body = document.body;
const toggleBtn = document.getElementById('mode-toggle');

toggleBtn.addEventListener('click', () => {
    if (currentMode === 'light') {
        body.classList.remove('light');
        body.classList.add('dark');
        toggleBtn.textContent = 'Переключить на БЕЛЫЙ режим';
        currentMode = 'dark';
    } else {
        body.classList.remove('dark');
        body.classList.add('light');
        toggleBtn.textContent = 'Переключить на ЧЁРНЫЙ режим';
        currentMode = 'light';
    }
});

// Tag filtering
const tagButtons = document.querySelectorAll('.tag-btn');
const postCards = document.querySelectorAll('.post-card');

tagButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active from all
        tagButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const selectedTag = btn.getAttribute('data-tag');
        
        postCards.forEach(card => {
            if (selectedTag === 'all') {
                card.style.display = 'block';
            } else {
                const cardTags = card.getAttribute('data-tags');
                if (cardTags && cardTags.includes(selectedTag)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            }
        });
    });
});
