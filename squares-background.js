/**
 * Animated Squares Background
 * Vanilla JavaScript version of the React squares-background component
 */

class SquaresBackground {
    constructor(canvasElement, options = {}) {
        this.canvas = canvasElement;
        this.ctx = this.canvas.getContext('2d');

        // Configuration options (matching React component props)
        this.direction = options.direction || 'diagonal';
        this.speed = Math.max(options.speed || 0.5, 0.1);
        this.borderColor = options.borderColor || '#333';
        this.squareSize = options.squareSize || 40;
        this.hoverFillColor = options.hoverFillColor || '#222';
        this.backgroundColor = options.backgroundColor || '#060606';

        // Internal state
        this.gridOffset = { x: 0, y: 0 };
        this.hoveredSquare = null;
        this.numSquaresX = 0;
        this.numSquaresY = 0;
        this.animationFrameId = null;

        // Bind methods
        this.handleResize = this.handleResize.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
        this.updateAnimation = this.updateAnimation.bind(this);

        // Initialize
        this.init();
    }

    init() {
        // Set canvas background
        this.canvas.style.background = this.backgroundColor;

        // Set up event listeners
        window.addEventListener('resize', this.handleResize);
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave);

        // Initial setup
        this.handleResize();
        this.animationFrameId = requestAnimationFrame(this.updateAnimation);
    }

    handleResize() {
        // Set canvas size to match element size
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;

        // Calculate number of squares needed
        this.numSquaresX = Math.ceil(this.canvas.width / this.squareSize) + 1;
        this.numSquaresY = Math.ceil(this.canvas.height / this.squareSize) + 1;
    }

    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // This matches the React component's logic exactly
        const startX = Math.floor(this.gridOffset.x / this.squareSize) * this.squareSize;
        const startY = Math.floor(this.gridOffset.y / this.squareSize) * this.squareSize;

        const hoveredSquareX = Math.floor(
            (mouseX + this.gridOffset.x - startX) / this.squareSize
        );
        const hoveredSquareY = Math.floor(
            (mouseY + this.gridOffset.y - startY) / this.squareSize
        );

        this.hoveredSquare = { x: hoveredSquareX, y: hoveredSquareY };
    }

    handleMouseLeave() {
        this.hoveredSquare = null;
    }

    drawGrid() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // This matches the React component's drawing logic exactly
        const startX = Math.floor(this.gridOffset.x / this.squareSize) * this.squareSize;
        const startY = Math.floor(this.gridOffset.y / this.squareSize) * this.squareSize;

        this.ctx.lineWidth = 0.5;

        // Draw squares
        for (let x = startX; x < this.canvas.width + this.squareSize; x += this.squareSize) {
            for (let y = startY; y < this.canvas.height + this.squareSize; y += this.squareSize) {
                const squareX = x - (this.gridOffset.x % this.squareSize);
                const squareY = y - (this.gridOffset.y % this.squareSize);

                // Fill hovered square - this matches React component exactly
                const gridX = Math.floor((x - startX) / this.squareSize);
                const gridY = Math.floor((y - startY) / this.squareSize);

                if (
                    this.hoveredSquare &&
                    gridX === this.hoveredSquare.x &&
                    gridY === this.hoveredSquare.y
                ) {
                    this.ctx.fillStyle = this.hoverFillColor;
                    this.ctx.fillRect(squareX, squareY, this.squareSize, this.squareSize);
                }

                // Draw square border
                this.ctx.strokeStyle = this.borderColor;
                this.ctx.strokeRect(squareX, squareY, this.squareSize, this.squareSize);
            }
        }

        // Apply subtle radial gradient vignette effect
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2,
            this.canvas.height / 2,
            0,
            this.canvas.width / 2,
            this.canvas.height / 2,
            Math.sqrt(Math.pow(this.canvas.width, 2) + Math.pow(this.canvas.height, 2)) / 2
        );
        gradient.addColorStop(0, 'rgba(6, 6, 6, 0)');
        gradient.addColorStop(0.6, 'rgba(6, 6, 6, 0)');  // Start fade a bit earlier
        gradient.addColorStop(1, 'rgba(6, 6, 6, 0.85)');  // Stronger fade at edges

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    updateAnimation() {
        const effectiveSpeed = this.speed;

        // Update grid offset based on direction
        switch (this.direction) {
            case 'right':
                this.gridOffset.x =
                    (this.gridOffset.x - effectiveSpeed + this.squareSize) % this.squareSize;
                break;
            case 'left':
                this.gridOffset.x =
                    (this.gridOffset.x + effectiveSpeed + this.squareSize) % this.squareSize;
                break;
            case 'up':
                this.gridOffset.y =
                    (this.gridOffset.y + effectiveSpeed + this.squareSize) % this.squareSize;
                break;
            case 'down':
                this.gridOffset.y =
                    (this.gridOffset.y - effectiveSpeed + this.squareSize) % this.squareSize;
                break;
            case 'diagonal':
                this.gridOffset.x =
                    (this.gridOffset.x - effectiveSpeed + this.squareSize) % this.squareSize;
                this.gridOffset.y =
                    (this.gridOffset.y - effectiveSpeed + this.squareSize) % this.squareSize;
                break;
        }

        this.drawGrid();
        this.animationFrameId = requestAnimationFrame(this.updateAnimation);
    }

    destroy() {
        // Clean up event listeners and animation
        window.removeEventListener('resize', this.handleResize);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }
}

// Initialize squares background when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('squares-background');
    if (canvas) {
        // Initialize with same settings as React demo component
        new SquaresBackground(canvas, {
            direction: 'diagonal',
            speed: 0.3,              // Slowed down from 0.5
            squareSize: 40,
            borderColor: '#333',
            hoverFillColor: '#444',  // Lighter fill for more visible hover effect
            backgroundColor: '#060606'
        });
    }
});
