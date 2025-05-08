let video;
let button;
let next;
let upload;

let maskImg;
let origImg;
let backImg;
let screenone;
let state = 0;
let snapped = true;
let mClient;
let GradioClient;
let finalImage;
let dorsaled = false;
let origImgOriginal;

async function loadGradio() {
  try {
    const module = await import("https://cdn.jsdelivr.net/npm/@gradio/client/dist/index.min.js");
    GradioClient = module.Client;
  } catch (error) {
    console.error("Failed to load module:", error);
  }
}

function resizeToMultipleOf8(img) {
  let newW = Math.floor(img.width / 8) * 8;
  let newH = Math.floor(img.height / 8) * 8;
  let resized = createImage(newW, newH);
  resized.copy(img, 0, 0, img.width, img.height, 0, 0, newW, newH);
  return resized;
}

async function preload() {
  origImg = loadImage("example.jpg");

  popup = loadImage("strangerpopup.png");

  one = loadImage("step1.png");
  two = loadImage("step2.png");
  three = loadImage("step3.png");
  four = loadImage("step4.png");
  five = loadImage("step5.png");
  six = loadImage("step6.png");

  await loadGradio();
  mClient = await GradioClient.connect("https://e2837e6c20bd4b0896.gradio.live/");
}

function setup() {

  createCanvas(windowWidth, windowHeight-10);
  //background(174, 198, 207);
  textSize(18);
 
  upload = createFileInput(handleFileUpload);
  upload.position(100, 100);
  upload.style('opacity', '0');

  fill(0);
  rect((windowWidth/14), (windowHeight/10), 640*0.9, 480*0.9);
}

function draw() {
  background(255);

  // state managment
  if (state == 0) {
    image(one, 0, 0, windowHeight, windowHeight);
    textSize(14);
    fill(255);
    textAlign(CENTER);
    text('SPACE to upload image\nclick for proceed)', 200, windowHeight - 170);

  } else if (state == 1) {
    //background image
    image(two, 0, 0, windowHeight, windowHeight);
    // show the original image
    image(origImg, (windowWidth/14), (windowHeight/10), 640*1.5, 480*1.5);
     
    //layer the loading thing
    image(popup, (windowWidth/6), (windowHeight/4), 703*0.50, 267 * 0.50);
    
    // send the image to the server
    sendImageToServer(origImgOriginal);
    state++;

  } else if (state == 2 ) { //this is the loading state
    image(two, 0, 0, windowHeight, windowHeight);

    if (dorsaled){
      // show the new image
      image(finalImage, (windowWidth/14), (windowHeight/10), 700, 485);
    } else {
      // show the original image
      image(origImg, (windowWidth/14), (windowHeight/10), 700, 485);
      
      //layer the loading thing
      image(popup, (windowWidth/6), (windowHeight/4), 703*0.50, 267 * 0.50);
    }
    
  } else if (state == 3) {
    image(three, 0, 0, windowHeight, windowHeight);

    //edited image
    image(finalImage, (windowWidth/14), (windowHeight/10), 700, 485);
  } else if (state == 4) {
    image(four, 0, 0, windowHeight, windowHeight);
    
    //edited image
    image(finalImage, (windowWidth/14), (windowHeight/10), 700, 485);
  } else if (state == 5) {
    // this is where the refresh happens
    image(five, 0, 0, windowHeight, windowHeight);
    //edited image
    image(finalImage, (windowWidth/14), (windowHeight/10), 700, 485);

    // send the image to the server
    sendImageToServer(origImgOriginal);
    state++;

  } else if (state == 6) {
    image(five, 0, 0, windowHeight, windowHeight);
    
    if (dorsaled){
      // show the new image
      image(finalImage, (windowWidth/14), (windowHeight/10), 700, 485);
    } else {
      // show the original image
      image(origImg, (windowWidth/14), (windowHeight/10), 700, 485);
      
      //layer the loading thing
      image(popup, (windowWidth/6), (windowHeight/4), 703*0.50, 267 * 0.50);
    }
    
  } else if (state == 7) {
    image(four, 0, 0, windowHeight, windowHeight);
    // show the new image
    image(finalImage, (windowWidth/14), (windowHeight/10), 700, 485);

  } else if (state == 8) {
    image(six, 0, 0, windowHeight, windowHeight);
    // show the new image on the IG feed
    image(finalImage, (windowWidth/14), (windowHeight/7), 700, 485);

  } else if (state > 8) { 
    state = 0;
  }

  if (maskImg) {
    maskImg.loadPixels();
    for (let i=0; i<maskImg.pixels.length; i+=4) {
      maskImg.pixels[i+3] = 255 - maskImg.pixels[i+0];
    }
    maskImg.updatePixels(); 

    origImg.mask(maskImg); 
  }

  if (finalImage) {
    dorsaled = true;
  }
}

function sendImageToServer(img) {
  let resizedImg = resizeToMultipleOf8(img);

  const canvas = createGraphics(resizedImg.width, resizedImg.height);
  canvas.image(resizedImg, 0, 0);
  canvas.loadPixels();

  let imgBlob;

  canvas.elt.toBlob((blob) => {
    const formData = new FormData();
    formData.append('image', blob, 'capture.jpg');

    // save copy of the image that is being sent to mediapipe
    imgBlob = blob;

    fetch('http://127.0.0.1:5000/mask-face', {
      method: 'POST',
      body: formData,
    })
    .then(response => response.blob()) // media pipe sends back and img, turn that into a blob
    .then(blob => {
      const url = URL.createObjectURL(blob);
      loadImage(url, (img) => {
        maskImg = img;
        //save(origImg, 'base_image.jpg');  // Optionally save base image
        //save(maskImg, 'mask.jpg');         // Optionally save mask
      });

      return mClient.predict("/inpaint", {
        img: imgBlob,
        mask: blob,
      });

    })
    .then((imgResults) => {
      console.log(imgResults);
      loadImage(imgResults.data[0].url, (img) => {
        finalImage = img;
        //save(img, 'final.jpg'); // optionally save final image
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
      origImgOriginal = img.get();
    });
  } else {
    console.log('Not an image file!');
  }
}

function mousePressed() {
  if (mouseIsPressed) {
    state = state + 1;
    console.log(state);
  }
}

function keyPressed() {
  if (key === ' ') {
    upload.elt.click();
  }
}