document.addEventListener('DOMContentLoaded', () => {
    const categoryButtons = document.querySelectorAll('.category-btn');
    const categorySelect = document.querySelector('.category-select');
    const seriesSections = document.querySelectorAll('.series-section');
    const standaloneSection = document.querySelector('.standalone-section');
    const standaloneArticles = standaloneSection ? standaloneSection.querySelectorAll('article[data-category]') : [];

    // カテゴリでフィルタリングする関数
    function filterByCategory(category) {
        // シリーズセクションのフィルタリング
        seriesSections.forEach(section => {
            const sectionCategory = section.getAttribute('data-category');
            if (category === 'all' || sectionCategory === category) {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        });

        // 単発記事のフィルタリング
        if (standaloneSection) {
            let visibleCount = 0;
            standaloneArticles.forEach(article => {
                const articleCategory = article.getAttribute('data-category');
                if (category === 'all' || articleCategory === category) {
                    article.style.display = '';
                    visibleCount++;
                } else {
                    article.style.display = 'none';
                }
            });

            // 表示する記事がない場合、セクション自体を非表示
            if (visibleCount === 0) {
                standaloneSection.classList.add('hidden');
            } else {
                standaloneSection.classList.remove('hidden');
            }
        }
    }

    // PC用サイドバーボタンのイベント
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // アクティブ状態を更新
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // フィルタリング実行
            const category = button.getAttribute('data-category');
            filterByCategory(category);

            // モバイル用セレクトボックスと同期
            if (categorySelect) {
                categorySelect.value = category;
            }
        });
    });

    // モバイル用セレクトボックスのイベント
    if (categorySelect) {
        categorySelect.addEventListener('change', (e) => {
            const category = e.target.value;
            filterByCategory(category);

            // PC用ボタンと同期
            categoryButtons.forEach(btn => {
                if (btn.getAttribute('data-category') === category) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        });
    }
});
