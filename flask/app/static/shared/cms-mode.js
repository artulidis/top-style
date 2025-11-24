(function(){
    function qs(name) {
        return new URLSearchParams(location.search).get(name);
    }
    const isEdit = qs('edit') === 'true';
    if (!isEdit) return;

    document.querySelectorAll('[data-cms-key]').forEach(el => {
        el.contentEditable = "true";
        el.dataset.original = el.innerHTML;
        el.style.cursor = 'text';

        el.addEventListener('mouseenter', () => {
            el.style.border = '2px dashed rgba(80, 80, 80, 0.1)';
        });

        el.addEventListener('mouseleave', () => {
            if (document.activeElement !== el) {
                el.style.border = 'none';
            }
        });

        el.addEventListener('focus', () => {
            el.style.outline = 'none';
            el.style.border = '2px dashed rgba(80,80,80,0.6)';
        });

        el.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                el.blur();
            }
        });

        el.addEventListener('blur', () => {
            el.style.border = 'none';
        });
    });

    // Listen for parent asking for current content
    window.addEventListener('message', e => {
    // Check origin in production
        const msg = e.data || {};
        if (msg.type === 'GET_EDIT_CONTENT') {
            const page = msg.page || document.body.dataset.cmsPage || 'index';
            const changes = {};
            document.querySelectorAll('[data-cms-key]').forEach(el => {
                const key = el.getAttribute('data-cms-key');
                changes[key] = el.tagName.toLowerCase() === 'img' ? el.getAttribute('src') : el.innerHTML;
            });
        
            e.source.postMessage({ type: 'EDIT_CONTENT', page, changes }, e.origin || '*');
        }

        if (msg.type === 'APPLY_REMOTE_CHANGE') {
            const {key, value} = msg;
            const target = document.querySelector('[data-cms-key="'+key+'"]');
            if (target) {
                if (target.tagName.toLowerCase() === 'img') target.src = value;

            else target.innerHTML = value;
            }
        }
    }, false);
})();