document.addEventListener('DOMContentLoaded', () => {
    // === Element Selections ===
    const windowContainer = document.querySelector('.window-container');
    const maximizeBtn = document.querySelector('.control-btn.maximize');
    const minimizeBtn = document.querySelector('.control-btn.minimize');
    const closeBtn = document.querySelector('.control-btn.close');
    const closedMessage = document.getElementById('closed-message');
    const dock = document.getElementById('dock');
    const canvasContainer = document.getElementById('canvas-container');
    const canvas = document.getElementById('drawing-canvas');
    const screenshotBtn = document.getElementById('screenshot-btn');
    const currentThoughtEl = document.querySelector('.current-thought');

    // === Dynamic Thought Display ===
    async function setRandomThought() {
        if (!currentThoughtEl) return;
        const prefix = document.documentElement.dataset.sitePrefix || '';
        try {
            const response = await fetch(`${prefix}/assets/js/thoughts.json`);
            if (!response.ok) return;
            const data = await response.json();
            if (data.thoughts && data.thoughts.length > 0) {
                const randomIndex = Math.floor(Math.random() * data.thoughts.length);
                currentThoughtEl.textContent = data.thoughts[randomIndex];
            }
        } catch (error) {
            console.error("Could not fetch thoughts:", error);
            // The default thought remains if the fetch fails
        }
    }
    setRandomThought();

    // === UI, Canvas & Dock Interaction ===
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let isDrawing = false;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
        };

        const getMousePos = (evt) => {
            const rect = canvas.getBoundingClientRect();
            const clientX = evt.clientX || (evt.touches && evt.touches[0].clientX);
            const clientY = evt.clientY || (evt.touches && evt.touches[0].clientY);
            return { x: clientX - rect.left, y: clientY - rect.top };
        };

        const startDrawing = (e) => { e.preventDefault(); isDrawing = true; const pos = getMousePos(e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y); };
        const draw = (e) => { e.preventDefault(); if (!isDrawing) return; const pos = getMousePos(e); ctx.lineTo(pos.x, pos.y); ctx.stroke(); };
        const stopDrawing = (e) => { e.preventDefault(); isDrawing = false; };
        const clearCanvas = () => ctx.clearRect(0, 0, canvas.width, canvas.height);

        minimizeBtn?.addEventListener('click', () => { windowContainer.classList.add('minimized'); dock.classList.add('visible'); canvasContainer.style.display = 'block'; });
        dock?.addEventListener('click', () => { windowContainer.classList.remove('minimized'); dock.classList.remove('visible'); canvasContainer.style.display = 'none'; clearCanvas(); });
        
        screenshotBtn?.addEventListener('click', () => {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = canvas.width; tempCanvas.height = canvas.height;
            tempCtx.fillStyle = getComputedStyle(document.body).getPropertyValue('--outer-bg').trim();
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.drawImage(canvas, 0, 0);
            const link = document.createElement('a');
            link.download = 'my-thought.jpg'; link.href = tempCanvas.toDataURL('image/jpeg', 0.9);
            link.click();
        });

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);
        canvas.addEventListener('touchstart', startDrawing, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', stopDrawing);
    }
    
    maximizeBtn?.addEventListener('click', () => windowContainer.classList.toggle('maximized'));
    closeBtn?.addEventListener('click', () => { windowContainer.classList.add('hidden'); closedMessage.style.display = 'block'; dock.classList.remove('visible'); if(canvasContainer) canvasContainer.style.display = 'none'; });

    // === Dynamic Content Loading (SPA-like functionality on index.html) ===
    const contentPane = document.querySelector('.content-pane');
    const navItems = {
        projects: document.getElementById('nav-projects'),
        thoughts: document.getElementById('nav-thoughts'),
        about: document.getElementById('nav-about')
    };

    if (contentPane && navItems.projects) { // Only run this logic on the main page
        const updateView = (viewName) => {
            const template = document.getElementById(`${viewName}-template`);
            if (!template) { console.error(`Template for view "${viewName}" not found!`); return; }
            
            contentPane.innerHTML = ''; // Clear previous content
            contentPane.appendChild(template.content.cloneNode(true));
            
            // Update active class on navigation
            Object.values(navItems).forEach(item => item?.classList.remove('active'));
            navItems[viewName]?.classList.add('active');
        };

        const handleNavClick = (viewName, e) => {
            e.preventDefault();
            const currentUrl = new URL(window.location);
            currentUrl.searchParams.set('view', viewName);
            history.pushState({view: viewName}, '', currentUrl);
            updateView(viewName);
        };

        Object.entries(navItems).forEach(([viewName, element]) => {
            element?.addEventListener('click', (e) => handleNavClick(viewName, e));
        });

        // Load content based on URL parameter on initial load
        const initialView = new URLSearchParams(window.location.search).get('view') || 'projects';
        updateView(initialView);
    }
});