class GalleryApp {
    constructor() {
        this.images = [];
        this.currentIndex = 0;
        this.isSlideshowPlaying = false;
        this.slideshowInterval = null;
        this.thumbnails = [];
        this.hoverTimeout = null;
        this.zoomLevel = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.isZooming = false;

        this.initializeElements();
        this.bindEvents();
        this.setupKeyboardNavigation();
    }

    initializeElements() {
        this.dropZone = document.getElementById('dropZone');
        this.galleryContainer = document.getElementById('galleryContainer');
        this.currentImage = document.getElementById('currentImage');
        this.thumbnailStrip = document.getElementById('thumbnailStrip');
        this.navigationControls = document.getElementById('navigationControls');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.playPauseBtn = document.getElementById('playPauseBtn');
    }

    bindEvents() {
        // Drag and drop events
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropZone.addEventListener(eventName, this.preventDefaults, false);
        });

        this.dropZone.addEventListener('drop', this.handleDrop.bind(this), false);

        // Navigation buttons
        this.prevBtn.addEventListener('click', () => this.navigateToPrevious());
        this.nextBtn.addEventListener('click', () => this.navigateToNext());
        this.playPauseBtn.addEventListener('click', () => this.toggleSlideshow());

        // Hover events for controls
        this.dropZone.addEventListener('mouseenter', () => this.showControls());
        this.dropZone.addEventListener('mouseleave', () => this.hideControls());

        // Touch events for mobile
        this.galleryContainer.addEventListener('touchstart', this.handleTouchStart.bind(this), false);
        this.galleryContainer.addEventListener('touchmove', this.handlePinch.bind(this), false);
        this.galleryContainer.addEventListener('touchend', this.handleTouchEnd.bind(this), false);

        // Mouse wheel zooming
        this.galleryContainer.addEventListener('wheel', this.handleMouseZoom.bind(this), { passive: false });

        // Reset zoom when clicking on image
        this.currentImage.addEventListener('click', () => {
            if (this.isZooming) {
                this.resetZoom();
                this.isZooming = false;
            }
        });
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            this.processFiles(files);
        }
    }

    processFiles(files) {
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();

                reader.onload = (e) => {
                    const imageData = {
                        src: e.target.result,
                        name: file.name
                    };

                    this.images.push(imageData);
                    this.updateGallery();

                    // If this is the first image, show it
                    if (this.images.length === 1) {
                        this.showCurrentImage();
                    }
                };

                reader.readAsDataURL(file);
            }
        });
    }

    updateGallery() {
        // Clear existing thumbnails
        this.thumbnailStrip.innerHTML = '';
        this.thumbnails = [];

        // Create new thumbnails
        this.images.forEach((image, index) => {
            const thumbnail = document.createElement('img');
            thumbnail.src = image.src;
            thumbnail.alt = image.name;
            thumbnail.className = 'thumbnail';
            thumbnail.dataset.index = index;

            thumbnail.addEventListener('click', () => {
                this.navigateToImage(index);
            });

            this.thumbnailStrip.appendChild(thumbnail);
            this.thumbnails.push(thumbnail);
        });

        // Update active thumbnail
        this.updateActiveThumbnail();
    }

    showCurrentImage() {
        if (this.images.length > 0) {
            this.currentImage.src = this.images[this.currentIndex].src;
            this.currentImage.alt = this.images[this.currentIndex].name;
            this.currentImage.style.display = 'block';

            // Reset zoom level when changing images
            this.resetZoom();

            // Update active thumbnail
            this.updateActiveThumbnail();
        }
    }

    updateActiveThumbnail() {
        this.thumbnails.forEach((thumbnail, index) => {
            if (index === this.currentIndex) {
                thumbnail.classList.add('active');
            } else {
                thumbnail.classList.remove('active');
            }
        });
    }

    navigateToImage(index) {
        if (index >= 0 && index < this.images.length) {
            this.currentIndex = index;
            this.showCurrentImage();
        }
    }

    navigateToPrevious() {
        if (this.images.length > 0) {
            this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
            this.showCurrentImage();
        }
    }

    navigateToNext() {
        if (this.images.length > 0) {
            this.currentIndex = (this.currentIndex + 1) % this.images.length;
            this.showCurrentImage();
        }
    }

    toggleSlideshow() {
        if (this.isSlideshowPlaying) {
            this.stopSlideshow();
        } else {
            this.startSlideshow();
        }
    }

    startSlideshow() {
        if (this.images.length < 2) return;

        this.isSlideshowPlaying = true;
        this.playPauseBtn.textContent = '❚❚';
        this.playPauseBtn.classList.add('playing');

        this.slideshowInterval = setInterval(() => {
            this.navigateToNext();
        }, 3000); // Change image every 3 seconds
    }

    stopSlideshow() {
        this.isSlideshowPlaying = false;
        this.playPauseBtn.textContent = '▶';
        this.playPauseBtn.classList.remove('playing');

        if (this.slideshowInterval) {
            clearInterval(this.slideshowInterval);
            this.slideshowInterval = null;
        }
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (this.images.length === 0) return;

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.navigateToPrevious();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.navigateToNext();
                    break;
                case ' ':
                    e.preventDefault();
                    this.toggleSlideshow();
                    break;
            }
        });
    }

    showControls() {
        // Clear any existing timeout
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
        }

        // Show thumbnail strip and navigation controls
        this.thumbnailStrip.classList.add('visible');
        this.navigationControls.classList.add('visible');
    }

    hideControls() {
        // Delay hiding to allow smooth transitions
        this.hoverTimeout = setTimeout(() => {
            this.thumbnailStrip.classList.remove('visible');
            this.navigationControls.classList.remove('visible');
        }, 1000);
    }

    // Touch swipe handling for mobile
    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
    }

    handleMouseZoom(e) {
        e.preventDefault();
        let clientX = e.clientX;
        let clientY = e.clientY;

        // Calculate zoom factor (adjust the multiplier as needed for sensitivity)
        const zoomIntensity = 0.1;
        const delta = e.deltaY > 0 ? -zoomIntensity : zoomIntensity;

        this.doZoom(this.zoomLevel + delta, clientX, clientY);
    }

    doZoom(newZoomLevel, clientX, clientY) {
        const image = this.currentImage;
        if(!image) return;

        if (newZoomLevel < 1.0) {
            newZoomLevel = 1.0;
        } else if (newZoomLevel > 3) {
            newZoomLevel = 3;
        }

        // Only update if zoom level actually changed
        if (newZoomLevel !== this.zoomLevel) {

            // Get current mouse position relative to the container
            const container = document.getElementById('imageContainer');
            const containerRect = container.getBoundingClientRect();
            const prevFocusX = clientX - containerRect.left;
            const prevFocusY = clientY - containerRect.top;

            this.zoomLevel = newZoomLevel;

            // Apply the zoom transform with position adjustment
            const centerX = containerRect.width / 2;
            const centerY = containerRect.height / 2;

            // Calculate offset needed to keep zoom center at mouse position
            const offsetX = (prevFocusX - centerX) * (1 - this.zoomLevel);
            const offsetY = (prevFocusY - centerY) * (1 - this.zoomLevel);

            // Apply both scale and translation
            this.setZoomTranslate(newZoomLevel, offsetX, offsetY);

            // Set flag to indicate we're zooming
            this.isZooming = true;
        }
        return newZoomLevel;
    }

    /**
     * Handle pinch-to-zoom gestures for mobile devices
     */
    handlePinch(e) {
        if (e.touches.length === 2) {
            e.preventDefault();
            
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            
            // Calculate distance between touches
            const currentDistance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) + 
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );
            
            // For pinch zoom, we'll calculate the zoom level based on the change in distance
            if (this.startPinchDistance) {
                const centerX = (touch1.clientX + touch2.clientX) / 2;
                const centerY = (touch1.clientY + touch2.clientY) / 2;
                const zoomFactor = currentDistance / this.startPinchDistance;
                const newZoomLevel = this.zoomLevel * zoomFactor;
                
                this.doZoom(newZoomLevel, centerX, centerY);
            }
            
            // Store initial distance for next calculation
            this.startPinchDistance = currentDistance;
        } else if (e.touches.length === 1 && this.isZooming) {
            // Handle one-finger drag when image is zoomed
            e.preventDefault();
            this.handleImageDrag(e.touches[0]);
        }
    }

    /**
     * Handle dragging of the zoomed image with one finger
     */
    handleImageDrag(touch) {
        if (!this.isZooming || this.zoomLevel <= 1) return;
        
        // Calculate movement delta
        if (this.lastTouchX !== undefined && this.lastTouchY !== undefined) {
            const deltaX = (touch.clientX - this.lastTouchX) / this.zoomLevel;
            const deltaY = (touch.clientY - this.lastTouchY) / this.zoomLevel;
            
            // Apply the updated transform - preserve scale and update only translation
            this.setZoomTranslate(this.zoomLevel, this.translateX + deltaX, this.translateY + deltaY);
        }
        
        // Store current touch position for next movement calculation
        this.lastTouchX = touch.clientX;
        this.lastTouchY = touch.clientY;
    }

    setZoomTranslate(zoomLevel, translateX, translateY) {
        this.zoomLevel = zoomLevel;
        this.translateX = translateX;
        this.translateY = translateY
        this.currentImage.style.transform = `scale(${zoomLevel}) translate(${translateX}px, ${translateY}px)`;
    }

    /**
     * Initialize pinch-to-zoom state when touch starts
     */
    handleTouchStart(e) {
        if (e.touches.length === 2) {
            // Store initial distance for pinch zoom
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            
            this.startPinchDistance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) + 
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );
        } else if (e.touches.length === 1) {
            // Handle one-finger drag for zoomed images
            this.lastTouchX = e.touches[0].clientX;
            this.lastTouchY = e.touches[0].clientY;
            this.isDragging = true;
        } else {
            // Handle regular touch start for swipe
            this.touchStartX = e.touches[0].clientX;
        }
    }

    /**
     * Reset pinch state when touch ends
     */
    handleTouchEnd() {
        this.touchStartX = null;
        this.startPinchDistance = null;
        this.lastTouchX = undefined;
        this.lastTouchY = undefined;
        this.isDragging = false;
    }

    resetZoom() {
        const image = this.currentImage;
        if(!image) return;
        this.zoomLevel = 1;
        image.style.transform = 'scale(1)';
        image.style.transformOrigin = 'center center';
    }
}

// Initialize the gallery app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new GalleryApp();
});