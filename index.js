const canvas = document.getElementById("startCanvas");
const ctx = canvas.getContext("2d");
const editedCanvas = document.getElementById("editedCanvas");
const editedctx = editedCanvas.getContext("2d");


var operation_type = document.getElementById("operation-type");
var num_bits = document.getElementById("num-bits");

// draw_image("test.png");

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

        reader.readAsDataURL(file);
    }
});

// Draws an image to the first canvas
function draw_image(source) {
    const img = new Image();
    img.onload = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear any previous image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Draw the image on the canvas
    };
    img.src = source; // Set the image source
}

// Detects when the image modification button has been pressed and acts on it
document.getElementById("modifier").addEventListener('click', function(event) {
    let operation = operation_type.value;
    let number_bits = Number(num_bits.value);

    var imageData = ctx.getImageData(0,0, canvas.width, canvas.height);

    let data = imageData.data;

    switch (Number(operation)) {
        // Uniform quantization
        case ops.UNIFORM_QUANT : data = uniform_quant(data, number_bits); break;

        // Population-based quantization
        case ops.POP_QUANT :data = popularity_quant(data, number_bits); break;

        // median cut quantization
        case ops.MEDIAN_QUANT : console.log("QUANT 3"); break;

        // Idea Josh had for median cut quantization
        case ops.JOSH_QUANT : console.log("QUANT 4"); break;

        // Ordered dithering
        case ops.ORDERED_DITHER : ordered_dither(data, number_bits); break;

        // Error-diffusion dithering
        case ops.FLOYD_DITHER : floyd_dither(data, number_bits); break;

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
function uniform_quant(data, target) {
    let green_bits =  Math.ceil(target/3);
    let red_bits = Math.ceil((target-green_bits)/2);
    let blue_bits =  target-red_bits-green_bits;

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

class Color {
    red;
    green;
    blue;

    occurrences;

    constructor(red, green, blue, occurrences) {
        this.red = red;
        this.green = green;
        this.blue = blue;
        this.occurrences = occurrences;
    }
}

// Maps an input to its closest neighbor out of n closest occurrences
function pop_map(red, green, blue, n, occurrences) {
    let color = [red,green,blue];
    let dist = 1000000;
    for(var i = 0; (i < occurrences.length && i < n); i++){
        let r = occurrences[i].red;
        let g = occurrences[i].green;
        let b = occurrences[i].blue;
        let distance = Math.pow(red-r) + Math.pow(green-g) + Math.pow(blue - b);
        if(distance < dist) {
            dist = distance;
            color = [r,g,b];
        }
    }

    return color;
}

// Popularity-based quantizer.
// Data is an array of pixels, target is the number of bits of color depth to target.
// Assumes the incoming image has 24-bit color depth
function popularity_quant(data, target) {
    let color_arr = new Array();

    for(var i = 0; i < data.length; i += 4) {
        let red = data[i];
        let green = data[i+1];
        let blue = data[i+2];

        let color = new Color(red,green,blue);
        if(!color_arr.some(e => e.red === red && e.green === green && e.blue === blue)) {
            color_arr.push(color);
        }
    }

    console.log(color_arr);

    for(var i = 0; i < data.length; i += 4) {
        let red = data[i];
        let green = data[i+1];
        let blue = data[i+2];

        let colors = pop_map(red, green, blue, Math.pow(2, target), color_arr);

        data[i] = colors[0];
        data[i+1] = colors[1];
        data[i+2] = colors[2];
    }
}

const bayer_pattern =   [   //  16x16 Bayer Dithering Matrix.  Color levels: 256
    [     0, 191,  48, 239,  12, 203,  60, 251,   3, 194,  51, 242,  15, 206,  63, 254  ], 
    [   127,  64, 175, 112, 139,  76, 187, 124, 130,  67, 178, 115, 142,  79, 190, 127  ],
    [    32, 223,  16, 207,  44, 235,  28, 219,  35, 226,  19, 210,  47, 238,  31, 222  ],
    [   159,  96, 143,  80, 171, 108, 155,  92, 162,  99, 146,  83, 174, 111, 158,  95  ],
    [     8, 199,  56, 247,   4, 195,  52, 243,  11, 202,  59, 250,   7, 198,  55, 246  ],
    [   135,  72, 183, 120, 131,  68, 179, 116, 138,  75, 186, 123, 134,  71, 182, 119  ],
    [    40, 231,  24, 215,  36, 227,  20, 211,  43, 234,  27, 218,  39, 230,  23, 214  ],
    [   167, 104, 151,  88, 163, 100, 147,  84, 170, 107, 154,  91, 166, 103, 150,  87  ],
    [     2, 193,  50, 241,  14, 205,  62, 253,   1, 192,  49, 240,  13, 204,  61, 252  ],
    [   129,  66, 177, 114, 141,  78, 189, 126, 128,  65, 176, 113, 140,  77, 188, 125  ],
    [    34, 225,  18, 209,  46, 237,  30, 221,  33, 224,  17, 208,  45, 236,  29, 220  ],
    [   161,  98, 145,  82, 173, 110, 157,  94, 160,  97, 144,  81, 172, 109, 156,  93  ],
    [    10, 201,  58, 249,   6, 197,  54, 245,   9, 200,  57, 248,   5, 196,  53, 244  ],
    [   137,  74, 185, 122, 133,  70, 181, 118, 136,  73, 184, 121, 132,  69, 180, 117  ],
    [    42, 233,  26, 217,  38, 229,  22, 213,  41, 232,  25, 216,  37, 228,  21, 212  ],
    [   169, 106, 153,  90, 165, 102, 149,  86, 168, 105, 152,  89, 164, 101, 148,  85  ]
];

const dx = 16;
const dy = 16;

const width = canvas.width;

// Averages three values
function average(x,y,z) {
    return (x+y+z)/3;
}

// Ordered dither algorithm.
// Converts a color image into a black and white dither
function ordered_dither(data, target) {
    var j = -1;
    for(var i = 0; i < data.length; i += 4) {
        if((i/4)%width == 0) {
            j += 1;
        }

        let red = data[i];
        let green = data[i+1];
        let blue = data[i+2];

        if(average(red,green,blue) > bayer_pattern[(i/4)%dx][j%dy]) {
            data[i] = 255;
            data[i+1] = 255;
            data[i+2] = 255;
        } else {
            data[i] = 0;
            data[i+1] = 0;
            data[i+2] = 0;
        }
    }
}

// Floyd-Steinberg dither algorithm.
// Uses error-diffusion to produce a different result
function floyd_dither(data, target) {
    var j = -1;
    for(var i = 0; i < data.length; i += 4) {
        if((i/4)%width == 0) {
            j += 1;
        }

        let red = data[i];
        let green = data[i+1];
        let blue = data[i+2];

        if(average(red,green,blue) > bayer_pattern[(i/4)%dx][j%dy]) {
            data[i] = 255;
            data[i+1] = 255;
            data[i+2] = 255;
        } else {
            data[i] = 0;
            data[i+1] = 0;
            data[i+2] = 0;
        }
    }
}
