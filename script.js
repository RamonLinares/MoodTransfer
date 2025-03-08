// Remove the debug code at the top
// console.log('Script loading...');

// Remove the dummy updateMobileUI function
// function updateMobileUI() {
//     console.error('updateMobileUI was called from:', new Error().stack);
// }

class LUTGenerator {
    constructor() {
        this.referenceImage = null;
        this.targetImage = null;
        this.lut = null;
        
        this.initElements();
        this.bindEvents();
        this.applyIOSStyleAnimations();
        this.initDarkMode();
        
        // Add enhanced class to result container
        document.getElementById('resultContainer').classList.add('enhanced-result-container');
        
        // Call mobile UI update after DOM is ready
        setTimeout(() => {
            this.updateMobileUI();
        }, 100);
    }
    
    initElements() {
        // Main elements
        this.referenceInput = document.getElementById('referenceInput');
        this.referencePreview = document.getElementById('referencePreview');
        this.referenceContainer = document.getElementById('referenceContainer');
        
        this.targetInput = document.getElementById('targetInput');
        this.targetPreview = document.getElementById('targetPreview');
        this.targetContainer = document.getElementById('targetContainer');
        
        this.resultPreview = document.getElementById('resultPreview');
        this.emptyResult = document.getElementById('emptyResult');
        
        this.generateButton = document.getElementById('generateButton');
        this.downloadButton = document.getElementById('downloadButton');
        
        // Intensity slider for color transformation
        this.colorIntensity = document.getElementById('colorIntensity');
        
        // Mobile elements
        this.mobileReferenceBtn = document.getElementById('mobileReferenceBtn');
        this.mobileTargetBtn = document.getElementById('mobileTargetBtn');
        this.mobileGenerateBtn = document.getElementById('mobileGenerateBtn');
        this.mobileDownloadBtn = document.getElementById('mobileDownloadBtn');
        
        // Dark mode toggle
        this.darkModeToggle = document.getElementById('darkModeToggle');
        
        // Hide quality button since it's not needed anymore
        const qualityMenuButton = document.getElementById('qualityMenuButton');
        if (qualityMenuButton) {
            qualityMenuButton.style.display = 'none';
        }

        // Add anti-banding options to the UI
        const optionsContainer = document.querySelector('.box');
        if (optionsContainer) {
            const antiBandingControls = this.createAntiBandingControls();
            optionsContainer.appendChild(antiBandingControls);
        }

        // Initialize mobile UI
        this.initMobileQualityUI();
    }
    
    initDarkMode() {
        // Check for saved theme preference or use system preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.body.classList.toggle('is-dark-mode', savedTheme === 'dark');
            this.updateDarkModeIcon(savedTheme === 'light');
        } else {
            // Use system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.body.classList.toggle('is-dark-mode', prefersDark);
            this.updateDarkModeIcon(!prefersDark);
        }
    }
    
    updateDarkModeIcon(isLight) {
        // Update the icon based on current theme
        if (isLight) {
            this.darkModeToggle.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                </svg>
            `;
        } else {
            this.darkModeToggle.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="4"></circle>
                    <path d="M12 2v2"></path>
                    <path d="M12 20v2"></path>
                    <path d="m4.93 4.93 1.41 1.41"></path>
                    <path d="m17.66 17.66 1.41 1.41"></path>
                    <path d="M2 12h2"></path>
                    <path d="M20 12h2"></path>
                    <path d="m6.34 17.66-1.41 1.41"></path>
                    <path d="m19.07 4.93-1.41 1.41"></path>
                </svg>
            `;
        }
    }
    
    toggleDarkMode() {
        const isDarkMode = document.body.classList.toggle('is-dark-mode');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        this.updateDarkModeIcon(!isDarkMode);
        
        // Reset any active states on mobile menu items when toggling dark mode
        if (this.mobileGenerateBtn) {
            this.mobileGenerateBtn.blur();
        }
        if (this.mobileReferenceBtn) {
            this.mobileReferenceBtn.blur();
        }
        if (this.mobileTargetBtn) {
            this.mobileTargetBtn.blur();
        }
        if (this.mobileDownloadBtn) {
            this.mobileDownloadBtn.blur();
        }
        
        // Show toast notification
        this.showToast(isDarkMode ? 'Dark mode activated' : 'Light mode activated');
    }
    
    showToast(message) {
        // Remove existing toast if any
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        // Create and show new toast
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Remove toast after animation completes
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    bindEvents() {
        // Reference image upload
        if (this.referenceInput) {
            this.referenceInput.addEventListener('change', (e) => this.handleImageUpload(e, true));
        }
        
        // Target image upload
        if (this.targetInput) {
            this.targetInput.addEventListener('change', (e) => this.handleImageUpload(e, false));
        }
        
        // Generate button
        if (this.generateButton) {
            this.generateButton.addEventListener('click', () => this.generateLUT());
        }
        
        // Download button
        if (this.downloadButton) {
            this.downloadButton.addEventListener('click', () => this.downloadLUT());
        }
        
        // Handle slider changes
        if (this.colorIntensity) {
            // Add handler for the slider
            const handleSliderChange = () => {
                console.log('Slider changed, value:', this.colorIntensity.value);
                
                // Always reset the result when slider is moved
                if (this.lut) {
                    console.log('Resetting result because LUT exists');
                    
                    // Clear the result and hide download buttons
                    this.resultPreview.innerHTML = '';
                    this.resultPreview.style.display = 'none';
                    this.emptyResult.style.display = 'flex';
                    
                    // Update the empty result message
                    this.emptyResult.innerHTML = `
                        <span class="icon is-large">
                            <i class="fas fa-magic fa-2x"></i>
                        </span>
                        <p class="mt-3">Click here to generate</p>
                    `;
                    
                    // Reset result container
                    const resultContainer = document.getElementById('resultContainer');
                    if (resultContainer) {
                        resultContainer.classList.remove('has-result');
                    }
                    
                    if (this.downloadButton) {
                        this.downloadButton.style.display = 'none';
                    }
                    
                    if (this.mobileDownloadBtn) {
                        this.mobileDownloadBtn.style.display = 'none';
                    }
                    
                    // Reset LUT
                    this.lut = null;
                }
            };
            
            // Add multiple events for maximum compatibility
            this.colorIntensity.addEventListener('input', () => {
                // Just update the originalSliderValue during movement, but don't clear the result
                this.originalSliderValue = this.colorIntensity.value;
            });
            
            // Only clear the result when the user stops moving the slider
            this.colorIntensity.addEventListener('change', handleSliderChange);
            this.colorIntensity.addEventListener('mouseup', handleSliderChange);
            
            // Store the original slider value to detect changes
            this.originalSliderValue = this.colorIntensity.value;
            
            // Add an interval check to detect slider changes (as a backup)
            setInterval(() => {
                // Only check if there's a significant difference to avoid minor floating point issues
                if (this.lut && Math.abs(this.originalSliderValue - this.colorIntensity.value) > 0.1) {
                    console.log('Interval detected slider change from', this.originalSliderValue, 'to', this.colorIntensity.value);
                    this.originalSliderValue = this.colorIntensity.value;
                    
                    // Call the same handler used for direct events
                    handleSliderChange();
                }
            }, 1000); // Check every second (reduced frequency)
        }
        
        // Mobile menu buttons
        if (this.mobileGenerateBtn) {
            this.mobileGenerateBtn.addEventListener('click', () => {
                if (!this.mobileGenerateBtn.classList.contains('disabled')) {
                    this.generateLUT();
                    // Reset active state after click
                    setTimeout(() => this.mobileGenerateBtn.blur(), 100);
                }
            });
        }
        
        if (this.mobileDownloadBtn) {
            this.mobileDownloadBtn.addEventListener('click', () => {
                if (!this.mobileDownloadBtn.classList.contains('disabled')) {
                    this.downloadLUT();
                    // Reset active state after click
                    setTimeout(() => this.mobileDownloadBtn.blur(), 100);
                }
            });
        }
        
        // Mobile upload buttons
        if (this.mobileReferenceBtn) {
            this.mobileReferenceBtn.addEventListener('click', () => {
                // Scroll to top smoothly first
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Small delay before opening file dialog
                setTimeout(() => {
                    this.referenceInput.click();
                }, 300);
                
                // Reset active state after click
                setTimeout(() => this.mobileReferenceBtn.blur(), 100);
            });
        }
        
        if (this.mobileTargetBtn) {
            this.mobileTargetBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => {
                    this.targetInput.click();
                }, 300);
                
                // Reset active state after click
                setTimeout(() => this.mobileTargetBtn.blur(), 100);
            });
        }
        
        // Make upload labels clickable
        document.querySelectorAll('.upload-label').forEach(label => {
            const container = label.closest('.upload-container');
            if (container) {
                const isReference = container.id === 'referenceContainer';
                label.addEventListener('click', () => {
                    if (isReference && this.referenceInput) {
                        this.referenceInput.click();
                    } else if (!isReference && this.targetInput) {
                        this.targetInput.click();
                    }
                });
            }
        });
        
        // Result container click for generation
        const resultContainer = document.getElementById('resultContainer');
        if (resultContainer) {
            resultContainer.addEventListener('click', (e) => {
                // If we have both reference and target images
                if (this.referenceImage && this.targetImage) {
                    // If the click is directly on the result preview or its child image, let its own click handler handle it
                    if (e.target.closest('#resultPreview') || e.target.tagName === 'IMG') {
                        return;
                    }
                    
                    // If we already have a result and it's visible, download it
                    if (this.lut && this.resultPreview && this.resultPreview.style.display === 'flex') {
                        this.downloadResultImage();
                    } else {
                        // Otherwise generate a new result
                        this.generateLUT();
                    }
                    
                    // Update the generate button state to ensure hover text is correct
                    this.updateGenerateButton();
                } else if (this.referenceImage || this.targetImage) {
                    // If we have at least one image, show a toast message
                    this.showToast('Please upload both reference and target images');
                }
            });
        }
        
        // Dark mode toggle
        if (this.darkModeToggle) {
            this.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
        }
        
        // Window resize event to update image styling
        window.addEventListener('resize', () => {
            this.updateImageStyling();
        });
    }
    
    handleImageUpload(e, isReference) {
        const file = e.target.files[0];
        
        if (!file) return;
        
        // Check if file is an image
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }
        
        // Use FileReader to read the file
        const reader = new FileReader();
        reader.onload = (e) => {
            // Create an image element to get dimensions
            const img = new Image();
            img.onload = () => {
                if (isReference) {
                    this.referenceImage = img;
                    this.referencePreview.innerHTML = '';
                    const imgClone = img.cloneNode();
                    
                    // Apply consistent styling for all screen sizes
                    this.applyConsistentImageStyling(imgClone);
                    
                    this.referencePreview.appendChild(imgClone);
                    this.referencePreview.classList.add('active');
                    
                    // Make the image clickable to re-upload
                    this.referencePreview.style.cursor = 'pointer';
                    this.referencePreview.onclick = () => this.referenceInput.click();
                    
                    // Hide upload label
                    document.querySelector('#referenceContainer .upload-label').style.display = 'none';
                    document.getElementById('referenceContainer').classList.add('has-image');
                } else {
                    this.targetImage = img;
                    this.targetPreview.innerHTML = '';
                    const imgClone = img.cloneNode();
                    
                    // Apply consistent styling for all screen sizes
                    this.applyConsistentImageStyling(imgClone);
                    
                    this.targetPreview.appendChild(imgClone);
                    this.targetPreview.classList.add('active');
                    
                    // Make the image clickable to re-upload
                    this.targetPreview.style.cursor = 'pointer';
                    this.targetPreview.onclick = () => this.targetInput.click();
                    
                    // Hide upload label
                    document.querySelector('#targetContainer .upload-label').style.display = 'none';
                    document.getElementById('targetContainer').classList.add('has-image');
                }
                
                // Reset result state when a new image is uploaded
                // Always reset the LUT when any image is uploaded to ensure consistency
                this.resetResultState(false);
                
                this.updateGenerateButton();
                
                // Update image styling based on current screen size
                this.updateImageStyling();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    updateGenerateButton() {
        const enabled = this.referenceImage && this.targetImage;
        if (this.generateButton) {
            this.generateButton.disabled = !enabled;
        }
        
        // Update mobile button as well
        if (enabled) {
            if (this.mobileGenerateBtn) {
                this.mobileGenerateBtn.classList.remove('disabled');
                
                // Make result container appear clickable when both images are available
                const resultContainer = document.getElementById('resultContainer');
                resultContainer.classList.add('clickable');
                resultContainer.style.cursor = 'pointer';
            }
        } else {
            if (this.mobileGenerateBtn) {
                this.mobileGenerateBtn.classList.add('disabled');
                
                // Remove clickable appearance when images are not available
                const resultContainer = document.getElementById('resultContainer');
                resultContainer.classList.remove('clickable');
                resultContainer.style.cursor = '';
                resultContainer.onclick = null;
            }
        }
    }
    
    async generateLUT() {
        try {
            // Update the original slider value to prevent false detection of changes
            this.originalSliderValue = this.colorIntensity.value;
            
            if (!this.referenceImage || !this.targetImage) {
                this.showToast('Please upload both reference and target images');
                return;
            }
            
            // Show loading state
            if (this.generateButton) {
                this.generateButton.classList.add('is-loading');
            }
            this.emptyResult.innerHTML = `
                <div class="has-text-centered">
                    <span class="icon is-large">
                        <i class="fas fa-spinner fa-pulse fa-2x"></i>
                    </span>
                    <p class="mt-3">Generating...</p>
                </div>
            `;
            
            // Create canvases for processing
            const referenceCanvas = this.createCanvas(this.referenceImage);
            const targetCanvas = this.createCanvas(this.targetImage);
            
            // Calculate LUT
            try {
                this.lut = await this.calculateLUT(referenceCanvas, targetCanvas);
            } catch (error) {
                console.error('Error calculating LUT:', error);
                this.showToast('Error generating color transformation. Please try different images.');
                if (this.generateButton) {
                    this.generateButton.classList.remove('is-loading');
                }
                
                // Reset to the "click to generate" state
                this.emptyResult.innerHTML = `
                    <span class="icon is-large">
                        <i class="fas fa-magic fa-2x"></i>
                    </span>
                    <p class="mt-3">Click here to generate</p>
                `;
                return;
            }
            
            // Apply LUT to target image
            const resultCanvas = this.applyLUT(targetCanvas, this.lut);
            
            // Create result image
            const resultImg = new Image();
            resultImg.onload = () => {
                // Clear loading state
                if (this.generateButton) {
                    this.generateButton.classList.remove('is-loading');
                }
                
                // Show result
                this.resultPreview.innerHTML = '';
                this.resultPreview.appendChild(resultImg);
                this.resultPreview.style.display = 'flex';
                
                // Update empty result text before hiding it
                // This ensures that if the result state is reset, the text will be correct
                this.emptyResult.innerHTML = `
                    <span class="icon is-large">
                        <i class="fas fa-download fa-2x"></i>
                    </span>
                    <p class="mt-3">Click here to download LUT</p>
                `;
                this.emptyResult.style.display = 'none';
                
                // Apply consistent styling
                this.applyConsistentImageStyling(resultImg);
                
                // Make result clickable to download
                this.resultPreview.style.cursor = 'pointer';
                this.resultPreview.onclick = () => this.downloadResultImage();
                
                // Show download button
                if (this.downloadButton) {
                    this.downloadButton.style.display = 'block';
                }
                
                if (this.mobileDownloadBtn) {
                    this.mobileDownloadBtn.style.display = 'flex';
                }
                
                // Update generate button state
                this.updateGenerateButton();
                
                // Show success message
                this.showToast('Color transformation applied successfully!');
            };
            
            resultImg.src = resultCanvas.toDataURL('image/jpeg', 0.95);
        } catch (error) {
            console.error('Error generating color transformation:', error);
            this.showToast('Error generating color transformation. Please try again.');
            if (this.generateButton) {
                this.generateButton.classList.remove('is-loading');
            }
            
            // Reset to the "click to generate" state
            this.emptyResult.innerHTML = `
                <span class="icon is-large">
                    <i class="fas fa-magic fa-2x"></i>
                </span>
                <p class="mt-3">Click here to generate</p>
            `;
        }
    }
    
    createCanvas(img) {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        return canvas;
    }
    
    async calculateLUT(referenceCanvas, targetCanvas) {
        // Get image data from canvases
        const refCtx = referenceCanvas.getContext('2d', { willReadFrequently: true });
        const targetCtx = targetCanvas.getContext('2d', { willReadFrequently: true });
        
        const refData = refCtx.getImageData(0, 0, referenceCanvas.width, referenceCanvas.height);
        const targetData = targetCtx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
        
        // Calculate image statistics for both images
        const refStats = this.calculateImageStats(refData.data);
        const targetStats = this.calculateImageStats(targetData.data);
        
        // Create LUT
        const lutSize = 33;
        const lut = new Float32Array(lutSize * lutSize * lutSize * 3);
        
        // Get the intensity adjustment value (0-100)
        const intensity = this.colorIntensity.value / 100;
        
        // Fill LUT with improved color transformation
        let i = 0;
        for (let r = 0; r < lutSize; r++) {
            for (let g = 0; g < lutSize; g++) {
                for (let b = 0; b < lutSize; b++) {
                    const r_norm = r / (lutSize - 1);
                    const g_norm = g / (lutSize - 1);
                    const b_norm = b / (lutSize - 1);
                    
                    // Apply histogram matching for each channel
                    let r_matched = this.histogramMatch(r_norm, targetStats.r, refStats.r);
                    let g_matched = this.histogramMatch(g_norm, targetStats.g, refStats.g);
                    let b_matched = this.histogramMatch(b_norm, targetStats.b, refStats.b);
                    
                    // Check if both images are black and white
                    if (this.checkIfImageIsBW(refData.data) && this.checkIfImageIsBW(targetData.data)) {
                        // For B&W images, use luminance-based matching
                        const luminance = 0.2126 * r_matched + 0.7152 * g_matched + 0.0722 * b_matched;
                        r_matched = g_matched = b_matched = luminance;
                    }
                    
                    // Apply intensity adjustment
                    // Base intensity effect - how much of the original color to keep
                    let intensityFactor = intensity;
                    
                    // Add subtle dithering to prevent banding
                    const noise = (Math.random() - 0.5) * 0.02;
                    intensityFactor = Math.min(1, Math.max(0, intensityFactor + noise));
                    
                    // Smooth interpolation between original and transformed colors
                    r_matched = this.smoothLerp(r_matched, r_norm, intensityFactor);
                    g_matched = this.smoothLerp(g_matched, g_norm, intensityFactor);
                    b_matched = this.smoothLerp(b_matched, b_norm, intensityFactor);
                    
                    // Apply tone curve enhancement
                    r_matched = this.toneCurve(r_matched);
                    g_matched = this.toneCurve(g_matched);
                    b_matched = this.toneCurve(b_matched);
                    
                    // Store in LUT
                    lut[i] = r_matched;
                    lut[i + 1] = g_matched;
                    lut[i + 2] = b_matched;
                    i += 3;
                }
            }
        }
        
        return lut;
    }
    
    calculateHistograms(imageData) {
        const histR = new Array(256).fill(0);
        const histG = new Array(256).fill(0);
        const histB = new Array(256).fill(0);
        
        for (let i = 0; i < imageData.length; i += 4) {
            histR[imageData[i]]++;
            histG[imageData[i + 1]]++;
            histB[imageData[i + 2]]++;
        }
        
        return { r: histR, g: histG, b: histB };
    }
    
    calculateCDFs(histograms) {
        const cdfR = new Array(256).fill(0);
        const cdfG = new Array(256).fill(0);
        const cdfB = new Array(256).fill(0);
        
        const pixelCount = histograms.r.reduce((sum, val) => sum + val, 0);
        
        let sumR = 0, sumG = 0, sumB = 0;
        for (let i = 0; i < 256; i++) {
            sumR += histograms.r[i];
            sumG += histograms.g[i];
            sumB += histograms.b[i];
            
            cdfR[i] = sumR / pixelCount;
            cdfG[i] = sumG / pixelCount;
            cdfB[i] = sumB / pixelCount;
        }
        
        return { r: cdfR, g: cdfG, b: cdfB };
    }
    
    createMatchingLUTs(refCDFs, targetCDFs) {
        const lutR = new Array(256).fill(0);
        const lutG = new Array(256).fill(0);
        const lutB = new Array(256).fill(0);
        
        for (let i = 0; i < 256; i++) {
            lutR[i] = this.findClosestMatch(targetCDFs.r[i], refCDFs.r);
            lutG[i] = this.findClosestMatch(targetCDFs.g[i], refCDFs.g);
            lutB[i] = this.findClosestMatch(targetCDFs.b[i], refCDFs.b);
        }
        
        return { r: lutR, g: lutG, b: lutB };
    }
    
    findClosestMatch(value, cdf) {
        let minDiff = 1.0;
        let matchIndex = 0;
        
        for (let i = 0; i < cdf.length; i++) {
            const diff = Math.abs(cdf[i] - value);
            if (diff < minDiff) {
                minDiff = diff;
                matchIndex = i;
            }
        }
        
        return matchIndex;
    }
    
    smoothHistograms(histograms) {
        const kernel = [0.06, 0.1, 0.2, 0.3, 0.2, 0.1, 0.06]; // Gaussian-like kernel
        const kernelSize = kernel.length;
        const halfKernel = Math.floor(kernelSize / 2);
        
        const smoothedR = new Array(256).fill(0);
        const smoothedG = new Array(256).fill(0);
        const smoothedB = new Array(256).fill(0);
        
        // Apply kernel convolution to each histogram
        for (let i = 0; i < 256; i++) {
            let sumR = 0, sumG = 0, sumB = 0;
            let weightSum = 0;
            
            for (let j = -halfKernel; j <= halfKernel; j++) {
                const idx = Math.min(255, Math.max(0, i + j));
                const weight = kernel[j + halfKernel];
                
                sumR += histograms.r[idx] * weight;
                sumG += histograms.g[idx] * weight;
                sumB += histograms.b[idx] * weight;
                weightSum += weight;
            }
            
            smoothedR[i] = sumR / weightSum;
            smoothedG[i] = sumG / weightSum;
            smoothedB[i] = sumB / weightSum;
        }
        
        return { r: smoothedR, g: smoothedG, b: smoothedB };
    }
    
    smoothValue(value) {
        // Apply a subtle S-curve to enhance midtones while preserving highlights and shadows
        return 0.5 - Math.sin(Math.PI * (0.5 - value)) / (2 * Math.PI);
    }
    
    applyLUT(targetCanvas, lut) {
        const resultCanvas = document.createElement('canvas');
        resultCanvas.width = targetCanvas.width;
        resultCanvas.height = targetCanvas.height;
        const ctx = resultCanvas.getContext('2d');
        
        // Use willReadFrequently for the target canvas context
        const targetCtx = targetCanvas.getContext('2d', { willReadFrequently: true });
        const imageData = targetCtx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
        const data = imageData.data;
        const lutSize = 33;
        
        // Fixed dithering strength (80% = 16 out of 20)
        const ditheringStrength = 16 / 20 * 0.002; // Scale to appropriate range
        
        // Apply a slight warmth adjustment to match DaVinci Resolve's appearance
        for (let i = 0; i < data.length; i += 4) {
            // Get pixel values in 0-1 range
            const r = data[i] / 255;
            const g = data[i + 1] / 255;
            const b = data[i + 2] / 255;
            
            // Apply dithering to prevent banding
            const dither = (Math.random() * ditheringStrength - ditheringStrength/2);
            const r_dither = Math.min(0.999, Math.max(0.001, r + dither));
            const g_dither = Math.min(0.999, Math.max(0.001, g + dither));
            const b_dither = Math.min(0.999, Math.max(0.001, b + dither));
            
            // Always use tetrahedral interpolation
            const colorValues = this.tetrahedralInterpolation(lut, r_dither, g_dither, b_dither, lutSize);
            
            // Apply slight warmth adjustment to match DaVinci Resolve's rendering
            const warmthFactor = 1.08; // Slight boost to red/yellow
            const coolFactor = 0.95;  // Slight reduction in blue/green
            
            // Apply to the image with warmth adjustment
            data[i] = Math.round(Math.min(1, colorValues.r * warmthFactor) * 255);       // Boost red slightly
            data[i + 1] = Math.round(Math.min(1, colorValues.g * (warmthFactor * 0.98)) * 255);  // Boost green slightly less
            data[i + 2] = Math.round(colorValues.b * coolFactor * 255);                  // Reduce blue slightly
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Return the canvas directly
        return resultCanvas;
    }
    
    // Tetrahedral interpolation method (better color accuracy than trilinear)
    tetrahedralInterpolation(lut, r, g, b, lutSize) {
        // Calculate floating point indices
        const r_f = r * (lutSize - 1);
        const g_f = g * (lutSize - 1);
        const b_f = b * (lutSize - 1);
        
        // Get the integer indices of the surrounding cube
        const r0 = Math.floor(r_f);
        const g0 = Math.floor(g_f);
        const b0 = Math.floor(b_f);
        const r1 = Math.min(r0 + 1, lutSize - 1);
        const g1 = Math.min(g0 + 1, lutSize - 1);
        const b1 = Math.min(b0 + 1, lutSize - 1);
        
        // Get the fractional parts
        const r_d = r_f - r0;
        const g_d = g_f - g0;
        const b_d = b_f - b0;
        
        // Get the 8 corner values
        const c000 = this.getLUTValue(lut, r0, g0, b0, lutSize);
        const c001 = this.getLUTValue(lut, r0, g0, b1, lutSize);
        const c010 = this.getLUTValue(lut, r0, g1, b0, lutSize);
        const c011 = this.getLUTValue(lut, r0, g1, b1, lutSize);
        const c100 = this.getLUTValue(lut, r1, g0, b0, lutSize);
        const c101 = this.getLUTValue(lut, r1, g0, b1, lutSize);
        const c110 = this.getLUTValue(lut, r1, g1, b0, lutSize);
        const c111 = this.getLUTValue(lut, r1, g1, b1, lutSize);
        
        // Determine which tetrahedron we're in
        let result;
        if (r_d >= g_d) {
            if (g_d >= b_d) {
                // Tetrahedron 1: r >= g >= b
                result = {
                    r: c000.r + r_d * (c100.r - c000.r) + g_d * (c110.r - c100.r) + b_d * (c111.r - c110.r),
                    g: c000.g + r_d * (c100.g - c000.g) + g_d * (c110.g - c100.g) + b_d * (c111.g - c110.g),
                    b: c000.b + r_d * (c100.b - c000.b) + g_d * (c110.b - c100.b) + b_d * (c111.b - c110.b)
                };
            } else if (r_d >= b_d) {
                // Tetrahedron 2: r >= b >= g
                result = {
                    r: c000.r + r_d * (c100.r - c000.r) + b_d * (c101.r - c100.r) + g_d * (c111.r - c101.r),
                    g: c000.g + r_d * (c100.g - c000.g) + b_d * (c101.g - c100.g) + g_d * (c111.g - c101.g),
                    b: c000.b + r_d * (c100.b - c000.b) + b_d * (c101.b - c100.b) + g_d * (c111.b - c101.b)
                };
            } else {
                // Tetrahedron 3: b >= r >= g
                result = {
                    r: c000.r + b_d * (c001.r - c000.r) + r_d * (c101.r - c001.r) + g_d * (c111.r - c101.r),
                    g: c000.g + b_d * (c001.g - c000.g) + r_d * (c101.g - c001.g) + g_d * (c111.g - c101.g),
                    b: c000.b + b_d * (c001.b - c000.b) + r_d * (c101.b - c001.b) + g_d * (c111.b - c101.b)
                };
            }
        } else {
            if (b_d >= g_d) {
                // Tetrahedron 4: b >= g >= r
                result = {
                    r: c000.r + b_d * (c001.r - c000.r) + g_d * (c011.r - c001.r) + r_d * (c111.r - c011.r),
                    g: c000.g + b_d * (c001.g - c000.g) + g_d * (c011.g - c001.g) + r_d * (c111.g - c011.g),
                    b: c000.b + b_d * (c001.b - c000.b) + g_d * (c011.b - c001.b) + r_d * (c111.b - c011.b)
                };
            } else if (b_d >= r_d) {
                // Tetrahedron 5: g >= b >= r
                result = {
                    r: c000.r + g_d * (c010.r - c000.r) + b_d * (c011.r - c010.r) + r_d * (c111.r - c011.r),
                    g: c000.g + g_d * (c010.g - c000.g) + b_d * (c011.g - c010.g) + r_d * (c111.g - c011.g),
                    b: c000.b + g_d * (c010.b - c000.b) + b_d * (c011.b - c010.b) + r_d * (c111.b - c011.b)
                };
            } else {
                // Tetrahedron 6: g >= r >= b
                result = {
                    r: c000.r + g_d * (c010.r - c000.r) + r_d * (c110.r - c010.r) + b_d * (c111.r - c110.r),
                    g: c000.g + g_d * (c010.g - c000.g) + r_d * (c110.g - c010.g) + b_d * (c111.g - c110.g),
                    b: c000.b + g_d * (c010.b - c000.b) + r_d * (c110.b - c010.b) + b_d * (c111.b - c110.b)
                };
            }
        }
        
        return result;
    }
    
    getLUTValue(lut, r, g, b, lutSize) {
        const idx = (r * lutSize * lutSize + g * lutSize + b) * 3;
        return {
            r: lut[idx],
            g: lut[idx + 1],
            b: lut[idx + 2]
        };
    }
    
    downloadLUT() {
        if (!this.lut) return;
        
        this.downloadButton.textContent = 'Preparing...';
        
        // Create CUBE file content
        const content = this.createCubeFileContent();
        
        // Create download
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        // Create a link element but don't add it to the DOM
        const a = document.createElement('a');
        a.href = url;
        a.download = 'color_grade.cube';
        
        // Use a safer method to trigger the download
        a.style.display = 'none';
        document.body.appendChild(a);
        
        // Use a try-finally block to ensure cleanup
        try {
            a.click();
        } finally {
            // Clean up
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        }
        
        setTimeout(() => {
            this.downloadButton.textContent = 'Download LUT';
        }, 1000);
        
        // Show mobile download button
        if (this.mobileDownloadBtn) {
            this.mobileDownloadBtn.classList.remove('disabled');
        }
    }
    
    createCubeFileContent() {
        const lutSize = 33; // Standard size for most applications
        
        // Create header
        let content = 'TITLE "MoodTransfer Color Grade"\n';
        content += 'LUT_3D_SIZE ' + lutSize + '\n\n';
        
        // Add LUT data
        for (let b = 0; b < lutSize; b++) {
            for (let g = 0; g < lutSize; g++) {
                for (let r = 0; r < lutSize; r++) {
                    const idx = (r * lutSize * lutSize + g * lutSize + b) * 3;
                    content += this.lut[idx] + ' ' + this.lut[idx + 1] + ' ' + this.lut[idx + 2] + '\n';
                }
            }
        }
        
        return content;
    }
    
    applyIOSStyleAnimations() {
        // Add subtle hover effects to the image boxes
        document.querySelectorAll('.image-box').forEach(box => {
            box.addEventListener('mouseenter', () => {
                box.style.transform = 'translateY(-5px)';
                box.style.boxShadow = 'var(--shadow)';
            });
            
            box.addEventListener('mouseleave', () => {
                box.style.transform = 'translateY(0)';
                box.style.boxShadow = 'var(--card-shadow)';
            });
        });
        
        // Add subtle hover effect to buttons
        document.querySelectorAll('.button').forEach(button => {
            button.addEventListener('mouseenter', () => {
                if (!button.disabled) {
                    button.style.transform = 'scale(1.02)';
                }
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'scale(1)';
            });
        });
    }
    
    // Calculate statistical properties of the image channels
    calculateImageStats(imageData) {
        let sumR = 0, sumG = 0, sumB = 0;
        let sumSqR = 0, sumSqG = 0, sumSqB = 0;
        let minR = 255, minG = 255, minB = 255;
        let maxR = 0, maxG = 0, maxB = 0;
        
        // Initialize histograms
        const histR = new Array(256).fill(0);
        const histG = new Array(256).fill(0);
        const histB = new Array(256).fill(0);
        
        const pixelCount = imageData.length / 4;
        
        for (let i = 0; i < imageData.length; i += 4) {
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            
            // Sum for mean
            sumR += r;
            sumG += g;
            sumB += b;
            
            // Sum of squares for std dev
            sumSqR += r * r;
            sumSqG += g * g;
            sumSqB += b * b;
            
            // Min/max
            minR = Math.min(minR, r);
            minG = Math.min(minG, g);
            minB = Math.min(minB, b);
            
            maxR = Math.max(maxR, r);
            maxG = Math.max(maxG, g);
            maxB = Math.max(maxB, b);
            
            // Update histograms
            histR[r]++;
            histG[g]++;
            histB[b]++;
        }
        
        // Calculate mean
        const meanR = sumR / pixelCount;
        const meanG = sumG / pixelCount;
        const meanB = sumB / pixelCount;
        
        // Calculate standard deviation
        const stdDevR = Math.sqrt((sumSqR / pixelCount) - (meanR * meanR));
        const stdDevG = Math.sqrt((sumSqG / pixelCount) - (meanG * meanG));
        const stdDevB = Math.sqrt((sumSqB / pixelCount) - (meanB * meanB));
        
        // Calculate CDFs
        const cdfR = new Array(256);
        const cdfG = new Array(256);
        const cdfB = new Array(256);
        
        // Initialize first bin
        cdfR[0] = histR[0] / pixelCount;
        cdfG[0] = histG[0] / pixelCount;
        cdfB[0] = histB[0] / pixelCount;
        
        // Calculate cumulative sum
        for (let i = 1; i < 256; i++) {
            cdfR[i] = cdfR[i - 1] + histR[i] / pixelCount;
            cdfG[i] = cdfG[i - 1] + histG[i] / pixelCount;
            cdfB[i] = cdfB[i - 1] + histB[i] / pixelCount;
        }
        
        return {
            r: { 
                mean: meanR / 255, 
                stdDev: stdDevR / 255, 
                min: minR / 255, 
                max: maxR / 255,
                cdf: cdfR
            },
            g: { 
                mean: meanG / 255, 
                stdDev: stdDevG / 255, 
                min: minG / 255, 
                max: maxG / 255,
                cdf: cdfG
            },
            b: { 
                mean: meanB / 255, 
                stdDev: stdDevB / 255, 
                min: minB / 255, 
                max: maxB / 255,
                cdf: cdfB
            }
        };
    }
    
    // Function to preserve contrast while matching colors
    preserveContrast(originalValue, matchedValue, targetStats, refStats) {
        // Calculate deviation from mean in std dev units for the original color
        const targetDeviation = (originalValue - targetStats.mean) / (targetStats.stdDev || 0.01);
        
        // Apply that deviation to the reference distribution
        const contrastMatched = refStats.mean + (targetDeviation * refStats.stdDev);
        
        // Blend between histogram matched and contrast matched (70% histogram, 30% contrast)
        const result = 0.7 * matchedValue + 0.3 * contrastMatched;
        
        // Ensure value is in valid range
        return Math.min(1, Math.max(0, result));
    }
    
    // Function to apply a tone curve (enhances contrast and prevents washed out appearance)
    toneCurve(value) {
        // S-curve for enhanced contrast while preserving highlights and shadows
        const x = value;
        
        // Enhanced contrast in midtones while preserving shadows and highlights
        const enhanced = (x < 0.5) 
            ? 0.5 * Math.pow(2 * x, 1.2) 
            : 1 - 0.5 * Math.pow(2 * (1 - x), 1.2);
        
        // Blend original with enhanced (80% enhanced, 20% original)
        return 0.8 * enhanced + 0.2 * x;
    }
    
    // Add this smooth lerp function for better transitions
    smoothLerp(a, b, t) {
        // Apply a smoothstep function to t for smoother interpolation
        const smoothT = t * t * (3 - 2 * t);
        return a * smoothT + b * (1 - smoothT);
    }
    
    // Add a new method to reset the result state
    resetResultState(preserveLut = false) {
        // Clear result preview
        this.resultPreview.innerHTML = '';
        this.resultPreview.classList.remove('result-active');
        this.resultPreview.onclick = null;
        this.resultPreview.style.cursor = 'default';
        this.resultPreview.style.display = 'none'; // Hide the preview
        
        // Store the current LUT state if we're preserving it
        const hadLut = preserveLut && this.lut !== null;
        
        // Show empty result state
        this.emptyResult.style.display = 'flex';
        
        // Reset the empty result content based on the current state
        if (!(this.referenceImage && this.targetImage)) {
            // If we don't have both images, show the default message
            this.emptyResult.innerHTML = `
                <span class="icon is-large">
                    <i class="fas fa-image fa-2x"></i>
                </span>
                <p class="mt-3">Your result will appear here</p>
            `;
        } else if (hadLut) {
            // If we have a LUT and we're preserving it, show the download message
            this.emptyResult.innerHTML = `
                <span class="icon is-large">
                    <i class="fas fa-download fa-2x"></i>
                </span>
                <p class="mt-3">Click here to download LUT</p>
            `;
        } else {
            // If we have both images but no LUT or we're not preserving it, show the generate message
            this.emptyResult.innerHTML = `
                <span class="icon is-large">
                    <i class="fas fa-magic fa-2x"></i>
                </span>
                <p class="mt-3">Click here to generate</p>
            `;
        }
        
        // Remove has-result class
        const resultContainer = document.getElementById('resultContainer');
        if (resultContainer) {
            resultContainer.classList.remove('has-result');
        }
        
        // Hide download button
        if (this.downloadButton) {
            this.downloadButton.style.display = 'none';
        }
        
        // Reset lut variable if we're not preserving it
        if (!preserveLut) {
            this.lut = null;
        }
    }
    
    // Add a method to download the result image
    downloadResultImage() {
        if (!this.lut) {
            console.error('No result to download');
            return;
        }
        
        // If the result image is not visible, we need to regenerate it
        if (this.resultPreview.style.display !== 'flex' || !this.resultPreview.querySelector('img')) {
            // Show loading state
            this.emptyResult.innerHTML = `
                <div class="has-text-centered">
                    <span class="icon is-large">
                        <i class="fas fa-spinner fa-pulse fa-2x"></i>
                    </span>
                    <p class="mt-3">Generating...</p>
                </div>
            `;
            
            // Create canvas for the target image
            const targetCanvas = this.createCanvas(this.targetImage);
            
            // Apply LUT to target image
            const resultCanvas = this.applyLUT(targetCanvas, this.lut);
            
            // Create result image
            const resultImg = new Image();
            resultImg.onload = () => {
                // Show result
                this.resultPreview.innerHTML = '';
                this.resultPreview.appendChild(resultImg);
                this.resultPreview.style.display = 'flex';
                this.emptyResult.style.display = 'none';
                
                // Apply consistent styling
                this.applyConsistentImageStyling(resultImg);
                
                // Make result clickable to download
                this.resultPreview.style.cursor = 'pointer';
                this.resultPreview.onclick = () => this.downloadResultImage();
                
                // Show download button
                if (this.downloadButton) {
                    this.downloadButton.style.display = 'block';
                }
                
                if (this.mobileDownloadBtn) {
                    this.mobileDownloadBtn.style.display = 'flex';
                }
                
                // Update generate button state
                this.updateGenerateButton();
            };
            
            resultImg.src = resultCanvas.toDataURL('image/jpeg', 0.95);
            return;
        }
        
        try {
            // Create a canvas to draw the result image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Get the result image element
            const imgElement = this.resultPreview.querySelector('img');
            
            if (!imgElement) {
                console.error('No result image found');
                return;
            }
            
            // Set canvas dimensions to match the image
            canvas.width = imgElement.naturalWidth;
            canvas.height = imgElement.naturalHeight;
            
            // Draw the image on the canvas
            ctx.drawImage(imgElement, 0, 0);
            
            // Create a temporary anchor element to trigger the download
            const link = document.createElement('a');
            link.download = 'moodtransfer_result.jpg';
            
            // Convert canvas to blob and create object URL
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                link.href = url;
                
                // Use a safer method to trigger the download
                link.style.display = 'none';
                document.body.appendChild(link);
                
                try {
                    link.click();
                    
                    // Show download feedback
                    this.showToast('Image downloaded successfully');
                } finally {
                    // Clean up
                    setTimeout(() => {
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                    }, 100);
                }
            }, 'image/jpeg', 0.95);
        } catch (error) {
            console.error('Error downloading result image:', error);
            this.showToast('Error downloading image. Please try again.');
        }
    }
    
    // Add this helper method to detect if an image is black and white
    checkIfImageIsBW(imageData) {
        // Sample pixels to check for color variation
        const maxSamples = 1000;
        const stride = Math.max(1, Math.floor(imageData.length / 4 / maxSamples));
        
        let isMonochrome = true;
        
        for (let i = 0; i < imageData.length; i += stride * 4) {
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            
            // If R, G, and B values differ by more than a small threshold, the image has color
            if (Math.abs(r - g) > 5 || Math.abs(r - b) > 5 || Math.abs(g - b) > 5) {
                isMonochrome = false;
                break;
            }
        }
        
        return isMonochrome;
    }
    
    // Add this histogram match function to the class
    histogramMatch(value, targetStats, refStats) {
        // Convert normalized value to 0-255 scale
        const value255 = Math.round(value * 255);
        
        // Check if CDF exists
        if (!targetStats || !targetStats.cdf || !refStats || !refStats.cdf) {
            console.error('Missing CDF in stats objects', { targetStats, refStats });
            return value; // Return original value if CDF is missing
        }
        
        // Use cumulative distribution functions to perform histogram matching
        const targetCDF = targetStats.cdf[value255] || 0;
        
        // Find closest matching value in reference CDF
        let matchedValue = 0;
        let minDiff = Number.MAX_VALUE;
        
        for (let i = 0; i < 256; i++) {
            const diff = Math.abs(refStats.cdf[i] - targetCDF);
            if (diff < minDiff) {
                minDiff = diff;
                matchedValue = i;
            }
        }
        
        // Return normalized value
        return matchedValue / 255;
    }
    
    // Helper function to create anti-banding UI controls
    createAntiBandingControls() {
        // Create container with hidden inputs only
        const container = document.createElement('div');
        container.style.display = 'none';
        container.innerHTML = `
            <input type="checkbox" id="enableDithering" checked>
            <input type="range" min="0" max="20" value="16" id="ditheringAmount">
            <select id="interpolationMethod">
                <option value="tetrahedral" selected>Tetrahedral</option>
            </select>
        `;
        
        return container;
    }
    
    // Update mobile UI
    updateMobileUI() {
        // Update mobile generate button state
        if (this.referenceImage && this.targetImage) {
            if (this.mobileGenerateBtn) {
                this.mobileGenerateBtn.classList.remove('disabled');
            }
        } else {
            if (this.mobileGenerateBtn) {
                this.mobileGenerateBtn.classList.add('disabled');
            }
        }
        
        // Update mobile download button state
        if (this.lut) {
            if (this.mobileDownloadBtn) {
                this.mobileDownloadBtn.style.display = 'flex';
            }
        } else {
            if (this.mobileDownloadBtn) {
                this.mobileDownloadBtn.style.display = 'none';
            }
        }
    }

    // Initialize hidden quality inputs
    initMobileQualityUI() {
        // Create hidden inputs for quality settings
        const hiddenInputs = document.createElement('div');
        hiddenInputs.style.display = 'none';
        hiddenInputs.innerHTML = `
            <input type="checkbox" id="mobileEnableDithering" checked>
            <input type="range" min="0" max="20" value="16" id="mobileDitheringAmount">
            <select id="mobileInterpolationMethod">
                <option value="tetrahedral" selected>Tetrahedral</option>
            </select>
        `;
        
        // Add the hidden inputs to the body
        document.body.appendChild(hiddenInputs);
    }

    // Add a method to reset the upload containers
    resetUploadContainer(type) {
        if (type === 'reference') {
            // Reset reference image
            this.referenceImage = null;
            this.referencePreview.innerHTML = '';
            this.referencePreview.classList.remove('active');
            this.referencePreview.onclick = null;
            this.referencePreview.style.cursor = '';
            
            // Show upload label
            document.querySelector('#referenceContainer .upload-label').style.display = 'flex';
            document.getElementById('referenceContainer').classList.remove('has-image');
        } else if (type === 'target') {
            // Reset target image
            this.targetImage = null;
            this.targetPreview.innerHTML = '';
            this.targetPreview.classList.remove('active');
            this.targetPreview.onclick = null;
            this.targetPreview.style.cursor = '';
            
            // Show upload label
            document.querySelector('#targetContainer .upload-label').style.display = 'flex';
            document.getElementById('targetContainer').classList.remove('has-image');
        }
        
        // Update generate button state
        this.updateGenerateButton();
        
        // Reset result state
        this.resetResultState();
    }

    // Add a new method to update image styling based on screen size
    updateImageStyling() {
        // Update reference image if it exists
        if (this.referenceImage) {
            const refImg = this.referencePreview.querySelector('img');
            this.applyConsistentImageStyling(refImg);
        }
        
        // Update target image if it exists
        if (this.targetImage) {
            const targetImg = this.targetPreview.querySelector('img');
            this.applyConsistentImageStyling(targetImg);
        }
        
        // Update result image if it exists
        const resultImg = this.resultPreview.querySelector('img');
        this.applyConsistentImageStyling(resultImg);
    }

    // Helper method for consistent image styling
    applyConsistentImageStyling(img) {
        if (img) {
            const isMobile = window.innerWidth <= 768;
            const maxHeight = isMobile ? '280px' : '100%';
            
            img.style.maxHeight = maxHeight;
            img.style.maxWidth = '100%';
            img.style.objectFit = 'contain';
            img.style.height = 'auto';
            img.style.width = 'auto';
        }
        return img;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the LUT generator
    const lutGenerator = new LUTGenerator();
    
    // The mobile UI setup is now handled within the LUTGenerator class
    // No need to call updateMobileUI here
});

// Also add some CSS for the quality panel
const style = document.createElement('style');
style.textContent = `
    .mobile-quality-panel {
        z-index: 1001;
    }
    
    .mobile-quality-panel.show {
        transform: translateY(0);
        opacity: 1;
    }

    .select-input {
        padding: 8px;
        border-radius: 4px;
        border: 1px solid #ddd;
        background-color: white;
        width: 100%;
        margin-bottom: 5px;
        font-size: 14px;
    }
`;
document.head.appendChild(style);

// Also search for and remove any standalone updateMobileUI function or calls
// If there's a standalone updateMobileUI function, replace it with an empty function
// that does nothing to prevent errors
function updateMobileUI() {
    console.log('Deprecated updateMobileUI called - this function is now replaced by LUTGenerator.setupMobileQualityUI()');
    // Do nothing - functionality is now in LUTGenerator.setupMobileQualityUI()
} 