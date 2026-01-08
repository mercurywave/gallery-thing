class GalleryApp {
    constructor() {
        this.images = [];
        this.currentIndex = 0;
        this.isSlideshowPlaying = false;
        this.slideshowInterval = null;
        this.thumbnails = [];
        this.hoverTimeout = null;
        
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
        this.galleryContainer.addEventListener('touchmove', this.handleTouchMove.bind(this), false);
        this.galleryContainer.addEventListener('touchend', this.handleTouchEnd.bind(this), false);
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
            
            switch(e.key) {
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
    
    handleTouchMove(e) {
        if (!this.touchStartX) return;
        
        const touchX = e.touches[0].clientX;
        const diffX = this.touchStartX - touchX;
        
        // Only trigger navigation for significant horizontal swipes
        if (Math.abs(diffX) > 50) {
            if (diffX > 0) {
                this.navigateToNext();
            } else {
                this.navigateToPrevious();
            }
            this.touchStartX = null; // Reset to prevent multiple triggers
        }
    }
    
    handleTouchEnd() {
        this.touchStartX = null;
    }
}

// Initialize the gallery app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new GalleryApp();
});