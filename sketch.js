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

async function preload() {
  screenone = loadImage("step1.png");
  screentwo = loadImage("step2.png");
  //await loadGradio();
 // mClient = await GradioClient.connect("https://a8a7a3e6743e4d1c42.gradio.live/");
}

function setup() {

  createCanvas(windowWidth, windowHeight-10);
  //background(174, 198, 207);
  textSize(18);
  video = createCapture(VIDEO,{ flipped:true });
  video.hide();

  video.size(640*0.9, 480*0.9); //change the size to 320 x 240
 
  upload = createFileInput(handleFileUpload);
  upload.position((windowWidth/3), windowHeight - 120, 640*0.9, 480*0.9); // Position it under the snap button

  fill(0);
  rect((windowWidth/14), (windowHeight/10), 640*0.9, 480*0.9);
  
}

function draw() {
  //background(255);

  // state managment
  if (state == 0) {
    image(screenone, 0, 0, windowHeight, windowHeight);
    next = createButton('next');
    next.position((windowWidth/11)*5, (windowHeight/21))
    next.mousePressed(nextPage);
  } else if (state == 1) {
    image(screentwo, 0, 0, windowHeight, windowHeight);
    upload.hide();
  }
  if (snapped == false) {
    image(origImg, (windowWidth/14), (windowHeight/10), 640*0.9, 480*0.9);
  }

  // IDK IF I ACTUALLY NEED THIS BC IM DOING TWO SEPARATE SCREENS
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
  /*
  if (maskImg) {

    maskImg.loadPixels();
    for (let i=0; i<maskImg.pixels.length; i+=4) {
      maskImg.pixels[i+3] = 255 - maskImg.pixels[i+0];
    }
    maskImg.updatePixels(); 


    image(backImg, (windowWidth/14), (windowHeight/10), 640*0.9, 480*0.9);

    origImg.mask(maskImg);
    image(origImg, (windowWidth/14), (windowHeight/10), 640*0.9, 480*0.9);
  }*/
  if (backImg) {
    image(backImg, (windowWidth/14), (windowHeight/10), 640*0.9, 480*0.9);
  }  
  
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
        backImg = img; // 1:22PM I JUST CHANGED FROM MASKIMG IDRK WHY
        console.log("Inpainted image loaded");
        save(origImg, 'base_image.jpg');  // Optionally save base image
        save(maskImg, 'mask.jpg');         // Optionally save mask
      });
    })
    .catch(err => {
      console.error("Error sending to server or loading inpainted image:", err);
    });;
  }, 'image/jpeg');

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
    });
  } else {
    console.log('Not an image file!');
  }
}

function nextPage() {
  state = state + 1;
  sendImageToServer(origImg);
}

function keyPressed() {
  if (key === ' ') {
    takesnap(); // Call your function
  }
}