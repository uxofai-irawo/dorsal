from flask import Flask, request, send_file
from flask_cors import CORS
import mediapipe as mp
import numpy as np

import requests
import base64

import cv2
from PIL import Image
import io

app = Flask(__name__)
CORS(app)  # Allow cross-origin from p5.js

# face detection, not face mask
mp_face_detection = mp.solutions.face_detection
face_detection = mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5)

@app.route('/mask-face', methods=['POST'])
def mask_face():
    if 'image' not in request.files:
        return 'No image uploaded', 400

    file = request.files['image']
    image = Image.open(file.stream).convert('RGB')
    image_np = np.array(image)

    h, w = image_np.shape[:2] # NEW THING (moved from within "for detection in results.detections")

    # Prepare a blank black mask
    #mask = np.zeros(image_np.shape[:2], dtype=np.uint8)
    mask = np.zeros((h, w), dtype=np.uint8) # NEW THING

    # Run face detection
    results = face_detection.process(cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR))

    if results.detections:
        for detection in results.detections:
            bbox = detection.location_data.relative_bounding_box

            x = int(bbox.xmin * w)
            y = int(bbox.ymin * h)
            box_width = int(bbox.width * w)
            box_height = int(bbox.height * h)

            # Scale box size
            width_scale = 1.7  # make box 1.5x the face width
            height_scale = 2  # make box 1.8x the face height

            # Compute center of the box
            cx = x + box_width // 2
            cy = y + box_height // 2

            # New half-width and half-height after scaling
            half_w = int(box_width * width_scale / 2)
            half_h = int(box_height * height_scale / 2)

            # Compute expanded rectangle coordinates
            x1 = max(cx - half_w, 0)
            y1 = max(cy - half_h, 0)
            x2 = min(cx + half_w, w)
            y2 = min(cy + half_h, h)

            # Fill rectangle in mask
            cv2.rectangle(mask, (x1, y1), (x2, y2), 255, thickness=-1)

'''
    # NEW NEW NEW FOR GRADIO
    # Convert mask to PIL Image
    mask_img = Image.fromarray(mask)

    inpainted = send_to_gradio(image, mask_img)
    if inpainted is None:
        return 'Gradio request failed', 500
    
    # Return result image as JPEG
    buf = io.BytesIO()
    inpainted.save(buf, format='JPEG')
    buf.seek(0)
    return send_file(buf, mimetype='image/jpeg')

    ##########################

    # Convert mask to JPG to send back
    #_, buffer = cv2.imencode('.jpg', mask)
    #io_buf = io.BytesIO(buffer)

    #return send_file(io_buf, mimetype='image/jpg')


# this handles the stable diffusion
def pil_to_base64(pil_img):
    buffered = io.BytesIO()
    pil_img.save(buffered, format="JPEG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")

def send_to_gradio(image, mask):
    img_b64 = pil_to_base64(image)
    mask_b64 = pil_to_base64(mask)

    payload = {
        "data": [
            f"data:image/jpeg;base64,{img_b64}",
            f"data:image/jpeg;base64,{mask_b64}"
        ]
    }

    try:
        response = requests.post(
            "https://d848045d1402d6c3c2.gradio.live/inpaint",  # likely your endpoint
            json=payload
        )

        if response.status_code == 200:
            output_b64 = response.json()['data'][0]  # this is usually a base64 string
            # Remove data:image/jpeg;base64, prefix if present
            base64_data = output_b64.split(",")[-1]
            img_bytes = io.BytesIO(base64.b64decode(base64_data))
            return Image.open(img_bytes)
        else:
            print(f"Gradio returned error {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print("Error calling Gradio:", str(e))
        return None

'''
if __name__ == '__main__':
    app.run(debug=True)