(function () {
    var toggles = document.querySelectorAll('.dark-mode-toggle');
    var savedTheme = document.cookie.match(/(?:^|;\s*)theme=(dark|light)(?:;|$)/);
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    function applyTheme(dark) {
        document.body.classList.toggle('dark', dark);
        toggles.forEach(function (toggle) {
            toggle.checked = dark;
        });
    }

    applyTheme(savedTheme ? savedTheme[1] === 'dark' : prefersDark);

    toggles.forEach(function (toggle) {
        toggle.addEventListener('change', function () {
            var dark = toggle.checked;
            applyTheme(dark);
            document.cookie = 'theme=' + (dark ? 'dark' : 'light') + ';path=/;SameSite=Strict;max-age=31536000';
        });
    });
})();
