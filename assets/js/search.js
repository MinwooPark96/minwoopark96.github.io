---
---

window.addEventListener('DOMContentLoaded', function () {
    var searchbar = document.getElementById('searchbar');
    var searchResults = document.getElementById('search-results');
    var labelGroup = document.querySelector('.posts-labelgroup');
    var postLabel = document.getElementById('posts-label');

    if (!searchbar || !searchResults || !labelGroup || !postLabel) return;

    function escapeHTML(value) {
        var entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return String(value).replace(/[&<>"']/g, function (character) {
            return entities[character];
        });
    }

    var search = SimpleJekyllSearch({
        searchInput: searchbar,
        resultsContainer: searchResults,
        json: '{{ "/search.json" | relative_url }}',
        searchResultTemplate: '<a href="{url}" target="_blank" rel="noopener noreferrer">{title}</a>',
        templateMiddleware: function (property, value) {
            if (property === 'title' || property === 'url') return escapeHTML(value);
        },
        noResultsText: ''
    });

    var labelWidth = postLabel.scrollWidth + 'px';
    postLabel.style.width = labelWidth;

    function openSearch() {
        searchResults.style.display = '';
        postLabel.style.width = '0';
        labelGroup.classList.add('focus-within');
    }

    function closeSearch() {
        searchResults.style.display = 'none';
        postLabel.style.width = labelWidth;
        labelGroup.classList.remove('focus-within');
    }

    labelGroup.addEventListener('focusin', openSearch);
    labelGroup.addEventListener('focusout', function (event) {
        if (!labelGroup.contains(event.relatedTarget)) closeSearch();
    });
    labelGroup.addEventListener('click', function (event) {
        if (event.target.closest('a')) return;
        searchbar.focus();
        openSearch();
    });
    searchbar.addEventListener('input', function () {
        search.search(searchbar.value);
        openSearch();
    });
    labelGroup.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            searchbar.focus();
            closeSearch();
        }
    });
    document.addEventListener('click', function (event) {
        if (!labelGroup.contains(event.target)) closeSearch();
    });
});
