const canvas = document.getElementById("startCanvas");
const ctx = canvas.getContext("2d");
const editedCanvas = document.getElementById("editedCanvas");
const editedctx = editedCanvas.getContext("2d");

var operation_type = document.getElementById("operation-type");

draw_image("test.png");

const ops = {
    UNIFORM_QUANT : 1,
    POP_QUANT : 2,
    MEDIAN_QUANT : 3,
    JOSH_QUANT: 4,
    ORDERED_DITHER: 5,
    FLOYD_DITHER : 6,
}

// Detects when an image has been selected by the user and displays it in the first canvas box
document.getElementById('image-selector').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();

        reader.onload = function(e) {
            draw_image(e.target.result);
        };

        reader.readAsDataURL(file); // Read the file as a data URL
    }
});

// Function that draws an image to the first canvas
function draw_image(source) {
    const img = new Image();
    img.onload = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear any previous image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Draw the image on the canvas
    };
    img.crossOrigin = "Anonymous";
    img.src = source; // Set the image source to the loaded file
}

// Detects when the image modification button has been pressed and acts on it
document.getElementById("modifier").addEventListener('click', function(event) {
    let operation = operation_type.value;

    var imageData = ctx.getImageData(0,0, canvas.width, canvas.height);

    let data = imageData.data;

    switch (Number(operation)) {
        // Uniform quantization
        case ops.UNIFORM_QUANT : data = quant_1(data, 16); break;

        // Population-based quantization
        case ops.POP_QUANT : console.log("QUANT 2"); break;

        // median cut quantization
        case ops.MEDIAN_QUANT : console.log("QUANT 3"); break;

        // Idea Josh had for median cut quantization
        case ops.JOSH_QUANT : console.log("QUANT 4"); break;

        // Ordered dithering
        case ops.ORDERED_DITHER : console.log("DITHER 1"); break;

        default: console.error("OOPS!");
    }

    imageData.data = data;

    editedctx.putImageData(imageData, 0, 0);
});

// Starts with a number of values, i.e. 8 bits or 256 values, and converts to some number of bits, i.e. 3 bits or 8 values
// i.e. map(200, 8, 3) would convert to 207
// i.e. map(20, 8, 3) would convert to 15
function map(input, start_bits, end_bits) {
    let start_range = Math.pow(2,start_bits);
    let chunk_size = start_range/Math.pow(2, end_bits);

    let current_chunk = Math.floor(input/chunk_size) + 0.5;

    return (current_chunk)*(chunk_size)-1;
}

// Uniform quantizer.
// Data is an array of pixels, target is the number of bits of color depth to target.
// Assumes the incoming image has 24-bit color depth
function quant_1(data, target) {
    let red_bits = Math.ceil(target/3);
    let green_bits =  Math.ceil(target/3);
    let blue_bits =  Math.floor(target/3);

    console.log(red_bits,green_bits,blue_bits);

    for(var i = 0; i < data.length; i += 4) {
        let red = data[i];
        let green = data[i+1];
        let blue = data[i+2];

        data[i] = map(red, 8, red_bits);
        data[i+1] = map(green, 8, green_bits);
        data[i+2] = map(blue, 8, blue_bits);
    }
}
