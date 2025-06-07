let img;
let halftonedImg;
let canvas;
let density = 60;
let defaultImageLoaded = false;

function setup() {
    canvas = createCanvas(1, 1);
    canvas.parent('canvas-container');
    noLoop();

    // Load default image
    let defaultImageSrc = 'nottestellata.webp';
    loadImage(defaultImageSrc, (loadedImg) => {
        img = loadedImg;
        defaultImageLoaded = true;

        const preview = document.getElementById('image-preview');
        preview.src = defaultImageSrc;

        preview.onload = () => {
            resizeCanvas(img.width, img.height);
            halftonedImg = halftone(img);
            redraw();

            // Show controls
            document.getElementById('controls').style.display = 'flex';
            
            // Slider color
            setSliderColorFromImage(img);
        };
    });
}

function draw() {
    if (halftonedImg) {
        const scaleFactor = min(800 / halftonedImg.width, 1); // scale down if too big
        const displayWidth = halftonedImg.width * scaleFactor;
        const displayHeight = halftonedImg.height * scaleFactor;

        // Resize actual canvas to image size
        resizeCanvas(halftonedImg.width, halftonedImg.height);

        // Scale display size via CSS (without affecting resolution)
        canvas.elt.style.width = `${displayWidth}px`;
        canvas.elt.style.height = `${displayHeight}px`;

        image(halftonedImg, 0, 0);
    }
}

function halftone(sourceImg) {
    const cellSize = sourceImg.width / density;
    const rows = floor(sourceImg.height / cellSize);
    const cols = density;

    const result = createGraphics(sourceImg.width, rows * cellSize);
    result.background(0);

    sourceImg.loadPixels();

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
        const xStart = floor(col * cellSize);
        const yStart = floor(row * cellSize);
        const xEnd = floor((col + 1) * cellSize);
        const yEnd = floor((row + 1) * cellSize);

        let rSum = 0, gSum = 0, bSum = 0, count = 0;

        for (let y = yStart; y < yEnd && y < sourceImg.height; y++) {
            for (let x = xStart; x < xEnd && x < sourceImg.width; x++) {
            const i = (x + y * sourceImg.width) * 4;
            rSum += sourceImg.pixels[i];
            gSum += sourceImg.pixels[i + 1];
            bSum += sourceImg.pixels[i + 2];
            count++;
            }
        }

        const avgR = rSum / count;
        const avgG = gSum / count;
        const avgB = bSum / count;

        result.noStroke();
        result.fill(avgR, avgG, avgB);
        result.circle(
            xStart + cellSize / 2,
            yStart + cellSize / 2,
            cellSize
        );
        }
    }

    return result;
}

// Image upload
document.getElementById('image-input').addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            loadImage(e.target.result, (loadedImg) => {
                img = loadedImg;

                const preview = document.getElementById('image-preview');
                preview.src = e.target.result;

                preview.onload = () => {
                    resizeCanvas(img.width, img.height);
                    halftonedImg = halftone(img);
                    redraw();

                    document.getElementById('controls').style.display = 'flex';
                    setSliderColorFromImage(img);
                };
            });
        };
        reader.readAsDataURL(file);
    }
});

// Density slider
const densitySlider = document.getElementById('density-slider');
const densityValue = document.getElementById('density-value');
densitySlider.addEventListener('input', () => {
    density = parseInt(densitySlider.value);
    densityValue.textContent = density;
    if (img) {
        halftonedImg = halftone(img);
        redraw();
    }
});

// Reset
document.getElementById('reset-density').addEventListener('click', () => {
    densitySlider.value = 60;
    densityValue.textContent = 60;
    density = 60;
    if (img) {
        halftonedImg = halftone(img);
        redraw();
    }
});

// Save
document.getElementById('save-image').addEventListener('click', () => {
    if (halftonedImg) {
        save(halftonedImg, 'puntified.png');
    }
});

// Slider color
function setSliderColorFromImage(image) {
    image.loadPixels();
    let r = 0, g = 0, b = 0, count = 0;

    for (let y = 0; y < image.height; y += 10) {
        for (let x = 0; x < image.width; x += 10) {
            const i = (x + y * image.width) * 4;
            r += image.pixels[i];
            g += image.pixels[i + 1];
            b += image.pixels[i + 2];
            count++;
        }
    }

    r = Math.round(r / count);
    g = Math.round(g / count);
    b = Math.round(b / count);

    const hsl = rgbToHSL(r, g, b);

    // Saturation set to 100%, keep H
    const colorString = `hsl(${Math.round(hsl.h)}, 100%, 50%)`;

    const slider = document.getElementById('density-slider');
    slider.style.setProperty('--slider-color', colorString);
}

function rgbToHSL(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = 0; // achromatic
    } else {
        const d = max - min;
        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
                break;
            case g:
                h = ((b - r) / d + 2) * 60;
                break;
            case b:
                h = ((r - g) / d + 4) * 60;
                break;
        }
    }

    return { h, l: l * 100 };
}
