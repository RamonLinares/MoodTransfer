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
        try {
            // Get image data
            const refCtx = referenceCanvas.getContext('2d');
            const targetCtx = targetCanvas.getContext('2d');
            
            // Set willReadFrequently option for better performance
            const refData = refCtx.getImageData(0, 0, referenceCanvas.width, referenceCanvas.height);
            const targetData = targetCtx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
            
            // Calculate image statistics in both RGB and HSL spaces
            const refStats = this.calculateImageStats(refData.data);
            const targetStats = this.calculateImageStats(targetData.data);
            
            // Analyze color temperature of reference image for more accurate matching
            const refTemperature = this.analyzeColorTemperature(refData.data);
            const targetTemperature = this.analyzeColorTemperature(targetData.data);
            
            // Calculate HSL statistics for better color mapping
            const refHslStats = this.calculateHSLStats(refData.data);
            const targetHslStats = this.calculateHSLStats(targetData.data);
            
            // Create LUT
            const lutSize = 33; // Standard size for most applications
            const lut = new Float32Array(lutSize * lutSize * lutSize * 3); // RGB values
            
            // Get the intensity adjustment value (0-100)
            const intensity = this.colorIntensity.value / 100;
            
            // Detect image characteristics for enhanced processing
            const isReferenceMonochrome = this.checkIfImageIsBW(refData.data);
            const isHighContrast = this.detectHighContrast(refStats);
            const dominantColor = this.detectDominantColor(refData.data);
            
            // Fill LUT with improved color transformation
            for (let r = 0; r < lutSize; r++) {
                for (let g = 0; g < lutSize; g++) {
                    for (let b = 0; b < lutSize; b++) {
                        const r_norm = r / (lutSize - 1);
                        const g_norm = g / (lutSize - 1);
                        const b_norm = b / (lutSize - 1);
                        
                        // Calculate luminance to determine which zone this color falls into
                        const luminance = 0.2126 * r_norm + 0.7152 * g_norm + 0.0722 * b_norm;
                        
                        // Zone weights for shadows, midtones, and highlights
                        const shadowWeight = Math.max(0, 1 - luminance * 3.3); // Full effect until ~0.3, then taper
                        const midtoneWeight = 1 - Math.abs((luminance - 0.5) * 2.5); // Peak at 0.5, taper to 0
                        const highlightWeight = Math.max(0, (luminance - 0.7) * 3.3); // Start at ~0.7, increase
                        
                        // Convert to HSL for hue-based processing
                        const hsl = this.rgb2hsl(r_norm, g_norm, b_norm);
                        
                        // Apply histogram matching for each channel with zone-based adjustments
                        let r_matched = this.histogramMatch(r_norm, targetStats.r, refStats.r);
                        let g_matched = this.histogramMatch(g_norm, targetStats.g, refStats.g);
                        let b_matched = this.histogramMatch(b_norm, targetStats.b, refStats.b);
                        
                        // HSL-based matching for more accurate color transformation
                        const hslMatched = this.matchHSL(hsl, targetHslStats, refHslStats);
                        const rgbFromHsl = this.hsl2rgb(hslMatched[0], hslMatched[1], hslMatched[2]);
                        
                        // Blend RGB-based and HSL-based matching for better results
                        // Shadows favor HSL matching, highlights favor RGB matching
                        r_matched = (r_matched * 0.6) + (rgbFromHsl[0] * 0.4);
                        g_matched = (g_matched * 0.6) + (rgbFromHsl[1] * 0.4);
                        b_matched = (b_matched * 0.6) + (rgbFromHsl[2] * 0.4);
                        
                        // Check if the reference image is black and white
                        if (isReferenceMonochrome) {
                            // If reference is B&W, result should also be B&W
                            // Use luminance-based matching to convert to grayscale
                            const luminance = 0.2126 * r_matched + 0.7152 * g_matched + 0.0722 * b_matched;
                            r_matched = g_matched = b_matched = luminance;
                        } else {
                            // Enhanced color processing for color images
                            
                            // Apply color temperature correction based on reference image
                            // This helps match the overall warmth/coolness
                            if (refTemperature.temperature === 'warm' && refTemperature.strength > 0.1) {
                                // Warm up colors (increase red, decrease blue)
                                const tempFactor = refTemperature.strength * intensity * 0.15;
                                r_matched = Math.min(1, r_matched * (1 + tempFactor));
                                b_matched = Math.max(0, b_matched * (1 - tempFactor * 0.5));
                            } else if (refTemperature.temperature === 'cool' && refTemperature.strength > 0.1) {
                                // Cool down colors (increase blue, decrease red)
                                const tempFactor = refTemperature.strength * intensity * 0.15;
                                b_matched = Math.min(1, b_matched * (1 + tempFactor));
                                r_matched = Math.max(0, r_matched * (1 - tempFactor * 0.5));
                            }
                            
                            // Apply split toning - different color tints for shadows and highlights
                            // Adjust using zone weights for more natural transitions
                            if (shadowWeight > 0) {
                                // Warm up shadows (more red, less blue)
                                const shadowIntensity = shadowWeight * intensity * 0.2;
                                r_matched += shadowIntensity * 0.1;
                                b_matched -= shadowIntensity * 0.05;
                            }
                            
                            if (highlightWeight > 0) {
                                // Cool highlights (more blue, less yellow) - gentler application
                                // Apply less effect as we approach extreme highlights
                                const highlightFactor = Math.min(1, 2.5 - 2 * luminance); // Reduces effect for values > 0.75
                                const highlightIntensity = highlightWeight * intensity * 0.1 * highlightFactor;
                                b_matched += highlightIntensity * 0.05;
                                g_matched -= highlightIntensity * 0.02;
                            }
                            
                            // Zone-based contrast enhancement
                            if (isHighContrast) {
                                if (shadowWeight > 0.5) {
                                    // Shadow contrast enhancement
                                    [r_matched, g_matched, b_matched] = this.enhanceContrast([r_matched, g_matched, b_matched], intensity * shadowWeight);
                                } else if (midtoneWeight > 0.5) {
                                    // Midtone contrast enhancement (stronger)
                                    [r_matched, g_matched, b_matched] = this.enhanceContrast([r_matched, g_matched, b_matched], intensity * midtoneWeight * 1.2);
                                } else if (highlightWeight > 0.5) {
                                    // Highlight contrast enhancement (gentler)
                                    [r_matched, g_matched, b_matched] = this.enhanceContrast([r_matched, g_matched, b_matched], intensity * highlightWeight * 0.7);
                                }
                            }
                            
                            // Boost dominant color slightly for more cinematic look
                            if (dominantColor) {
                                [r_matched, g_matched, b_matched] = this.boostDominantColor([r_matched, g_matched, b_matched], dominantColor, intensity);
                            }
                        }
                        
                        // Apply intensity adjustment with zone-based blending
                        let intensityFactor = intensity;
                        
                        // Apply more subtle transformation to highlights for a more natural look
                        if (highlightWeight > 0.3) {
                            intensityFactor *= (1 - (highlightWeight * 0.3));
                        }
                        
                        // Add a very subtle dithering effect to prevent banding
                        intensityFactor += (Math.random() * 0.01 - 0.005);
                        
                        // Get original RGB
                        const originalR = r_norm;
                        const originalG = g_norm;
                        const originalB = b_norm;
                        
                        // Apply smooth interpolation between original and transformed colors
                        const newR = this.smoothLerp(originalR, r_matched, intensityFactor);
                        const newG = this.smoothLerp(originalG, g_matched, intensityFactor);
                        const newB = this.smoothLerp(originalB, b_matched, intensityFactor);
                        
                        // Apply tone curve for better contrast and prevent washed out appearance
                        // Use zone-based tone curves for best results
                        let finalR, finalG, finalB;
                        
                        if (shadowWeight > 0.5) {
                            // Shadow tone curve (gentler to preserve shadow detail)
                            finalR = this.toneCurveShadows(newR);
                            finalG = this.toneCurveShadows(newG);
                            finalB = this.toneCurveShadows(newB);
                        } else if (highlightWeight > 0.5) {
                            // Highlight tone curve (very gentle to protect highlights)
                            finalR = this.toneCurveHighlights(newR);
                            finalG = this.toneCurveHighlights(newG);
                            finalB = this.toneCurveHighlights(newB);
                        } else {
                            // Midtone tone curve (standard)
                            finalR = this.toneCurve(newR);
                            finalG = this.toneCurve(newG);
                            finalB = this.toneCurve(newB);
                        }
                        
                        // Store in LUT
                        const idx = (r * lutSize * lutSize + g * lutSize + b) * 3;
                        lut[idx] = finalR;
                        lut[idx + 1] = finalG;
                        lut[idx + 2] = finalB;
                    }
                }
            }
            
            return lut;
        } catch (error) {
            console.error('Error calculating LUT:', error);
            throw error;
        }
    }
    
    // Helper method to analyze color temperature of an image
    analyzeColorTemperature(imageData) {
        // Sample pixels from image to determine color temperature
        let rSum = 0, gSum = 0, bSum = 0;
        let pixelCount = 0;
        
        // Sample pixels (for efficiency, don't check every pixel)
        const sampleRate = Math.max(1, Math.floor(imageData.length / 4 / 1000));
        
        for (let i = 0; i < imageData.length; i += sampleRate * 4) {
            rSum += imageData[i];
            gSum += imageData[i + 1];
            bSum += imageData[i + 2];
            pixelCount++;
        }
        
        // Calculate average R, G, B values
        const rAvg = rSum / pixelCount;
        const bAvg = bSum / pixelCount;
        
        // Calculate R/B ratio which correlates to color temperature
        const rbRatio = rAvg / bAvg;
        
        return {
            // Warm if R > B, cool if B > R
            temperature: rbRatio > 1.05 ? 'warm' : (rbRatio < 0.95 ? 'cool' : 'neutral'),
            // How strong is the temperature bias
            strength: Math.abs(rbRatio - 1)
        };
    }
    
    // Calculate HSL statistics for an image
    calculateHSLStats(imageData) {
        // Initialize arrays for H, S, L histograms
        const hueHist = new Array(360).fill(0);
        const satHist = new Array(101).fill(0);
        const lightHist = new Array(101).fill(0);
        
        let pixelCount = 0;
        
        // Sample pixels for efficiency
        const sampleRate = Math.max(1, Math.floor(imageData.length / 4 / 5000));
        
        for (let i = 0; i < imageData.length; i += sampleRate * 4) {
            // Convert RGB to HSL
            const r = imageData[i] / 255;
            const g = imageData[i + 1] / 255;
            const b = imageData[i + 2] / 255;
            
            const [h, s, l] = this.rgb2hsl(r, g, b);
            
            // Update histograms
            hueHist[Math.floor(h * 359)] += 1;
            satHist[Math.floor(s * 100)] += 1;
            lightHist[Math.floor(l * 100)] += 1;
            
            pixelCount++;
        }
        
        // Calculate cumulative distribution functions
        const hueCDF = this.calculateCumulativeDistribution(hueHist);
        const satCDF = this.calculateCumulativeDistribution(satHist);
        const lightCDF = this.calculateCumulativeDistribution(lightHist);
        
        return {
            hueCDF,
            satCDF,
            lightCDF,
            pixelCount
        };
    }
    
    // Helper to calculate CDF from histogram
    calculateCumulativeDistribution(histogram) {
        const cdf = new Array(histogram.length).fill(0);
        let sum = 0;
        const total = histogram.reduce((a, b) => a + b, 0);
        
        for (let i = 0; i < histogram.length; i++) {
            sum += histogram[i];
            cdf[i] = sum / total;
        }
        
        return cdf;
    }
    
    // Match HSL values using the reference and target statistics
    matchHSL(hsl, targetHslStats, refHslStats) {
        const [h, s, l] = hsl;
        
        // Find matching values using the CDFs
        // For hue, we need to handle the circular nature
        const hueIndex = Math.floor(h * 359);
        const targetHueValue = targetHslStats.hueCDF[hueIndex];
        
        // Find closest match in reference CDF
        let matchedHueIndex = 0;
        let minDiff = 1;
        
        for (let i = 0; i < 360; i++) {
            const diff = Math.abs(refHslStats.hueCDF[i] - targetHueValue);
            if (diff < minDiff) {
                minDiff = diff;
                matchedHueIndex = i;
            }
        }
        
        // Same for saturation and lightness
        const satIndex = Math.floor(s * 100);
        const targetSatValue = targetHslStats.satCDF[satIndex];
        let matchedSatIndex = this.findClosestCDFMatch(targetSatValue, refHslStats.satCDF);
        
        const lightIndex = Math.floor(l * 100);
        const targetLightValue = targetHslStats.lightCDF[lightIndex];
        let matchedLightIndex = this.findClosestCDFMatch(targetLightValue, refHslStats.lightCDF);
        
        return [
            matchedHueIndex / 359,
            matchedSatIndex / 100,
            matchedLightIndex / 100
        ];
    }
    
    // Find the closest matching value in a CDF
    findClosestCDFMatch(value, cdf) {
        let best = 0;
        let minDiff = 1;
        
        for (let i = 0; i < cdf.length; i++) {
            const diff = Math.abs(cdf[i] - value);
            if (diff < minDiff) {
                minDiff = diff;
                best = i;
            }
        }
        
        return best;
    }
    
    // Convert RGB to HSL
    rgb2hsl(r, g, b) {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            
            h /= 6;
        }
        
        return [h, s, l];
    }
    
    // Convert HSL to RGB
    hsl2rgb(h, s, l) {
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return [r, g, b];
    }
    
    // Special tone curve for shadows
    toneCurveShadows(value) {
        if (value < 0.01) return value; // Protect pure blacks
        
        // Gentler curve for shadows to preserve detail
        const enhanced = Math.pow(value, 0.95); // Gentler power than standard curve
        
        // Less enhancement, more original preservation
        return 0.6 * enhanced + 0.4 * value;
    }
    
    // Special tone curve for highlights
    toneCurveHighlights(value) {
        if (value > 0.99) return value; // Protect pure whites
        
        // Very gentle curve for highlights
        // For values > 0.7, use an even gentler curve
        const factor = value > 0.7 ? 0.3 : 0.5;
        const enhanced = value + (Math.sin(Math.PI * (value - 0.5)) * factor * 0.05);
        
        // Heavy original preservation for highlights
        return 0.4 * enhanced + 0.6 * value;
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
        
        // Enhanced contrast in midtones while protecting highlights better
        // Reduced power for highlights (1.1 instead of 1.2)
        const enhanced = (x < 0.5) 
            ? 0.5 * Math.pow(2 * x, 1.2) 
            : 1 - 0.5 * Math.pow(2 * (1 - x), 1.05);
        
        // Blend original with enhanced (70% enhanced, 30% original for better highlight protection)
        return (x > 0.75) 
            ? 0.5 * enhanced + 0.5 * x  // More original preservation for extreme highlights
            : 0.7 * enhanced + 0.3 * x; // Standard blend for midtones and shadows
    }
    
    // Add this smooth lerp function for better transitions
    smoothLerp(a, b, t) {
        // Apply a smoothstep function to t for smoother interpolation
        const smoothT = t * t * (3 - 2 * t);
        // Corrected interpolation: a is original color, b is transformed color
        // t is intensity: 0 = keep original, 1 = fully transformed
        return a * (1 - smoothT) + b * smoothT;
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

    // Helper method to detect if the image has high contrast
    detectHighContrast(stats) {
        // Check the standard deviation of luminance
        const rWeight = 0.2126;
        const gWeight = 0.7152;
        const bWeight = 0.0722;
        
        const stdDev = rWeight * stats.r.stdDev + gWeight * stats.g.stdDev + bWeight * stats.b.stdDev;
        
        // Higher standard deviation indicates higher contrast
        return stdDev > 0.2; // Threshold determined empirically
    }
    
    // Helper method to detect the dominant color
    detectDominantColor(imageData) {
        let rSum = 0, gSum = 0, bSum = 0;
        let pixelCount = 0;
        
        // Sample pixels (for efficiency, don't check every pixel)
        const sampleRate = Math.max(1, Math.floor(imageData.length / 4 / 1000));
        
        for (let i = 0; i < imageData.length; i += sampleRate * 4) {
            rSum += imageData[i];
            gSum += imageData[i + 1];
            bSum += imageData[i + 2];
            pixelCount++;
        }
        
        // Average RGB values
        const rAvg = rSum / pixelCount;
        const gAvg = gSum / pixelCount;
        const bAvg = bSum / pixelCount;
        
        // Find the dominant channel
        if (rAvg > gAvg && rAvg > bAvg && rAvg > 100) {
            return 'red';
        } else if (gAvg > rAvg && gAvg > bAvg && gAvg > 100) {
            return 'green';
        } else if (bAvg > rAvg && bAvg > gAvg && bAvg > 100) {
            return 'blue';
        } else if (rAvg > 100 && gAvg > 100 && rAvg > bAvg && gAvg > bAvg) {
            return 'yellow';
        } else if (rAvg > 100 && bAvg > 100 && rAvg > gAvg && bAvg > gAvg) {
            return 'magenta';
        } else if (gAvg > 100 && bAvg > 100 && gAvg > rAvg && bAvg > rAvg) {
            return 'cyan';
        }
        
        return null; // No strong dominant color
    }
    
    // Enhance contrast based on the input color
    enhanceContrast(color, intensity) {
        const [r, g, b] = color;
        
        // Apply a subtle S-curve to increase contrast
        const enhanceFactor = 0.2 * intensity;
        
        const enhanceChannel = (value) => {
            // Center around 0.5
            const centered = value - 0.5;
            
            // Apply less enhancement to highlights
            let enhancementMultiplier = 1.0;
            if (value > 0.7) {
                // Gradually reduce enhancement for highlights
                enhancementMultiplier = 1.0 - ((value - 0.7) / 0.3) * 0.5;
            }
            
            // Apply cubic function for S-curve with reduced effect on highlights
            const enhanced = centered * (1 + enhanceFactor * Math.abs(centered) * enhancementMultiplier);
            
            // Re-center and clamp
            return Math.max(0, Math.min(1, enhanced + 0.5));
        };
        
        return [
            enhanceChannel(r),
            enhanceChannel(g),
            enhanceChannel(b)
        ];
    }
    
    // Boost the dominant color slightly for more cinematic look
    boostDominantColor(color, dominantColor, intensity) {
        const [r, g, b] = color;
        const boost = 0.05 * intensity;
        
        switch (dominantColor) {
            case 'red':
                return [Math.min(1, r + boost), g, b];
            case 'green':
                return [r, Math.min(1, g + boost), b];
            case 'blue':
                return [r, g, Math.min(1, b + boost)];
            case 'yellow':
                return [Math.min(1, r + boost * 0.7), Math.min(1, g + boost * 0.7), b];
            case 'magenta':
                return [Math.min(1, r + boost * 0.7), g, Math.min(1, b + boost * 0.7)];
            case 'cyan':
                return [r, Math.min(1, g + boost * 0.7), Math.min(1, b + boost * 0.7)];
            default:
                return [r, g, b];
        }
    }
    
    // Apply the LUT to transform an image
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
        
        // Fixed dithering strength - subtle effect to prevent banding
        const ditheringStrength = 0.002;
        
        // Apply LUT transformation to each pixel
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
            
            // Get transformed color using tetrahedral interpolation for better accuracy
            const colorValues = this.tetrahedralInterpolation(lut, r_dither, g_dither, b_dither, lutSize);
            
            // Apply to the image
            data[i] = Math.round(Math.min(1, colorValues.r) * 255);
            data[i + 1] = Math.round(Math.min(1, colorValues.g) * 255);
            data[i + 2] = Math.round(Math.min(1, colorValues.b) * 255);
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Return the transformed canvas
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
    
    // Helper method to get a value from the LUT
    getLUTValue(lut, r, g, b, lutSize) {
        const idx = (r * lutSize * lutSize + g * lutSize + b) * 3;
        return {
            r: lut[idx],
            g: lut[idx + 1],
            b: lut[idx + 2]
        };
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