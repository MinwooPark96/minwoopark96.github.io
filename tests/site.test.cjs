const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

// Minimal DOM adapter; tests execute the real search library and application scripts.
function element(parent = null, tagName = 'DIV') {
    const classes = new Set();
    return {
        parent, tagName, style: {}, listeners: {}, innerHTML: '', scrollWidth: 40,
        classList: {
            add: (name) => classes.add(name),
            remove: (name) => classes.delete(name),
            contains: (name) => classes.has(name),
            toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name)
        },
        addEventListener(type, callback) { (this.listeners[type] ||= []).push(callback); },
        dispatch(type, details = {}) {
            for (const callback of this.listeners[type] || []) callback({ target: this, ...details });
        },
        contains(target) {
            for (let node = target; node; node = node.parent) if (node === this) return true;
            return false;
        },
        closest(selector) { return selector === 'a' && this.tagName === 'A' ? this : null; },
        focus() { this.focused = true; }
    };
}

function searchPage(title = 'UAI 2026') {
    const group = element();
    const input = element(group, 'INPUT');
    const results = element(group);
    const label = element(group);
    const document = element();
    results.style.display = 'none';
    document.getElementById = (id) => ({ searchbar: input, 'search-results': results, 'posts-label': label }[id]);
    document.querySelector = () => group;
    const window = element();
    window.XMLHttpRequest = class {
        open() {}
        send() {
            this.readyState = 4;
            this.status = 200;
            this.responseText = JSON.stringify([{ title, url: '/posts/test.html', categories: 'UAI' }]);
            this.onreadystatechange();
        }
    };
    const context = vm.createContext({ window, document });
    vm.runInContext(read('assets/js/simple-jekyll-search.min.js'), context);
    context.SimpleJekyllSearch = window.SimpleJekyllSearch;
    vm.runInContext(read('assets/js/search.js').replace(/^---\r?\n---\r?\n/, ''), context);
    window.dispatch('DOMContentLoaded');
    return { group, input, results, document };
}

test('keyboard focus and pasted input reveal matching search results', () => {
    const { group, input, results } = searchPage();
    group.dispatch('focusin', { target: input });
    input.value = 'UAI';
    input.dispatch('input');
    assert.notEqual(results.style.display, 'none');
    assert.match(results.innerHTML, /UAI 2026<\/a>/);
});

test('search results remain open while tabbing to a result, then close on exit', () => {
    const { group, input, results } = searchPage();
    group.dispatch('focusin', { target: input });
    group.dispatch('focusout', { relatedTarget: element(results, 'A') });
    assert.notEqual(results.style.display, 'none');
    group.dispatch('focusout', { relatedTarget: null });
    assert.equal(results.style.display, 'none');
});

test('Escape and an outside click close search without replacing body handlers', () => {
    const { group, results, document } = searchPage();
    group.dispatch('focusin');
    group.dispatch('keydown', { key: 'Escape' });
    assert.equal(results.style.display, 'none');
    group.dispatch('focusin');
    document.dispatch('click', { target: element() });
    assert.equal(results.style.display, 'none');
});

test('clicking a result does not move focus back to the input', () => {
    const { group, input, results } = searchPage();
    group.dispatch('click', { target: element(results, 'A') });
    assert.equal(input.focused, undefined);
});

test('titles containing HTML and quotes are rendered as text', () => {
    const { input, results } = searchPage('UAI <img src=x onerror="alert(1)"> & "quotes"');
    input.value = 'UAI';
    input.dispatch('input');
    assert.doesNotMatch(results.innerHTML, /<img/);
    assert.match(results.innerHTML, /&lt;img/);
    assert.match(results.innerHTML, /&amp; &quot;quotes&quot;/);
});

function themePage(cookie, prefersDark) {
    const toggles = [element(), element()];
    const document = { body: element(), cookie, querySelectorAll: () => toggles };
    const window = { matchMedia: () => ({ matches: prefersDark }) };
    vm.runInNewContext(read('assets/js/darkmode.js'), { window, document });
    return { document, toggles };
}

test('theme follows the system preference until a saved choice exists', () => {
    const automatic = themePage('', true);
    assert.equal(automatic.document.body.classList.contains('dark'), true);
    assert.ok(automatic.toggles.every((toggle) => toggle.checked));
    const saved = themePage('other=value; theme=light', true);
    assert.equal(saved.document.body.classList.contains('dark'), false);
});

test('changing either theme checkbox synchronizes both and saves a persistent cookie', () => {
    const { document, toggles } = themePage('', false);
    toggles[1].checked = true;
    toggles[1].dispatch('change');
    assert.equal(document.body.classList.contains('dark'), true);
    assert.ok(toggles.every((toggle) => toggle.checked));
    assert.match(document.cookie, /theme=dark;.*max-age=31536000/);
    toggles[0].checked = false;
    toggles[0].dispatch('change');
    assert.ok(toggles.every((toggle) => !toggle.checked));
    assert.equal(document.body.classList.contains('dark'), false);
});
