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
            const response = await fetch(`${prefix}/assets/js/thoughts.json`);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            if (data.thoughts && data.thoughts.length > 0) {
                const randomIndex = Math.floor(Math.random() * data.thoughts.length);
                currentThoughtEl.textContent = data.thoughts[randomIndex];
            }
        } catch (error) {
            console.error("Could not fetch thoughts:", error);
            currentThoughtEl.textContent = 'create freely';
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
                ctx?.clearRect(0, 0, canvas.width, canvas.height);
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

    // --- UPDATED: Advanced Canvas Drawing Functionality ---
    if (canvas) {
        const toolbar = document.getElementById('drawing-toolbar');
        const brushSizeSlider = document.getElementById('brush-size');
        const ctx = canvas.getContext('2d');

        let currentTool = 'pencil';
        let currentBrushSize = 3;
        let isDrawing = false;
        let startX, startY;
        let snapshot;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--outer-bg').trim();
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.font = '24px Inter, sans-serif';
        };

        const getMousePos = (e) => {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            return { x: clientX - rect.left, y: clientY - rect.top };
        };

        const saveCanvasState = () => {
            snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        };

        const restoreCanvasState = () => {
            if (snapshot) ctx.putImageData(snapshot, 0, 0);
        };

        const startDraw = (e) => {
            if (currentTool === 'text') return;
            isDrawing = true;
            const pos = getMousePos(e);
            startX = pos.x;
            startY = pos.y;
            ctx.beginPath();
            ctx.lineWidth = currentBrushSize;
            ctx.moveTo(startX, startY);
            saveCanvasState();
        };

        const draw = (e) => {
            if (!isDrawing) return;
            const pos = getMousePos(e);

            if (currentTool !== 'pencil' && currentTool !== 'eraser') {
                restoreCanvasState();
            }

            if (currentTool === 'pencil') {
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
            } else if (currentTool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
                ctx.globalCompositeOperation = 'source-over';
            } else if (currentTool === 'rectangle') {
                ctx.strokeRect(startX, startY, pos.x - startX, pos.y - startY);
            } else if (currentTool === 'circle') {
                ctx.beginPath();
                const radius = Math.sqrt(Math.pow(pos.x - startX, 2) + Math.pow(pos.y - startY, 2));
                ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
                ctx.stroke();
            } else if (currentTool === 'line') {
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
            } else if (currentTool === 'arrow') {
                drawArrow(startX, startY, pos.x, pos.y);
            }
        };

        const stopDraw = (e) => {
            if (!isDrawing) return;
            isDrawing = false;
            ctx.beginPath();
        };

        const drawArrow = (fromX, fromY, toX, toY) => {
            const headlen = 10;
            const dx = toX - fromX;
            const dy = toY - fromY;
            const angle = Math.atan2(dy, dx);
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);
            ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(toX, toY);
            ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
        };

        const handleTextTool = (e) => {
            if (currentTool !== 'text') return;
            isDrawing = false;
            const pos = getMousePos(e);

            const input = document.createElement('input');
            input.type = 'text';
            input.style.position = 'absolute';
            input.style.left = `${e.clientX}px`;
            input.style.top = `${e.clientY}px`;
            input.style.background = 'var(--outer-bg)';
            input.style.border = '1px dashed #fff';
            input.style.color = '#fff';
            input.style.font = '24px Inter, sans-serif';
            input.style.padding = '4px';
            input.style.zIndex = '100';
            document.body.appendChild(input);
            input.focus();

            const finishText = () => {
                if (!document.body.contains(input)) return;
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(input.value, pos.x, pos.y);
                document.body.removeChild(input);
            };

            input.addEventListener('blur', finishText);
            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') finishText();
            });
        };

        toolbar?.addEventListener('click', (e) => {
            const button = e.target.closest('.tool-btn');
            if (button) {
                document.querySelector('.tool-btn.active').classList.remove('active');
                button.classList.add('active');
                currentTool = button.dataset.tool;
                isDrawing = false;
                
                if (currentTool === 'text') {
                    canvas.classList.add('canvas-cursor-text');
                    canvas.classList.remove('canvas-cursor-crosshair');
                } else {
                    canvas.classList.remove('canvas-cursor-text');
                    canvas.classList.add('canvas-cursor-crosshair');
                }
            }
        });

        brushSizeSlider?.addEventListener('input', (e) => {
            currentBrushSize = e.target.value;
        });

        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDraw);
        canvas.addEventListener('mouseout', stopDraw);
        canvas.addEventListener('click', handleTextTool);

        canvas.addEventListener('touchstart', (e) => startDraw(e.touches[0]));
        canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e.touches[0]); });
        canvas.addEventListener('touchend', (e) => stopDraw(e.changedTouches[0]));

        screenshotBtn?.addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = 'my-thought.jpg';
            link.href = canvas.toDataURL('image/jpeg', 0.9);
            link.click();
        });

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }
});
