let video;
let button;
let next;
let upload;

let maskImg;
let origImg;
let backImg;
let screenone;
let taken = false;
let state = 0;
let snapped = true;

let mClient;

function preload() {
  one = loadImage("step9.png");
  two = loadImage("step10.png");
  three = loadImage("step11.png");
  four = loadImage("step12.png");
  five = loadImage("step13.png");
  six = loadImage("step14.png");
  seven = loadImage("step15.png");
  eight = loadImage("step16.png");
  nine = loadImage("step17.png");
  ten = loadImage("step18.png");
  eleven = loadImage("step19.png");
  twelve = loadImage("step20.png");

}

function setup() {

  createCanvas(windowWidth, windowHeight-10);
  //background(174, 198, 207);
  textSize(18);
  /*
  video = createCapture(VIDEO,{ flipped:true });
  video.hide();

  video.size(640*0.9, 480*0.9); //change the size to 320 x 240
 
  upload = createFileInput(handleFileUpload);
  upload.position((windowWidth/3), windowHeight - 120, 640*0.9, 480*0.9); // Position it under the snap button
  */

  fill(0);
  rect((windowWidth/14), (windowHeight/10), 640*0.9, 480*0.9);
}

function draw() {
  //background(255);
  console.log(state);

  // state managment
  if (state == 0) {
    image(one, 0, 0, windowHeight, windowHeight);
  } else if (state == 1) {
    image(two, 0, 0, windowHeight, windowHeight);
    
  } else if (state ==2) {
    image(three, 0, 0, windowHeight, windowHeight);
  } else if (state == 3) {
    image(four, 0, 0, windowHeight, windowHeight);
  } else if (state == 4) {
    image(five, 0, 0, windowHeight, windowHeight);
  } else if (state == 5) {
    image(six, 0, 0, windowHeight, windowHeight);
  } else if (state == 6) {
    image(seven, 0, 0, windowHeight, windowHeight);
  } else if (state == 7) {
    image(eight, 0, 0, windowHeight, windowHeight);
  } else if (state == 8) {
    image(nine, 0, 0, windowHeight, windowHeight);
  } else if (state == 9) {
    image(ten, 0, 0, windowHeight, windowHeight);
  } else if (state == 10) {
    image(eleven, 0, 0, windowHeight, windowHeight);
  } else if (state == 11) {
    image(twelve, 0, 0, windowHeight, windowHeight);
  } else if (state > 11) {
    state = 0;
  }

  if (snapped == false) {
    image(origImg, (windowWidth/14), (windowHeight/10), 640*0.9, 480*0.9);
  }

  /* IDK IF I ACTUALLY NEED THIS BC IM DOING TWO SEPARATE SCREENS
  if (taken) {
    if (snapped) {
      fill(0);
      rect((windowWidth/14), (windowHeight/10), 640*0.9, 480*0.9);
    }
    setTimeout(() => {
      image(origImg, (windowWidth/14), (windowHeight/10), 640*0.9, 480*0.9);
      snapped = false;
    }, 500); // 100ms delay for the flash effect
  } else {
    image(video, (windowWidth/14), (windowHeight/10));
  }
  
  if (maskImg) {
    words = "select mask";

    maskImg.loadPixels();
    for (let i=0; i<maskImg.pixels.length; i+=4) {
      maskImg.pixels[i+3] = 255 - maskImg.pixels[i+0];
    }
    maskImg.updatePixels(); 

    origImg.mask(maskImg);
    image(origImg, (windowWidth/14), (windowHeight/10), 640*0.9, 480*0.9);
  }
  */
  
}

function takesnap() {
  image(video, (windowWidth/14), (windowHeight/10), 640*0.9, 480*0.9); //draw the image being captured on webcam onto the canvas at the position (0, 0) of the canvas
  
  origImg = video.get();
  taken = true;
}

// this generates a mask and regular image using mediapipe
function sendImageToServer(img) {
  const canvas = createGraphics(img.width, img.height);
  canvas.image(img, 0, 0);
  canvas.loadPixels();

  canvas.elt.toBlob((blob) => {
    const formData = new FormData();
    formData.append('image', blob, 'capture.jpg');

    fetch('http://127.0.0.1:5000/mask-face', {
      method: 'POST',
      body: formData,
    })
    .then(response => response.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob);
      loadImage(url, (img) => {
        maskImg = img;
        save(origImg, 'base_image.jpg');  // Optionally save base image
        save(maskImg, 'mask.jpg');         // Optionally save mask
      });
    });
  }, 'image/jpg');

}

function handleFileUpload(file) {
  if (file.type === 'image') {
    loadImage(file.data, (img) => {
      // Resize uploaded image to roughly match camera size while keeping aspect ratio
      const targetHeight = 480; // Same as video feed
      const aspectRatio = img.width / img.height;
      const targetWidth = targetHeight * aspectRatio;

      img.resize(targetWidth, targetHeight); // Resizes while keeping aspect

      origImg = img; // Save resized image
      taken = true;
      words = "loading...";

      sendImageToServer(origImg);
    });
  } else {
    console.log('Not an image file!');
  }
}

function mouseClicked(){
  state = state + 1;
}


function keyPressed() {
  if (key === ' ') {
    //takesnap(); // Call your function
    state = state - 1;
  }
}