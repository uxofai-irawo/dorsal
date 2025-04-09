let video;
let button;
let upload;

let maskImg;
let origImg;
let backImg;

function preload() {
  backImg = loadImage("pixelimg.png");
}

function setup() {

  createCanvas(windowWidth, windowHeight);
  background(174, 198, 207);
  textSize(18);
  video = createCapture(VIDEO); //access live webcam
  video.size(640, 480); //change the size to 320 x 240
  button = createButton('snap'); //create a button called "snap"
  button.mousePressed(takesnap); //when the button is pressed, call the function called "takesnap"
  video.hide();

  text("download your dorsaled image", 760, windowHeight - 180);
  download = createButton('download image'); //create a button called "snap"
  download.position(760, windowHeight - 165);
  download.attribute('disabled', '');
  download.mousePressed(download);

}

function draw() {
  
  image(video, 30, (windowHeight/2) - 320, 640, 480);
  button.position(30, windowHeight - 165);
  text("click me to take a photo", 30, windowHeight - 180);

  if (maskImg) {
    maskImg.loadPixels();
    for (let i=0; i<maskImg.pixels.length; i+=4) {
      maskImg.pixels[i+3] = 255 - maskImg.pixels[i+0];
    }
    maskImg.updatePixels(); 


    image(backImg, 760, (windowHeight/2) - 320, 640, 480);

    origImg.mask(maskImg);
    image(origImg, 760, (windowHeight/2) - 320);

    //image(maskImg, 760, (windowHeight/2) - 320, 640, 480);
    download.removeAttribute('disabled', '');
  }
  
  
}

function takesnap() {
  //image(video, 760, (windowHeight/2) - 320, 640, 480); //draw the image being captured on webcam onto the canvas at the position (0, 0) of the canvas

  origImg = video.get();

  // save the original photo of you
  //saveCanvas()

  video.loadPixels();
  const canvas = createGraphics(width, height);
  canvas.image(video, 0, 0, width, height);
  canvas.loadPixels();

  // create another image that is the mask vers of you using the server.py script
  canvas.elt.toBlob((blob) => {
    const formData = new FormData();
    formData.append('image', blob, 'capture.png');

    fetch('http://127.0.0.1:5000/mask-face', { // this is the python flask server that wraps the mediapipe script
      method: 'POST',
      body: formData,
    })
    .then(response => response.blob())
    .then(blob => {
      //this just creates an image object, i need to have is accessible by p5.js
      /*const img = createImg(URL.createObjectURL(blob), 'Masked');
      img.position(0, height + 10);
      img.size(width, height);*/

      const url = URL.createObjectURL(blob);
      loadImage(url, (img) => {
        maskImg = img; // Save it for use in draw or wherever
      });

    });
  }, 'image/png');
}

function download() {
  let portion = get(760, (windowHeight/2) - 320, 640, 480); // x, y, width, height
  setTimeout(() => {
    portion.save('dorsaled_image', 'png');
  }, 100);
}