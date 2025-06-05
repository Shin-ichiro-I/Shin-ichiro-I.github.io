document.addEventListener('DOMContentLoaded', () => {
    const article = document.querySelector('article.post');
    const tocSidebar = document.querySelector('aside.toc-sidebar');

    if (!article || !tocSidebar) {
        return; // 記事または目次サイドバーが見つからなければ何もしない
    }

    const headings = article.querySelectorAll('h2, h3, h4, h5, h6');
    const tocList = document.createElement('ul');

    headings.forEach(heading => {
        // 見出しにIDがない場合、自動的にIDを生成する（既存IDを尊重）
        if (!heading.id) {
            heading.id = heading.textContent.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]+/g, '');
        }

        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = `#${heading.id}`;
        link.textContent = heading.textContent.trim();

        // 見出しレベルに応じたネスト（h2の下にh3など）を実装する場合は、ここにもっと複雑なロジックが必要です
        // 今回はシンプルにフラットなリストとします

        listItem.appendChild(link);
        tocList.appendChild(listItem);
    });

    // 既存のプレースホルダーリストを置き換える
    const existingList = tocSidebar.querySelector('ul');
    if (existingList) {
        tocSidebar.replaceChild(tocList, existingList);
    } else {
        tocSidebar.appendChild(tocList);
    }

    // ここに目次サイドバーのスクロール追従やスタイリングに関するJavaScriptを追加できますが、
    // スタイリングはCSSで行うのが一般的です。
});