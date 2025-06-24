// === canvas + dock interaction ===
document.addEventListener('DOMContentLoaded', () => {
    const windowContainer = document.querySelector('.window-container');
    const maximizeBtn = document.querySelector('.control-btn.maximize');
    const minimizeBtn = document.querySelector('.control-btn.minimize');
    const closeBtn = document.querySelector('.control-btn.close');
    const closedMessage = document.getElementById('closed-message');
    const dock = document.getElementById('dock');
    const canvasContainer = document.getElementById('canvas-container');
    const canvas = document.getElementById('drawing-canvas');
    const screenshotBtn = document.getElementById('screenshot-btn');
    const ctx = canvas.getContext('2d');
    let isDrawing = false;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
    }

    function getMousePos(evt) {
        const rect = canvas.getBoundingClientRect();
        const clientX = evt.clientX || evt.touches[0].clientX;
        const clientY = evt.clientY || evt.touches[0].clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function startDrawing(e) {
        e.preventDefault();
        isDrawing = true;
        const pos = getMousePos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }

    function draw(e) {
        e.preventDefault();
        if (!isDrawing) return;
        const pos = getMousePos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }

    function stopDrawing(e) {
        e.preventDefault();
        isDrawing = false;
    }

    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    maximizeBtn?.addEventListener('click', () => windowContainer.classList.toggle('maximized'));
    minimizeBtn?.addEventListener('click', () => {
        windowContainer.classList.add('minimized');
        dock.classList.add('visible');
        canvasContainer.style.display = 'block';
    });
    dock?.addEventListener('click', () => {
        windowContainer.classList.remove('minimized');
        dock.classList.remove('visible');
        canvasContainer.style.display = 'none';
        clearCanvas();
    });
    closeBtn?.addEventListener('click', () => {
        windowContainer.classList.add('hidden');
        closedMessage.style.display = 'block';
        dock.classList.remove('visible');
        canvasContainer.style.display = 'none';
    });

    screenshotBtn?.addEventListener('click', () => {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCtx.fillStyle = getComputedStyle(document.body).getPropertyValue('--outer-bg').trim();
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(canvas, 0, 0);
        const link = document.createElement('a');
        link.download = 'my-thought.jpg';
        link.href = tempCanvas.toDataURL('image/jpeg', 0.9);
        link.click();
    });

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    canvas?.addEventListener('mousedown', startDrawing);
    canvas?.addEventListener('mousemove', draw);
    canvas?.addEventListener('mouseup', stopDrawing);
    canvas?.addEventListener('mouseout', stopDrawing);
    canvas?.addEventListener('touchstart', startDrawing, { passive: false });
    canvas?.addEventListener('touchmove', draw, { passive: false });
    canvas?.addEventListener('touchend', stopDrawing);
});
