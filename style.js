// Add CSS for modal progress bar
const progressModalStyle = document.createElement('style');
progressModalStyle.textContent = `
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
`;
document.head.appendChild(progressModalStyle); 