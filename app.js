class GalleryApp {
    constructor() {
        this.images = [];
        this.currentIndex = 0;
        this.isSlideshowPlaying = false;
        this.thumbnails = [];
        this.hoverTimeout = null;
        this.fadeTimeout = null;
        this.zoomLevel = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.isZooming = false;
        this.videoStartTime = null;
        this.videoDuration = null;
        this.slideDuration = 5000;

        this.initializeElements();
        this.bindEvents();
        this.setupKeyboardNavigation();
        
        // Hide navigation controls on initial load
        this.navigationControls.style.display = 'none';
    }

    initializeElements() {
        this.dropZone = document.getElementById('dropZone');
        this.galleryContainer = document.getElementById('galleryContainer');
        this.currentImage = document.getElementById('currentImage');
        this.currentVideo = document.getElementById('currentVideo');
        this.thumbnailStrip = document.getElementById('thumbnailStrip');
        this.navigationControls = document.getElementById('navigationControls');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.zeroStateMessage = document.getElementById('zeroStateMessage');
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

        // Hover events for controls - show on mouse enter, hide after delay on mouse leave
        this.dropZone.addEventListener('mouseenter', () => this.showControls());
        this.dropZone.addEventListener('mouseleave', () => this.hideControls());
        
        // Mouse move event to show controls and reset fade timer
        this.dropZone.addEventListener('mousemove', (e) => {
            this.showControls();
            this.resetFadeTimer();
        });
        
        // Add hover events for controls themselves to prevent them from hiding
        this.thumbnailStrip.addEventListener('mouseenter', () => {
            if (this.fadeTimeout) {
                clearTimeout(this.fadeTimeout);
            }
        });
        
        this.thumbnailStrip.addEventListener('mouseleave', () => {
            this.resetFadeTimer();
        });
        
        this.navigationControls.addEventListener('mouseenter', () => {
            if (this.fadeTimeout) {
                clearTimeout(this.fadeTimeout);
            }
        });
        
        this.navigationControls.addEventListener('mouseleave', () => {
            this.resetFadeTimer();
        });

        // Touch events for mobile
        this.galleryContainer.addEventListener('touchstart', this.handleTouchStart.bind(this), false);
        this.galleryContainer.addEventListener('touchmove', this.handlePinch.bind(this), false);
        this.galleryContainer.addEventListener('touchend', this.handleTouchEnd.bind(this), false);

        // Mouse wheel zooming
        this.galleryContainer.addEventListener('wheel', this.handleMouseZoom.bind(this), { passive: false });

        // Reset zoom when clicking on image/video
        this.currentImage.addEventListener('click', () => {
            // Skip zoom reset for videos
            if (this.images.length > 0 && this.images[this.currentIndex].type === 'video') {
                return;
            }

            if (this.isZooming) {
                this.resetZoom();
                this.isZooming = false;
            }
        });

        // Handle video end events for slideshow functionality
        this.currentVideo.addEventListener('ended', () => {
            // Only advance in slideshow mode
            if (this.isSlideshowPlaying) {
                // Only navigate to next slide if at least 3 seconds have passed since video start
                if (Date.now() - this.videoStartTime >= this.slideDuration) {
                    this.navigateToNext();
                }
                else {
                    this.currentVideo.play();
                }
            }
        });

        // Handle video loaded metadata to get duration
        this.currentVideo.addEventListener('loadedmetadata', () => {
            if (this.images.length > 0 && this.images[this.currentIndex].type === 'video') {
                this.videoDuration = this.currentVideo.duration;
            }
        });

        // Handle video play event to track when it starts
        this.currentVideo.addEventListener('play', () => {
            if (this.images.length > 0 && this.images[this.currentIndex].type === 'video' && this.videoStartTime == null) {
                this.videoStartTime = Date.now();
            }
        });

        // Handle video loading errors
        this.currentVideo.addEventListener('error', e => {
            console.error('Error loading video', e);
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
        // Create an array to store file processing data with their original index
        const filesData = [];
        
        Array.from(files).forEach((file, index) => {
            if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
                const reader = new FileReader();

                reader.onload = (e) => {
                    const mediaData = {
                        src: e.target.result,
                        name: file.name,
                        type: file.type.startsWith('image/') ? 'image' : 'video',
                        originalIndex: index  // Track the original order
                    };

                    // For videos, we'll generate a thumbnail
                    if (mediaData.type === 'video') {
                        mediaData.thumbnail = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect width="120" height="80" fill="%23333"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23fff">VIDEO</text></svg>';
                    }

                    // Store the mediaData with its original index
                    filesData.push(mediaData);
                    
                    // Process all files in order when they're all done
                    if (filesData.length === files.length) {
                        // Sort by original index to maintain order
                        filesData.sort((a, b) => a.originalIndex - b.originalIndex);
                        
                        // Add files in correct order
                        filesData.forEach(mediaData => {
                            this.images.push(mediaData);
                        });
                        
                        this.updateGallery();

                        // Process thumbnails for all media items
                        const thumbnailPromises = filesData.map(mediaData => 
                            this.generateThumbnail(mediaData)
                        );
                        
                        Promise.all(thumbnailPromises).then(() => {
                            this.updateGallery();
                            
                            // If this is the first image, show it
                            if (this.images.length === 1) {
                                this.showCurrentImage();
                                this.hideZeroStateMessage();
                            } else {
                                // If there are already images, navigate to the newly added one
                                this.navigateToImage(this.images.length - 1);
                            }
                        });
                    }
                };

                reader.readAsDataURL(file);
            }
        });
        
        // Handle case when no valid files are dropped
        if (files.length === 0) {
            return;
        }
    }

    generateThumbnail(mediaData, seekTime = 1.0) {
        return new Promise((resolve, reject) => {
            if (!mediaData || !mediaData.src || !mediaData.type) {
                return reject(new Error("Invalid mediaData object"));
            }

            // Helper: draw a square-cropped image/video frame into a canvas
            function drawSquareThumbnail(source) {
                const w = source.videoWidth || source.width;
                const h = source.videoHeight || source.height;
                const size = Math.min(w, h);

                const sx = (w - size) / 2;
                const sy = (h - size) / 2;

                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');

                // Draw the square crop
                ctx.drawImage(source, sx, sy, size, size, 0, 0, size, size);

                // Draw the blue play button
                const btnSize = size * 0.22; // scales with thumbnail size
                const padding = size * 0.05;
                const x = padding;
                const y = size - btnSize - padding;

                ctx.fillStyle = "rgba(0, 122, 255, 0.9)"; // blue
                ctx.beginPath();
                ctx.arc(x + btnSize / 2, y + btnSize / 2, btnSize / 2, 0, Math.PI * 2);
                ctx.fill();

                // White triangle
                ctx.fillStyle = "white";
                ctx.beginPath();
                const triX = x + btnSize * 0.38;
                const triY = y + btnSize * 0.28;
                ctx.moveTo(triX, triY);
                ctx.lineTo(triX, triY + btnSize * 0.44);
                ctx.lineTo(triX + btnSize * 0.38, triY + btnSize * 0.22);
                ctx.closePath();
                ctx.fill();

                return canvas;
            }

            // --- IMAGE CASE --------------------------------------------------------
            if (mediaData.type === 'image') {
                mediaData.thumbnail = mediaData.src;
                resolve(mediaData);
                return;
            }

            // --- VIDEO CASE --------------------------------------------------------
            if (mediaData.type === 'video') {
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.muted = true;
                video.src = mediaData.src;
                video.playsInline = true;

                video.addEventListener('loadedmetadata', () => {
                    const t = Math.min(seekTime, Math.max(0, video.duration - 0.1));
                    try {
                        video.currentTime = t;
                    } catch {
                        setTimeout(() => (video.currentTime = t), 200);
                    }
                });

                video.addEventListener('seeked', () => {
                    try {
                        const canvas = drawSquareThumbnail(video);
                        canvas.toBlob(
                            blob => {
                                if (blob) {
                                    mediaData.thumbnail = URL.createObjectURL(blob);
                                    resolve(mediaData);
                                } else {
                                    mediaData.thumbnail = canvas.toDataURL("image/png");
                                    resolve(mediaData);
                                }
                            },
                            "image/png",
                            0.9
                        );
                    } catch (err) {
                        reject(err);
                    }
                });

                video.addEventListener('error', () => {
                    reject(new Error("Video failed to load"));
                });

                return;
            }

            reject(new Error("Unsupported media type"));
        });
    }

    updateGallery() {
        // Clear existing thumbnails
        this.thumbnailStrip.innerHTML = '';
        this.thumbnails = [];

        // Create new thumbnails
        this.images.forEach((image, index) => {
            const thumbnail = document.createElement('img');

            // Use thumbnail if available, otherwise use original source
            thumbnail.src = image.thumbnail || image.src;
            thumbnail.alt = image.name;
            thumbnail.className = 'thumbnail';
            thumbnail.dataset.index = index;

            thumbnail.addEventListener('click', () => {
                this.navigateToImage(index);
            });

            // Handle middle mouse button click to remove item from playlist
            thumbnail.addEventListener('mouseup', (e) => {
                if (e.button === 1) { // Middle mouse button
                    e.preventDefault();
                    this.removeImageFromPlaylist(index);
                }
            });

            this.thumbnailStrip.appendChild(thumbnail);
            this.thumbnails.push(thumbnail);
        });

        // Update active thumbnail
        this.updateActiveThumbnail();
        
        // Show or hide zero state message based on whether there are images
        if (this.images.length === 0) {
            this.showZeroStateMessage();
        } else {
            this.hideZeroStateMessage();
        }
        
        // Hide navigation controls if there are fewer than 2 images
        if (this.images.length < 2) {
            this.navigationControls.style.display = 'none';
        } else {
            this.navigationControls.style.display = 'flex';
        }
    }

    showCurrentImage() {
        if (this.images.length > 0) {
            const currentMedia = this.images[this.currentIndex];

            if (currentMedia.type === 'video') {
                // Show video element and hide image
                this.currentVideo.src = currentMedia.src;
                this.currentVideo.alt = currentMedia.name;
                this.currentVideo.style.display = 'block';
                this.currentImage.style.display = 'none';

                // Enable auto-play, loop, and mute for videos
                this.currentVideo.loop = !this.isSlideshowPlaying;
                if (this.isSlideshowPlaying) this.currentVideo.play();
                this.currentVideo.muted = true;

                // Reset video duration tracking
                this.videoDuration = null;

                // Disable zoom for videos
                this.isZooming = false;
                this.resetZoom();
            } else {
                // Show image element and hide video
                this.currentImage.src = currentMedia.src;
                this.currentImage.alt = currentMedia.name;
                this.currentImage.style.display = 'block';
                this.currentVideo.style.display = 'none';

                // Disable auto-play, loop, and mute for images
                this.currentVideo.pause();

                // Reset zoom level when changing images
                this.resetZoom();
            }

            // Update active thumbnail
            this.updateActiveThumbnail();
            this.queueAutoAdvance();
            
            // Hide navigation controls if there are fewer than 2 images
            if (this.images.length < 2) {
                this.navigationControls.style.display = 'none';
            } else {
                this.navigationControls.style.display = 'flex';
            }
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
        this.videoStartTime = null;
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

        this.queueAutoAdvance();
        this.currentVideo.loop = false;
    }

    queueAutoAdvance() {
        if (!this.isSlideshowPlaying) return;
        if (this.images[this.currentIndex].type !== 'image') return;
        let index = this.currentIndex;
        setTimeout(() => {
            if (!this.isSlideshowPlaying) return;
            if (this.currentIndex === index)
                this.navigateToNext();
        }, this.slideDuration);
    }

    stopSlideshow() {
        this.isSlideshowPlaying = false;
        this.playPauseBtn.textContent = '▶';
        this.playPauseBtn.classList.remove('playing');
        this.currentVideo.loop = true;
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
        
        // Clear fade timeout to prevent hiding while hovering
        if (this.fadeTimeout) {
            clearTimeout(this.fadeTimeout);
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
    
    resetFadeTimer() {
        // Clear any existing fade timeout
        if (this.fadeTimeout) {
            clearTimeout(this.fadeTimeout);
        }
        
        // Set a new timeout to hide controls after 3 seconds of inactivity
        this.fadeTimeout = setTimeout(() => {
            // Only hide if we're not currently hovering over the controls
            if (!this.thumbnailStrip.matches(':hover') && !this.navigationControls.matches(':hover')) {
                this.thumbnailStrip.classList.remove('visible');
                this.navigationControls.classList.remove('visible');
            }
        }, 1000);
    }

    // Touch swipe handling for mobile
    handleTouchStart(e) {
        this.touchStartX = e.touches[0].clientX;
    }

    handleMouseZoom(e) {
        e.preventDefault();

        // Skip zoom for videos
        if (this.images.length > 0 && this.images[this.currentIndex].type === 'video') {
            return;
        }

        let clientX = e.clientX;
        let clientY = e.clientY;

        // Calculate zoom factor (adjust the multiplier as needed for sensitivity)
        const zoomIntensity = 0.1;
        const delta = e.deltaY > 0 ? -zoomIntensity : zoomIntensity;

        this.doZoom(this.zoomLevel + delta, clientX, clientY);
    }

    doZoom(newZoomLevel, clientX, clientY) {
        const image = this.currentImage;
        if (!image) return;

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
        // Skip pinch zoom for videos
        if (this.images.length > 0 && this.images[this.currentIndex].type === 'video') {
            return;
        }

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
        // Skip dragging for videos
        if (this.images.length > 0 && this.images[this.currentIndex].type === 'video') {
            return;
        }

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
        // Skip touch start for videos
        if (this.images.length > 0 && this.images[this.currentIndex].type === 'video') {
            return;
        }

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
        if (!image) return;
        this.zoomLevel = 1;
        image.style.transform = 'scale(1)';
        image.style.transformOrigin = 'center center';
    }

    removeImageFromPlaylist(index) {
        // Remove the item from the playlist
        this.images.splice(index, 1);

        // If we're removing the currently displayed item
        if (index === this.currentIndex) {
            // If there are no more items, clear the display
            if (this.images.length === 0) {
                if (this.currentImage.src !== '') {
                    this.currentImage.src = '';
                    this.currentImage.style.display = 'none';
                }
                if (this.currentVideo.src !== '') {
                    this.currentVideo.src = '';
                    this.currentVideo.style.display = 'none';
                }
                this.showZeroStateMessage();
            }
            // If there are items left, navigate to the next item or previous if at end
            else {
                // If we're removing an item after the current one, currentIndex stays the same
                // If we're removing the current item, we need to adjust index
                if (index >= this.images.length) {
                    this.currentIndex = this.images.length - 1;
                }

                // Show the next image in the playlist
                this.showCurrentImage();
            }
        }
        // If removing an item that comes before the current one, adjust currentIndex
        else if (index < this.currentIndex) {
            this.currentIndex--;
        }

        // Update the gallery to reflect the removal
        this.updateGallery();
        
        // Hide navigation controls if there are fewer than 2 images
        if (this.images.length < 2) {
            this.navigationControls.style.display = 'none';
        } else {
            this.navigationControls.style.display = 'flex';
        }
    }
    
    showZeroStateMessage() {
        if (this.zeroStateMessage) {
            this.zeroStateMessage.style.display = 'block';
        }
    }
    
    hideZeroStateMessage() {
        if (this.zeroStateMessage) {
            this.zeroStateMessage.style.display = 'none';
        }
    }
}

// Initialize the gallery app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new GalleryApp();
});