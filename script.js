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
        
        this.colorIntensity = document.getElementById('colorIntensity');
        this.antiBandingStrength = document.getElementById('antiBandingStrength');
        
        // Add debug option
        this.debugMode = false; // Set to true to enable detailed logging
        
        // Add window-level debug toggle for easier troubleshooting
        window.toggleLUTDebug = () => {
            this.debugMode = !this.debugMode;
            console.log(`LUT debug mode ${this.debugMode ? 'enabled' : 'disabled'}`);
            return `Debug mode is now ${this.debugMode ? 'ON' : 'OFF'}`;
        };
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
            
            // Setup anti-banding slider
            if (this.antiBandingStrength) {
                this.originalAntiBandingValue = this.antiBandingStrength.value;
                
                this.antiBandingStrength.addEventListener('input', () => {
                    // Just update the value during movement
                    this.originalAntiBandingValue = this.antiBandingStrength.value;
                });
                
                this.antiBandingStrength.addEventListener('change', handleSliderChange);
                this.antiBandingStrength.addEventListener('mouseup', handleSliderChange);
            }
            
            // Add an interval check to detect slider changes (as a backup)
            setInterval(() => {
                // Only check if there's a significant difference to avoid minor floating point issues
                const colorIntensityChanged = this.lut && 
                    Math.abs(this.originalSliderValue - this.colorIntensity.value) > 0.1;
                
                const antiBandingChanged = this.lut && this.antiBandingStrength && 
                    Math.abs(this.originalAntiBandingValue - this.antiBandingStrength.value) > 0.1;
                
                if (colorIntensityChanged || antiBandingChanged) {
                    console.log('Interval detected slider change');
                    
                    if (colorIntensityChanged) {
                        console.log('Color intensity changed from', this.originalSliderValue, 'to', this.colorIntensity.value);
                        this.originalSliderValue = this.colorIntensity.value;
                    }
                    
                    if (antiBandingChanged) {
                        console.log('Anti-banding changed from', this.originalAntiBandingValue, 'to', this.antiBandingStrength.value);
                        this.originalAntiBandingValue = this.antiBandingStrength.value;
                    }
                    
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
    
    async calculateLUT(referenceCanvas, targetCanvas, progressCallback = null) {
        try {
            // Function to report progress
            const reportProgress = async (percent, message) => {
                if (progressCallback && typeof progressCallback === 'function') {
                    // Handle both sync and async callbacks
                    try {
                        const result = progressCallback(percent, message);
                        if (result instanceof Promise) {
                            await result;
                        }
                    } catch (e) {
                        console.warn('Error in progress callback:', e);
                    }
                }
            };

            // Get image data
            const refCtx = referenceCanvas.getContext('2d');
            const targetCtx = targetCanvas.getContext('2d');
            
            // Set willReadFrequently option for better performance
            const refData = refCtx.getImageData(0, 0, referenceCanvas.width, referenceCanvas.height);
            const targetData = targetCtx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
            
            reportProgress(5, 'Calculating RGB statistics...');
            // Calculate image statistics in RGB space
            const refStats = this.calculateImageStats(refData.data);
            const targetStats = this.calculateImageStats(targetData.data);
            
            reportProgress(15, 'Calculating LAB color space statistics...');
            // Calculate image statistics in LAB space (new)
            const refLabStats = this.calculateLABStats(refData.data);
            const targetLabStats = this.calculateLABStats(targetData.data);
            
            reportProgress(25, 'Analyzing color characteristics...');
            // Analyze color temperature of reference image for more accurate matching
            const refTemperature = this.analyzeColorTemperature(refData.data);
            const targetTemperature = this.analyzeColorTemperature(targetData.data);
            
            // Calculate HSL statistics for better color mapping
            const refHslStats = this.calculateHSLStats(refData.data);
            const targetHslStats = this.calculateHSLStats(targetData.data);
            
            reportProgress(35, 'Creating color lookup table...');
            // Create LUT
            const lutSize = 33; // Standard size for most applications
            const lut = new Float32Array(lutSize * lutSize * lutSize * 3); // RGB values
            
            // Get the intensity adjustment value (0-100)
            const intensity = this.colorIntensity.value / 100;
            
            // Get anti-banding strength (0-100)
            const antiBandingStrength = this.antiBandingStrength ? this.antiBandingStrength.value / 100 : 0;
            
            reportProgress(40, 'Detecting image characteristics...');
            // Detect image characteristics for enhanced processing
            const isReferenceMonochrome = this.checkIfImageIsBW(refData.data);
            const isHighContrast = this.detectHighContrast(refStats);
            const dominantColor = this.detectDominantColor(refData.data);
            
            // Advanced: detect texture characteristics for spatial-aware matching
            const textureMask = this.generateTextureMask(refData.data, referenceCanvas.width, referenceCanvas.height);
            
            reportProgress(45, 'Building color transformation map...');
            
            // Calculate total iterations for progress tracking
            const totalIterations = lutSize * lutSize * lutSize;
            let completedIterations = 0;
            let lastProgressUpdate = 45;
            
            // Fill LUT with improved color transformation
            for (let r = 0; r < lutSize; r++) {
                for (let g = 0; g < lutSize; g++) {
                    for (let b = 0; b < lutSize; b++) {
                        const r_norm = r / (lutSize - 1);
                        const g_norm = g / (lutSize - 1);
                        const b_norm = b / (lutSize - 1);
                        
                        // ---------- ZONE DETECTION ----------
                        // Calculate luminance to determine which zone this color falls into
                        const luminance = 0.2126 * r_norm + 0.7152 * g_norm + 0.0722 * b_norm;
                        
                        // Zone weights for shadows, midtones, and highlights
                        const shadowWeight = Math.max(0, 1 - luminance * 3.3); // Full effect until ~0.3, then taper
                        const midtoneWeight = 1 - Math.abs((luminance - 0.5) * 2.5); // Peak at 0.5, taper to 0
                        const highlightWeight = Math.max(0, (luminance - 0.7) * 3.3); // Start at ~0.7, increase
                        
                        // ---------- NEW: LAB BASED MATCHING ----------
                        // Convert RGB to LAB for perceptual color matching
                        const labValues = this.rgb2lab(r_norm, g_norm, b_norm);
                        
                        // Apply optimal transport matching in LAB space for superior color accuracy
                        const l_matched = this.optimalTransportMatch(labValues[0] / 100, targetLabStats, refLabStats, 'l');
                        const a_matched = this.optimalTransportMatch((labValues[1] + 128) / 255, targetLabStats, refLabStats, 'a');
                        const b_lab_matched = this.optimalTransportMatch((labValues[2] + 128) / 255, targetLabStats, refLabStats, 'b');
                        
                        // Convert normalized values back to LAB space
                        const matchedLab = [
                            l_matched * 100,
                            a_matched * 255 - 128,
                            b_lab_matched * 255 - 128
                        ];
                        
                        // Convert matched LAB back to RGB
                        let rgbFromLab = [r_norm, g_norm, b_norm]; // Default fallback
                        
                        // Add a safety check for the LAB conversion
                        try {
                            const labRgbResult = this.lab2rgb(matchedLab[0], matchedLab[1], matchedLab[2]);
                            
                            // Validate that the LAB->RGB conversion returned sane values
                            const isValid = (
                                !isNaN(labRgbResult[0]) && 
                                !isNaN(labRgbResult[1]) && 
                                !isNaN(labRgbResult[2]) &&
                                labRgbResult[0] >= 0 && labRgbResult[0] <= 1 &&
                                labRgbResult[1] >= 0 && labRgbResult[1] <= 1 &&
                                labRgbResult[2] >= 0 && labRgbResult[2] <= 1
                            );
                            
                            if (isValid) {
                                // Only use the result if it's valid
                                rgbFromLab = labRgbResult;
                            } else {
                                // If invalid, keep the fallback and don't use LAB in the blend
                                rgbWeight += labWeight;
                                labWeight = 0;
                            }
                        } catch (e) {
                            console.warn('LAB conversion error:', e);
                            // Keep the fallback and don't use LAB in the blend
                            rgbWeight += labWeight;
                            labWeight = 0;
                        }
                        
                        // ---------- ORIGINAL COLOR MATCHING PIPELINE ----------
                        // Also perform traditional histogram matching for blending
                        let r_hist_matched = this.histogramMatch(r_norm, targetStats.r, refStats.r);
                        let g_hist_matched = this.histogramMatch(g_norm, targetStats.g, refStats.g);
                        let b_hist_matched = this.histogramMatch(b_norm, targetStats.b, refStats.b);
                        
                        // HSL-based matching for better color preservation
                        const hsl = this.rgb2hsl(r_norm, g_norm, b_norm);
                        const hslMatched = this.matchHSL(hsl, targetHslStats, refHslStats);
                        const rgbFromHsl = this.hsl2rgb(hslMatched[0], hslMatched[1], hslMatched[2]);
                        
                        // ---------- ADAPTIVE BLENDING OF DIFFERENT COLOR MODELS ----------
                        // LAB is most accurate but can cause issues when applied too strongly
                        // Blend more conservatively with traditional methods
                        
                        // Dynamic blend weights based on color characteristics
                        let labWeight, hslWeight, rgbWeight;
                        
                        // The LAB implementation is causing the cyan problem - reduce its influence
                        if (shadowWeight > 0.5) {
                            // Shadows - more conservative LAB approach
                            labWeight = 0.30;  // Reduced from 0.65
                            hslWeight = 0.30;
                            rgbWeight = 0.40;  // Increased for better RGB fidelity
                        } else if (highlightWeight > 0.5) {
                            // Highlights need gentler processing
                            labWeight = 0.20;  // Reduced from 0.50
                            hslWeight = 0.35;
                            rgbWeight = 0.45;  // Increased for better RGB fidelity
                        } else {
                            // Midtones 
                            labWeight = 0.25;  // Reduced from 0.60
                            hslWeight = 0.35;
                            rgbWeight = 0.40;  // Increased for better RGB fidelity
                        }
                        
                        // Adaptively adjust weights based on chroma
                        const chroma = Math.sqrt(
                            Math.pow(labValues[1], 2) + 
                            Math.pow(labValues[2], 2)
                        );
                        
                        // For highly saturated colors, trust RGB histogram more to preserve vibrance
                        if (chroma > 60) {
                            labWeight -= 0.05;
                            hslWeight -= 0.05;
                            rgbWeight += 0.10;
                        }
                        
                        // Final blend of the three color spaces
                        let r_matched = (rgbFromLab[0] * labWeight) + 
                                       (rgbFromHsl[0] * hslWeight) + 
                                       (r_hist_matched * rgbWeight);
                                       
                        let g_matched = (rgbFromLab[1] * labWeight) + 
                                       (rgbFromHsl[1] * hslWeight) + 
                                       (g_hist_matched * rgbWeight);
                                       
                        let b_matched = (rgbFromLab[2] * labWeight) + 
                                       (rgbFromHsl[2] * hslWeight) + 
                                       (b_hist_matched * rgbWeight);
                                       
                        // Add a saturation boost to counteract any washing out
                        const rgbToHsl = this.rgb2hsl(r_matched, g_matched, b_matched);
                        rgbToHsl[1] *= 1.1; // Boost saturation by 10%
                        rgbToHsl[1] = Math.min(1, rgbToHsl[1]); // Cap at 1
                        const boostedRgb = this.hsl2rgb(rgbToHsl[0], rgbToHsl[1], rgbToHsl[2]);
                        
                        // Apply the saturation boost
                        r_matched = boostedRgb[0];
                        g_matched = boostedRgb[1];
                        b_matched = boostedRgb[2];
                        
                        // ---------- BLACK & WHITE DETECTION & PROCESSING ----------
                        // Check if the reference image is black and white
                        if (isReferenceMonochrome) {
                            // If reference is B&W, result should also be B&W
                            // Use CIEDE2000 weighted luminance for more natural grayscale conversion
                            const luminance = 0.2126 * r_matched + 0.7152 * g_matched + 0.0722 * b_matched;
                            r_matched = g_matched = b_matched = luminance;
                        } else {
                            // Enhanced color processing for color images
                            
                            // ---------- COLOR TEMPERATURE CORRECTION ----------
                            // Apply color temperature correction based on reference image
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
                            
                            // ---------- ZONE-BASED COLOR GRADING ----------
                            // Apply split toning - different color tints for shadows and highlights
                            if (shadowWeight > 0) {
                                // Warm up shadows (more red, less blue)
                                const shadowIntensity = shadowWeight * intensity * 0.2;
                                r_matched += shadowIntensity * 0.1;
                                b_matched -= shadowIntensity * 0.05;
                            }
                            
                            if (highlightWeight > 0) {
                                // Cool highlights (more blue, less yellow) - gentler application
                                const highlightFactor = Math.min(1, 2.5 - 2 * luminance); // Reduces effect for values > 0.75
                                const highlightIntensity = highlightWeight * intensity * 0.1 * highlightFactor;
                                b_matched += highlightIntensity * 0.05;
                                g_matched -= highlightIntensity * 0.02;
                            }
                            
                            // ---------- ENHANCED CONTRAST PRESERVATION ----------
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
                        
                        // ---------- INTENSITY ADJUSTMENT WITH ADAPTIVE BLENDING ----------
                        // Apply intensity adjustment with zone-based blending
                        let intensityFactor = intensity;
                        
                        // Apply more subtle transformation to highlights for a more natural look
                        if (highlightWeight > 0.3) {
                            intensityFactor *= (1 - (highlightWeight * 0.3));
                        }
                        
                        // ---------- ADVANCED ANTI-BANDING ----------
                        // Add adaptive dithering effect to prevent banding
                        if (antiBandingStrength > 0) {
                            const noiseAmount = 0.01 * antiBandingStrength;
                            // Blue noise provides better visual quality than white noise
                            const blueNoise = this.generateBlueNoise(r, g, b, lutSize) * noiseAmount;
                            intensityFactor += blueNoise;
                        }
                        
                        // Get original RGB
                        const originalR = r_norm;
                        const originalG = g_norm;
                        const originalB = b_norm;
                        
                        // Apply smooth interpolation between original and transformed colors
                        const newR = this.smoothLerp(originalR, r_matched, intensityFactor);
                        const newG = this.smoothLerp(originalG, g_matched, intensityFactor);
                        const newB = this.smoothLerp(originalB, b_matched, intensityFactor);
                        
                        // ---------- ZONE-BASED TONE CURVES ----------
                        // Apply tone curve for better contrast and prevent washed out appearance
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
                        
                        // Increment completed iterations and update progress periodically
                        completedIterations++;
                        
                        // Update progress every 5% to avoid too many DOM updates
                        const currentProgress = 45 + Math.floor((completedIterations / totalIterations) * 50);
                        if (currentProgress >= lastProgressUpdate + 5) {
                            lastProgressUpdate = currentProgress;
                            
                            // Instead of awaiting here which isn't allowed in a regular loop,
                            // we'll just call the function without await and handle any UI updates
                            // in periodic breaks
                            reportProgress(currentProgress, 'Processing colors...');
                            
                            // Every 10000 iterations, we'll set a flag to do a UI refresh on next iteration
                            if (completedIterations % 10000 === 0 && this.debugMode) {
                                console.log(`Processed ${completedIterations}/${totalIterations} colors (${Math.round(completedIterations/totalIterations*100)}%)`);
                            }
                        }
                    }
                }
            }
            
            // Make sure we report 100% at the end
            reportProgress(95, 'Finalizing color lookup table...');
            return lut;
        } catch (error) {
            console.error('Error in calculateLUT:', error);
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

    // Convert RGB to LAB color space
    rgb2lab(r, g, b) {
        // Convert RGB to XYZ
        r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
        g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
        b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
        
        r *= 100;
        g *= 100;
        b *= 100;
        
        // Observer = 2°, Illuminant = D65
        const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
        const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
        const z = r * 0.0193 + g * 0.1192 + b * 0.9505;
        
        // Convert XYZ to LAB
        const xRef = 95.047;
        const yRef = 100.0;
        const zRef = 108.883;
        
        let xr = x / xRef;
        let yr = y / yRef;
        let zr = z / zRef;
        
        xr = xr > 0.008856 ? Math.pow(xr, 1/3) : (7.787 * xr) + (16 / 116);
        yr = yr > 0.008856 ? Math.pow(yr, 1/3) : (7.787 * yr) + (16 / 116);
        zr = zr > 0.008856 ? Math.pow(zr, 1/3) : (7.787 * zr) + (16 / 116);
        
        const l = (116 * yr) - 16;
        const a = 500 * (xr - yr);
        const b_val = 200 * (yr - zr);
        
        return [l, a, b_val];
    }

    // Convert LAB to RGB color space
    lab2rgb(l, a, b) {
        // Make sure the values are in reasonable ranges
        const origL = l, origA = a, origB = b;
        l = Math.min(100, Math.max(0, l));
        a = Math.min(127, Math.max(-128, a));
        b = Math.min(127, Math.max(-128, b));
        
        // Log if values were clamped (indicating a potential issue)
        if (this.debugMode && (origL !== l || origA !== a || origB !== b)) {
            console.warn('LAB values needed clamping:', {
                originalL: origL,
                originalA: origA, 
                originalB: origB,
                clampedL: l,
                clampedA: a,
                clampedB: b
            });
        }

        let y = (l + 16) / 116;
        let x = a / 500 + y;
        let z = y - b / 200;
        
        // D65 reference white
        const xRef = 95.047;
        const yRef = 100.0;
        const zRef = 108.883;
        
        // Convert LAB to XYZ
        x = x * x * x > 0.008856 ? x * x * x : (x - 16 / 116) / 7.787;
        y = y * y * y > 0.008856 ? y * y * y : (y - 16 / 116) / 7.787;
        z = z * z * z > 0.008856 ? z * z * z : (z - 16 / 116) / 7.787;
        
        x = (x * xRef) / 100;
        y = (y * yRef) / 100;
        z = (z * zRef) / 100;
        
        // Convert XYZ to RGB
        // Using more conservative matrix coefficients
        let r = x *  3.2406 + y * -1.5372 + z * -0.4986;
        let g = x * -0.9689 + y *  1.8758 + z *  0.0415;
        let b_val = x *  0.0557 + y * -0.2040 + z *  1.0570;
        
        // Apply gamma correction
        r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
        g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
        b_val = b_val > 0.0031308 ? 1.055 * Math.pow(b_val, 1 / 2.4) - 0.055 : 12.92 * b_val;
        
        // Clamp values and check for extreme values
        r = Math.max(0, Math.min(1, r));
        g = Math.max(0, Math.min(1, g));
        b_val = Math.max(0, Math.min(1, b_val));
        
        // Add a special check to catch the cyan issue
        const maxChannel = Math.max(r, g, b_val);
        const minChannel = Math.min(r, g, b_val);
        
        // If very cyan biased (low red, high blue/green), adjust it
        if (r < 0.3 && g > 0.6 && b_val > 0.6 && (g + b_val) / 2 > r * 2) {
            // Boost red to reduce cyan bias
            r = r * 1.5;
            // Reduce blue/green slightly
            g = g * 0.9;
            b_val = b_val * 0.9;
            
            // Re-clamp
            r = Math.min(1, r);
            g = Math.min(1, g);
            b_val = Math.min(1, b_val);
        }
        
        // If overall the color is washing out (all channels high)
        if (minChannel > 0.6) {
            // Apply stronger contrast
            r = r > 0.5 ? r * 1.1 : r * 0.9;
            g = g > 0.5 ? g * 1.1 : g * 0.9;
            b_val = b_val > 0.5 ? b_val * 1.1 : b_val * 0.9;
            
            // Re-clamp
            r = Math.max(0, Math.min(1, r));
            g = Math.max(0, Math.min(1, g));
            b_val = Math.max(0, Math.min(1, b_val));
        }
        
        return [r, g, b_val];
    }

    // Calculate the CIEDE2000 color difference between two colors in LAB space
    calculateCIEDE2000(lab1, lab2) {
        // Extract LAB values
        const L1 = lab1[0];
        const a1 = lab1[1];
        const b1 = lab1[2];
        const L2 = lab2[0];
        const a2 = lab2[1];
        const b2 = lab2[2];
        
        // Calculate C1, C2 (Chroma)
        const C1 = Math.sqrt(a1 * a1 + b1 * b1);
        const C2 = Math.sqrt(a2 * a2 + b2 * b2);
        
        // Calculate average Chroma and L
        const Cavg = (C1 + C2) / 2;
        
        // Compute G - adjustment factor for Chroma
        const G = 0.5 * (1 - Math.sqrt(Math.pow(Cavg, 7) / (Math.pow(Cavg, 7) + Math.pow(25, 7))));
        
        // Adjust a values
        const a1p = a1 * (1 + G);
        const a2p = a2 * (1 + G);
        
        // Calculate C'1, C'2 using adjusted a values
        const C1p = Math.sqrt(a1p * a1p + b1 * b1);
        const C2p = Math.sqrt(a2p * a2p + b2 * b2);
        
        // Calculate h'1, h'2 (hue angles)
        let h1p = Math.atan2(b1, a1p);
        h1p = h1p >= 0 ? h1p : h1p + 2 * Math.PI;
        let h2p = Math.atan2(b2, a2p);
        h2p = h2p >= 0 ? h2p : h2p + 2 * Math.PI;
        
        // Convert to degrees
        h1p = h1p * 180 / Math.PI;
        h2p = h2p * 180 / Math.PI;
        
        // Calculate ΔL', ΔC', ΔH'
        const deltaLp = L2 - L1;
        const deltaCp = C2p - C1p;
        
        // Calculate ΔH' (considering the angle difference)
        let deltahp;
        if (C1p * C2p === 0) {
            deltahp = 0;
        } else if (Math.abs(h2p - h1p) <= 180) {
            deltahp = h2p - h1p;
        } else if (h2p - h1p > 180) {
            deltahp = h2p - h1p - 360;
        } else {
            deltahp = h2p - h1p + 360;
        }
        
        // Calculate ΔH'
        const deltaHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(deltahp * Math.PI / 360);
        
        // Calculate CIEDE2000 color difference
        // Using simplified weightings (kL=kC=kH=1)
        const Lp = (L1 + L2) / 2;
        const Cp = (C1p + C2p) / 2;
        
        // Calculate h'avg
        let hp;
        if (C1p * C2p === 0) {
            hp = h1p + h2p;
        } else if (Math.abs(h1p - h2p) <= 180) {
            hp = (h1p + h2p) / 2;
        } else if (h1p + h2p < 360) {
            hp = (h1p + h2p + 360) / 2;
        } else {
            hp = (h1p + h2p - 360) / 2;
        }
        
        // Calculate T for hue rotation term
        const T = 1 - 0.17 * Math.cos((hp - 30) * Math.PI / 180) + 
                     0.24 * Math.cos((2 * hp) * Math.PI / 180) + 
                     0.32 * Math.cos((3 * hp + 6) * Math.PI / 180) - 
                     0.20 * Math.cos((4 * hp - 63) * Math.PI / 180);
        
        // Calculate RT for hue rotation factor
        const deltaTheta = 30 * Math.exp(-Math.pow((hp - 275) / 25, 2));
        const RC = 2 * Math.sqrt(Math.pow(Cp, 7) / (Math.pow(Cp, 7) + Math.pow(25, 7)));
        const RT = -Math.sin(2 * deltaTheta * Math.PI / 180) * RC;
        
        // Calculate SL, SC, SH - the weighting functions
        const SL = 1 + (0.015 * Math.pow(Lp - 50, 2)) / Math.sqrt(20 + Math.pow(Lp - 50, 2));
        const SC = 1 + 0.045 * Cp;
        const SH = 1 + 0.015 * Cp * T;
        
        // Final CIEDE2000 calculation
        return Math.sqrt(
            Math.pow(deltaLp / SL, 2) + 
            Math.pow(deltaCp / SC, 2) + 
            Math.pow(deltaHp / SH, 2) + 
            RT * (deltaCp / SC) * (deltaHp / SH)
        );
    }

    // Calculate LAB statistics for an image
    calculateLABStats(imageData) {
        // Initialize arrays for L, A, B histograms (0-100 for L, -128 to 127 for a/b)
        const lHist = new Array(101).fill(0);  // L: 0-100
        const aHist = new Array(256).fill(0);  // a: -128 to 127
        const bHist = new Array(256).fill(0);  // b: -128 to 127
        
        let lSum = 0, aSum = 0, bSum = 0;
        let lSqSum = 0, aSqSum = 0, bSqSum = 0;
        let pixelCount = 0;
        
        // Sample pixels for efficiency
        const sampleRate = Math.max(1, Math.floor(imageData.length / 4 / 5000));
        
        for (let i = 0; i < imageData.length; i += sampleRate * 4) {
            // Convert RGB to LAB
            const r = imageData[i] / 255;
            const g = imageData[i + 1] / 255;
            const b = imageData[i + 2] / 255;
            
            const [l, a, b_val] = this.rgb2lab(r, g, b);
            
            // Update histograms (normalize a, b from -128/127 to 0-255 index)
            const lIndex = Math.max(0, Math.min(100, Math.floor(l)));
            const aIndex = Math.max(0, Math.min(255, Math.floor(a + 128)));
            const bIndex = Math.max(0, Math.min(255, Math.floor(b_val + 128)));
            
            lHist[lIndex] += 1;
            aHist[aIndex] += 1;
            bHist[bIndex] += 1;
            
            // Sum for mean and variance calculation
            lSum += l;
            aSum += a;
            bSum += b_val;
            lSqSum += l * l;
            aSqSum += a * a;
            bSqSum += b_val * b_val;
            
            pixelCount++;
        }
        
        // Calculate mean and standard deviation
        const lMean = lSum / pixelCount;
        const aMean = aSum / pixelCount;
        const bMean = bSum / pixelCount;
        
        const lStdDev = Math.sqrt(lSqSum / pixelCount - lMean * lMean);
        const aStdDev = Math.sqrt(aSqSum / pixelCount - aMean * aMean);
        const bStdDev = Math.sqrt(bSqSum / pixelCount - bMean * bMean);
        
        // Calculate cumulative distribution functions
        const lCDF = this.calculateCumulativeDistribution(lHist);
        const aCDF = this.calculateCumulativeDistribution(aHist);
        const bCDF = this.calculateCumulativeDistribution(bHist);
        
        return {
            l: { mean: lMean, stdDev: lStdDev, cdf: lCDF },
            a: { mean: aMean, stdDev: aStdDev, cdf: aCDF },
            b: { mean: bMean, stdDev: bStdDev, cdf: bCDF },
            pixelCount
        };
    }

    // Implementation of 1D Optimal Transport for color matching
    optimalTransportMatch(value, sourceStats, targetStats, channel) {
        // Choose correct CDF and range depending on the channel
        let sourceCDF, targetCDF, rangeMax;
        
        if (channel === 'l') {
            sourceCDF = sourceStats.l.cdf;
            targetCDF = targetStats.l.cdf;
            rangeMax = 100;
            // Scale normalized value to L range (0-100)
            value = value * 100;
        } else if (channel === 'a' || channel === 'b') {
            sourceCDF = channel === 'a' ? sourceStats.a.cdf : sourceStats.b.cdf;
            targetCDF = channel === 'a' ? targetStats.a.cdf : targetStats.b.cdf;
            rangeMax = 256; // -128 to 127, indexed as 0-255
            // Scale normalized value to a/b range (-128 to 127)
            value = (value * 255) - 128;
        } else {
            console.error('Invalid color channel for optimal transport matching');
            return value;
        }
        
        // Safety check - ensure value is in valid range
        value = Math.max(0, Math.min(rangeMax, value));
        
        // Convert value to index
        const valueIndex = Math.floor(value);
        
        // Find the CDF value at the current point in the source
        const cdfValue = sourceCDF[valueIndex] || 0;
        
        // Find where this percentile occurs in the target distribution
        let matchedIndex = 0;
        let minDiff = Number.MAX_VALUE;
        
        for (let i = 0; i < targetCDF.length; i++) {
            const diff = Math.abs(targetCDF[i] - cdfValue);
            if (diff < minDiff) {
                minDiff = diff;
                matchedIndex = i;
            }
        }
        
        // Safety check - if matchedIndex is outside valid range, clamp it
        matchedIndex = Math.max(0, Math.min(targetCDF.length - 1, matchedIndex));
        
        // Now handle possible sharp transitions with smooth local averaging
        // This prevents artificial edges from appearing when single values map to multiple output values
        
        // Apply spatial regularization (looking at neighboring matches to smooth any artifacts)
        let smoothedMatch = matchedIndex;
        const windowSize = 3; // smaller window for more conservative smoothing
        
        // Only apply smoothing if we're close to a steep change in the CDF
        const sensitivity = 0.01;  // Threshold for detecting steep CDF changes
        let steepChange = false;
        
        // Check if we're near a steep change in the CDF
        for (let i = Math.max(0, valueIndex - 2); i < Math.min(sourceCDF.length, valueIndex + 3); i++) {
            for (let j = Math.max(0, i - 2); j < Math.min(sourceCDF.length, i + 3); j++) {
                if (i !== j && Math.abs(sourceCDF[i] - sourceCDF[j]) > sensitivity * Math.abs(i - j)) {
                    steepChange = true;
                    break;
                }
            }
            if (steepChange) break;
        }
        
        if (steepChange) {
            // Apply weighted average of nearby matches
            let weightSum = 0;
            let valueSum = 0;
            
            for (let i = Math.max(0, valueIndex - windowSize); i <= Math.min(sourceCDF.length - 1, valueIndex + windowSize); i++) {
                const weight = 1 / (1 + Math.abs(i - valueIndex));
                const neighborCDF = sourceCDF[i];
                
                // Find match for this neighbor
                let neighborMatchedIndex = 0;
                let neighborMinDiff = Number.MAX_VALUE;
                
                for (let j = 0; j < targetCDF.length; j++) {
                    const diff = Math.abs(targetCDF[j] - neighborCDF);
                    if (diff < neighborMinDiff) {
                        neighborMinDiff = diff;
                        neighborMatchedIndex = j;
                    }
                }
                
                valueSum += neighborMatchedIndex * weight;
                weightSum += weight;
            }
            
            smoothedMatch = valueSum / weightSum;
        }
        
        // Blend with original value to make the effect more conservative
        // This helps prevent extreme transformations
        const blendFactor = 0.7; // Use 70% of the calculated match, 30% of the original
        const originalIndex = valueIndex;
        smoothedMatch = (smoothedMatch * blendFactor) + (originalIndex * (1 - blendFactor));
        
        // Normalize the result back
        if (channel === 'l') {
            return Math.max(0, Math.min(1, smoothedMatch / 100)); // Back to 0-1 range
        } else {
            return Math.max(-0.5, Math.min(0.5, (smoothedMatch - 128) / 255)); // Back to -0.5 to 0.5 range
        }
    }

    // Generate a texture mask for spatially-aware processing
    generateTextureMask(imageData, width, height) {
        try {
            // Use a simpler approach for texture detection to avoid potential issues
            const mask = new Float32Array(width * height);
            
            // For safety, ensure dimensions make sense
            if (!width || !height || width <= 0 || height <= 0 || !imageData || imageData.length < width * height * 4) {
                console.warn('Invalid dimensions for texture mask generation');
                return new Float32Array(width * height); // Return empty mask
            }
            
            // Calculate the edge strength at each pixel using a simple gradient
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const idx = (y * width + x) * 4;
                    
                    // Get luminance of current and neighboring pixels
                    const getLuminance = (i) => {
                        // Convert RGB to luminance
                        return 0.2126 * imageData[i] + 0.7152 * imageData[i+1] + 0.0722 * imageData[i+2];
                    };
                    
                    const thisLum = getLuminance(idx);
                    const rightLum = getLuminance(idx + 4);
                    const bottomLum = getLuminance(idx + width * 4);
                    
                    // Simple edge detection - calculate horizontal and vertical gradients
                    const horizGrad = Math.abs(thisLum - rightLum);
                    const vertGrad = Math.abs(thisLum - bottomLum);
                    
                    // Store the maximum gradient as the edge strength
                    const edgeStrength = Math.max(horizGrad, vertGrad);
                    mask[y * width + x] = Math.min(1, edgeStrength / 128);
                }
            }
            
            // Apply a very simple Gaussian blur
            const blurredMask = new Float32Array(mask.length);
            
            for (let y = 2; y < height - 2; y++) {
                for (let x = 2; x < width - 2; x++) {
                    const idx = y * width + x;
                    
                    // Simple 3x3 blur kernel
                    let sum = 0;
                    sum += mask[idx - width - 1] * 0.0625; // top-left
                    sum += mask[idx - width] * 0.125;      // top
                    sum += mask[idx - width + 1] * 0.0625; // top-right
                    sum += mask[idx - 1] * 0.125;          // left
                    sum += mask[idx] * 0.25;               // center
                    sum += mask[idx + 1] * 0.125;          // right
                    sum += mask[idx + width - 1] * 0.0625; // bottom-left
                    sum += mask[idx + width] * 0.125;      // bottom
                    sum += mask[idx + width + 1] * 0.0625; // bottom-right
                    
                    blurredMask[idx] = sum;
                }
            }
            
            return blurredMask;
        } catch (error) {
            console.error('Error generating texture mask:', error);
            // Return empty mask on error
            return new Float32Array(width * height);
        }
    }

    // Generate blue noise for high-quality anti-banding
    generateBlueNoise(r, g, b, lutSize) {
        // Use LUT coordinates to ensure consistent noise patterns in color space
        const noiseValue = this.blueNoisePattern(
            (r / lutSize) * 255, 
            (g / lutSize) * 255, 
            (b / lutSize) * 255
        );
        return (noiseValue - 0.5) * 0.01;
    }

    // Blue noise pattern generation with spatial correlation
    blueNoisePattern(x, y, z) {
        // Permutation and gradients based on improved Perlin noise
        
        // Constants for the permutation table
        const PERM = [
            151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
            140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
            247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32,
            57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
            74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122,
            60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
            65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169,
            200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
            52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212,
            207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213,
            119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
            129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
            218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
            81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
            184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
            222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
        ];
        
        // Hash function for 3D coordinates
        const hash = (x, y, z) => {
            return PERM[(PERM[(PERM[x & 255] + y) & 255] + z) & 255];
        };
        
        // Smooth interpolation function
        const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
        
        // Linear interpolation
        const lerp = (a, b, t) => a + t * (b - a);
        
        // Blue noise characteristics - improved gradient function
        const grad = (hash, x, y, z) => {
            const h = hash & 15;
            const u = h < 8 ? x : y;
            const v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
            return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
        };
        
        // Integer and fractional parts
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;
        
        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);
        
        // Fade curves
        const u = fade(x);
        const v = fade(y);
        const w = fade(z);
        
        // Hash coordinates of the 8 cube corners
        const A = hash(X, Y, Z);
        const B = hash(X+1, Y, Z);
        const C = hash(X, Y+1, Z);
        const D = hash(X+1, Y+1, Z);
        const E = hash(X, Y, Z+1);
        const F = hash(X+1, Y, Z+1);
        const G = hash(X, Y+1, Z+1);
        const H = hash(X+1, Y+1, Z+1);
        
        // Blend gradients
        const value = lerp(
            lerp(
                lerp(grad(A, x, y, z), grad(B, x-1, y, z), u),
                lerp(grad(C, x, y-1, z), grad(D, x-1, y-1, z), u),
                v
            ),
            lerp(
                lerp(grad(E, x, y, z-1), grad(F, x-1, y, z-1), u),
                lerp(grad(G, x, y-1, z-1), grad(H, x-1, y-1, z-1), u),
                v
            ),
            w
        );
        
        // Normalize to 0-1 range
        return (value + 1) / 2;
    }

    async generateLUT() {
        try {
            // Update the original slider value to prevent false detection of changes
            this.originalSliderValue = this.colorIntensity.value;
            this.originalAntiBandingValue = this.antiBandingStrength ? this.antiBandingStrength.value : 50;
            
            if (!this.referenceImage || !this.targetImage) {
                this.showToast('Please upload both reference and target images');
                return;
            }
            
            // Create a progress bar modal that stays in the center of the screen
            const progressModal = document.createElement('div');
            progressModal.className = 'modal is-active';
            progressModal.style.zIndex = '1000';
            progressModal.innerHTML = `
                <div class="modal-background" style="background-color: rgba(0, 0, 0, 0.7);"></div>
                <div class="modal-content" style="width: 80%; max-width: 500px;">
                    <div class="box has-text-centered">
                        <h4 class="is-size-5 mb-3">Generating Color Transformation</h4>
                        <progress id="lutProgress" class="progress is-primary" value="5" max="100" style="height: 20px;"></progress>
                        <p id="progressStatus" class="mt-2">Initializing...</p>
                    </div>
                </div>
            `;
            document.body.appendChild(progressModal);
            
            // Force browser to render the modal immediately
            // This ensures the progress bar appears before the heavy processing starts
            progressModal.getBoundingClientRect();
            
            const progressBar = document.getElementById('lutProgress');
            const progressStatus = document.getElementById('progressStatus');
            
            // Show loading state in button too
            if (this.generateButton) {
                this.generateButton.classList.add('is-loading');
            }
            
            // Hide the empty result
            if (this.emptyResult) {
                this.emptyResult.style.display = 'none';
            }
            
            console.log('Generating LUT with settings:', {
                colorIntensity: this.colorIntensity.value,
                antiBandingStrength: this.antiBandingStrength ? this.antiBandingStrength.value : 50
            });
            console.log('If you see a washed-out cyan result, type "toggleLUTDebug()" in the console to enable debugging and try again');

            // Update progress
            const updateProgress = (value, message) => {
                if (progressBar) progressBar.value = value;
                if (progressStatus) progressStatus.textContent = message;
                
                // Force a microtask to give the browser a chance to update the DOM
                return new Promise(resolve => setTimeout(resolve, 0));
            };

            // Create canvases for processing
            await updateProgress(10, 'Preparing images...');
            const referenceCanvas = this.createCanvas(this.referenceImage);
            const targetCanvas = this.createCanvas(this.targetImage);
            
            // Calculate LUT
            try {
                await updateProgress(20, 'Analyzing color statistics...');
                
                // Define a progress updater function for the calculateLUT method
                let lastProgress = 20;
                const lutProgressCallback = async (percent, statusMessage) => {
                    // Scale the progress from 20-80% of the total
                    const scaledPercent = 20 + (percent * 0.6);
                    lastProgress = scaledPercent;
                    await updateProgress(scaledPercent, statusMessage || 'Processing...');
                };
                
                this.lut = await this.calculateLUT(referenceCanvas, targetCanvas, lutProgressCallback);
                await updateProgress(85, 'Rendering final image...');
            } catch (error) {
                console.error('Error calculating LUT:', error);
                this.showToast('Error generating color transformation. Please try different images.');
                if (this.generateButton) {
                    this.generateButton.classList.remove('is-loading');
                }
                
                // Remove the progress modal
                document.body.removeChild(progressModal);
                
                // Reset to the "click to generate" state
                this.emptyResult.innerHTML = `
                    <span class="icon is-large">
                        <i class="fas fa-magic fa-2x"></i>
                    </span>
                    <p class="mt-3">Click here to generate</p>
                `;
                this.emptyResult.style.display = 'flex';
                return;
            }
            
            // Apply LUT to target image
            await updateProgress(90, 'Applying color transformation...');
            const resultCanvas = this.applyLUT(targetCanvas, this.lut);
            
            // Create result image
            const resultImg = new Image();
            resultImg.onload = async () => {
                // Update progress to complete
                await updateProgress(100, 'Complete!');
                
                // Remove the progress modal after a short delay
                setTimeout(() => {
                    try {
                        document.body.removeChild(progressModal);
                    } catch (e) {
                        console.warn('Error removing progress modal:', e);
                    }
                }, 500);
                
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
            };
            
            resultImg.src = resultCanvas.toDataURL('image/jpeg', 0.95);
        } catch (error) {
            console.error('Error generating color transformation:', error);
            this.showToast('Error generating color transformation. Please try again.');
            
            // Remove the progress modal if it exists
            const existingModal = document.querySelector('.modal');
            if (existingModal) {
                document.body.removeChild(existingModal);
            }
            
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
            this.emptyResult.style.display = 'flex';
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the LUT generator
    const lutGenerator = new LUTGenerator();
    
    // No need to call updateMobileUI here
});

// Add CSS for select input style
const style = document.createElement('style');
style.textContent = `
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

// Add CSS for progress modal
const progressStyle = document.createElement('style');
progressStyle.textContent = `
    .modal-content .box {
        padding: 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    .progress {
        height: 20px !important;
        border-radius: 10px;
        overflow: hidden;
    }
    
    .progress::-webkit-progress-bar {
        background-color: #f5f5f5;
    }
    
    .progress::-webkit-progress-value {
        background-color: #4a7bff;
        transition: width 0.3s ease;
    }
    
    .progress::-moz-progress-bar {
        background-color: #4a7bff;
        transition: width 0.3s ease;
    }
    
    #progressStatus {
        font-size: 14px;
        color: #555;
    }
`;
document.head.appendChild(progressStyle);

