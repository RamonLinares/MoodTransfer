# MoodTransfer

MoodTransfer is a web-based tool that allows you to transfer the color grading and mood from a reference image to your own images. It also generates industry-standard LUT (Look-Up Table) files that can be imported into video editing software like DaVinci Resolve, Adobe Premiere Pro, and Final Cut Pro.

## Features

- **Color Transfer**: Apply the color characteristics from a reference image to your target image
- **LUT Generation**: Create professional .cube LUT files compatible with major video editing software
- **Adjustable Intensity**: Control the strength of the color transformation with a simple slider
- **Instant Preview**: See the results in real-time before downloading
- **Dark/Light Mode**: Choose your preferred interface theme
- **Mobile Friendly**: Fully responsive design works on all devices

## How It Works

MoodTransfer uses advanced color histogram matching algorithms to analyze the color distribution of your reference image and apply similar characteristics to your target image. The process:

1. Analyzes the color statistics of both reference and target images
2. Creates a mapping between the color spaces
3. Generates a 3D LUT (Look-Up Table) for precise color transformation
4. Applies the transformation with your chosen intensity

## Usage

1. **Upload Reference Image**: This is the image with the color grading/mood you want to copy
2. **Upload Target Image**: This is your image that will receive the color transformation
3. **Adjust Intensity**: Use the slider to control how strongly the effect is applied
4. **Generate**: Click the Generate button to process the images
5. **Download**: Download the result image or the LUT file for use in video editing software

## Installation

MoodTransfer is a client-side web application that runs entirely in your browser. No server-side processing is required.

### Local Development

1. Clone the repository:
   ```
   git clone https://github.com/RamonLinares/moodtransfer.git
   ```

2. Open the project folder:
   ```
   cd moodtransfer
   ```

3. Open `index.html` in your browser or use a local development server.

## Technologies Used

- **HTML5/CSS3**: For structure and styling
- **JavaScript (ES6+)**: For application logic and image processing
- **Bulma CSS Framework**: For responsive UI components
- **Canvas API**: For image manipulation
- **FileReader API**: For handling file uploads

## LUT Compatibility

The generated LUT files (.cube format) are compatible with:

- DaVinci Resolve
- Adobe Premiere Pro
- Adobe After Effects
- Final Cut Pro
- Avid Media Composer
- And most other professional video editing software

## Browser Compatibility

MoodTransfer works in all modern browsers:

- Chrome (recommended for best performance)
- Firefox
- Safari
- Edge

## License

This project is open source and available under the MIT License.

## Acknowledgements

- Made with ♥ for photographers and creators
- Inspired by professional color grading techniques used in film and photography 
