const canvas = document.getElementById("startCanvas");
const ctx = canvas.getContext("2d");
const editedCanvas = document.getElementById("editedCanvas");
const editedctx = editedCanvas.getContext("2d");

// var img = new Image();
// img.crossOrigin = "anonymous";
// img.src = 'testimage.png';

// if (canvas.getContext) {

//     ctx.drawImage(img, 0, 0, canvas.width, canvas.width * (img.height / img.width));

//     var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

//     console.log(imageData);

//     for (var i = 0; i < imageData.length; i += 4) {
//         var brightness = 0.34 * imageData[i] + 0.5 * imageData[i + 1] + 0.16 * imageData[i + 2];
//         imageData[i] = brightness;
//         imageData[i + 1] = brightness;
//         imageData[i + 2] = brightness;
//     }

//     console.log(imageData)

//     editedctx.putImageData(imageData, 0, 0);

// } else {
//     console.error("Canvas not supported!")
// }

document.getElementById('image-selector').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();

        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear any previous image
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Draw the image on the canvas
            };
            img.src = e.target.result; // Set the image source to the loaded file
        };

        reader.readAsDataURL(file); // Read the file as a data URL
    }
});

document.getElementById("quantizer").addEventListener('click', function(event) {
    var imageData = ctx.getImageData(0,0, canvas.width, canvas.height);

    let data = imageData.data;

    for(var i = 0; i < data.length; i += 4) {
        var brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
        data[i] = brightness;
        data[i + 1] = brightness;
        data[i + 2] = brightness;
    }

    imageData.data = data;

    editedctx.putImageData(imageData, 0, 0);
});