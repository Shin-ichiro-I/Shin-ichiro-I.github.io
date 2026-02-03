document.addEventListener('DOMContentLoaded', () => {
    const article = document.querySelector('article.post');
    const tocSidebar = document.querySelector('.toc-sidebar .toc-list');
    const tocMobile = document.querySelector('.toc-mobile-list');
    const tocMobileToggle = document.querySelector('.toc-mobile-toggle');

    if (!article) return;

    const headings = article.querySelectorAll('h2, h3, h4');

    if (headings.length === 0) {
        // 見出しがない場合は目次を非表示
        const sidebarEl = document.querySelector('.toc-sidebar');
        const mobileEl = document.querySelector('.toc-mobile');
        if (sidebarEl) sidebarEl.style.display = 'none';
        if (mobileEl) mobileEl.style.display = 'none';
        return;
    }

    // 目次アイテムを生成する関数
    function createTocItem(heading) {
        const level = parseInt(heading.tagName.charAt(1));

        // 見出しにIDがない場合、自動生成
        if (!heading.id) {
            heading.id = heading.textContent
                .trim()
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u3400-\u4dbfa-z0-9-]/g, '')
                .substring(0, 50) || `heading-${Math.random().toString(36).substr(2, 9)}`;
        }

        const li = document.createElement('li');
        li.setAttribute('data-level', level);

        const a = document.createElement('a');
        a.href = `#${heading.id}`;
        a.textContent = heading.textContent.trim();
        a.setAttribute('data-target', heading.id);

        li.appendChild(a);
        return li;
    }

    // PC用サイドバー目次を生成
    if (tocSidebar) {
        headings.forEach(heading => {
            tocSidebar.appendChild(createTocItem(heading));
        });
    }

    // モバイル用目次を生成
    if (tocMobile) {
        headings.forEach(heading => {
            tocMobile.appendChild(createTocItem(heading));
        });
    }

    // モバイル目次の折りたたみ機能
    if (tocMobileToggle) {
        tocMobileToggle.addEventListener('click', () => {
            const isExpanded = tocMobileToggle.getAttribute('aria-expanded') === 'true';
            tocMobileToggle.setAttribute('aria-expanded', !isExpanded);
        });

        // 目次リンククリック時に折りたたむ
        if (tocMobile) {
            tocMobile.addEventListener('click', (e) => {
                if (e.target.tagName === 'A') {
                    tocMobileToggle.setAttribute('aria-expanded', 'false');
                }
            });
        }
    }

    // スクロール追従ハイライト（Intersection Observer）
    const tocLinks = document.querySelectorAll('.toc-list a, .toc-mobile-list a');

    if (tocLinks.length === 0) return;

    const observerOptions = {
        root: null,
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0
    };

    let currentActiveId = null;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;

                if (currentActiveId !== id) {
                    currentActiveId = id;

                    // 全てのリンクからactiveクラスを削除
                    tocLinks.forEach(link => link.classList.remove('active'));

                    // 対応するリンクにactiveクラスを追加
                    tocLinks.forEach(link => {
                        if (link.getAttribute('data-target') === id) {
                            link.classList.add('active');

                            // サイドバー内でアクティブな項目が見えるようにスクロール
                            const sidebar = link.closest('.toc-sidebar-inner');
                            if (sidebar) {
                                const linkRect = link.getBoundingClientRect();
                                const sidebarRect = sidebar.getBoundingClientRect();

                                if (linkRect.top < sidebarRect.top || linkRect.bottom > sidebarRect.bottom) {
                                    link.scrollIntoView({ block: 'center', behavior: 'smooth' });
                                }
                            }
                        }
                    });
                }
            }
        });
    }, observerOptions);

    // 見出しを監視
    headings.forEach(heading => {
        observer.observe(heading);
    });

    // スムーズスクロール
    tocLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                const headerOffset = 90;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});
