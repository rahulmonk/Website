document.addEventListener('DOMContentLoaded', () => {

    // --- Element Selections ---
    const windowContainer = document.querySelector('.window-container');
    const maximizeBtn = document.querySelector('.control-btn.maximize');
    const minimizeBtn = document.querySelector('.control-btn.minimize');
    const closeBtn = document.querySelector('.control-btn.close');
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const sidebar = document.querySelector('.sidebar');
    const closedMessage = document.getElementById('closed-message');
    const dock = document.getElementById('dock');
    const canvasContainer = document.getElementById('canvas-container');
    const canvas = document.getElementById('drawing-canvas');
    const screenshotBtn = document.getElementById('screenshot-btn');
    const currentThoughtEl = document.querySelector('.current-thought');

    // --- Dynamic Thought Display ---
    async function setRandomThought() {
        if (!currentThoughtEl) return;
        const prefix = document.documentElement.dataset.sitePrefix || '';
        try {
            // Correctly constructs the path using the prefix from the HTML tag
            const response = await fetch(`${prefix}/assets/js/thoughts.json`);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            if (data.thoughts && data.thoughts.length > 0) {
                const randomIndex = Math.floor(Math.random() * data.thoughts.length);
                currentThoughtEl.textContent = data.thoughts[randomIndex];
            }
        } catch (error) {
            console.error("Could not fetch thoughts:", error);
            currentThoughtEl.textContent = 'create freely'; // Fallback
        }
    }
    setRandomThought();

    // --- UI Window & Mobile Controls ---
    if (windowContainer) {
        maximizeBtn?.addEventListener('click', () => windowContainer.classList.toggle('maximized'));
        
        minimizeBtn?.addEventListener('click', () => {
            windowContainer.classList.add('minimized');
            dock?.classList.add('visible');
            if (canvasContainer) canvasContainer.style.display = 'block';
        });

        closeBtn?.addEventListener('click', () => {
            windowContainer.classList.add('hidden');
            closedMessage.style.display = 'block';
            dock?.classList.remove('visible');
            if (canvasContainer) canvasContainer.style.display = 'none';
        });

        dock?.addEventListener('click', () => {
            windowContainer.classList.remove('minimized');
            dock.classList.remove('visible');
            if (canvasContainer) {
                canvasContainer.style.display = 'none';
                const ctx = canvas?.getContext('2d');
                ctx?.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas on restore
            }
        });
        
        hamburgerMenu?.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar?.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (sidebar && !sidebar.contains(e.target) && !hamburgerMenu?.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }

    // --- Canvas Drawing Functionality ---
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

        // Initialize and add all event listeners for the canvas
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
});