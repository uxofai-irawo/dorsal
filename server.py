from flask import Flask, request, send_file
from flask_cors import CORS
import mediapipe as mp
import numpy as np
import cv2
from PIL import Image
import io

app = Flask(__name__)
CORS(app)  # Allow cross-origin from p5.js

# Initialize MediaPipe face detection
mp_face_detection = mp.solutions.face_detection

# Create both detectors for different ranges
detectors = [
    mp_face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.2),
    mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.2)
]

@app.route('/mask-face', methods=['POST'])
def mask_face():
    if 'image' not in request.files:
        return 'No image uploaded', 400

    file = request.files['image']
    image = Image.open(file.stream).convert('RGB')
    image_np = np.array(image)

    h, w = image_np.shape[:2]
    mask = np.zeros((h, w), dtype=np.uint8)

    all_detections = []

    # Run both detectors and combine results
    for detector in detectors:
        results = detector.process(cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR))
        if results.detections:
            all_detections.extend(results.detections)

    box_dims = [];

    for detection in all_detections:
        score = detection.score[0]
        bbox = detection.location_data.relative_bounding_box
        x = int(bbox.xmin * w)
        y = int(bbox.ymin * h)
        box_width = int(bbox.width * w)
        box_height = int(bbox.height * h)

        print(f"Score: {score}, BBox: {bbox}")

        # Scale box size
        width_scale = 1.5
        height_scale = 2

        cx = x + box_width // 2
        cy = y + box_height // 2

        half_w = int(box_width * width_scale / 2)
        half_h = int(box_height * height_scale / 2)

        # maybe store this somewhere else, id which bounding box is the most confident, and then draw the masks? you need to 
        # keep track of the width and height and things
        x1 = max(cx - half_w, 0)
        y1 = max(cy - half_h, 0)
        x2 = min(cx + half_w, w)
        y2 = min(cy + half_h, h)
        
        # add each of the boxes to an array
        box_dims.append((x1,y1,x2,y2, detection.score[0]))
    
    # sort the array of boxes
    box_dims.sort(key=lambda x: x[4])
    print(f"All box dims (sorted by confidence):")
    for i, box in enumerate(box_dims):
        print(f"Box {i}: Score {box[4]}, Coords {box[:4]}")

    # DEBUG: check which boxes are being masked
    print("Boxes being masked (excluding most confident):")
    for box in box_dims[0:-1]:
        print(f"Masking box: {box}")

    #Draw rectangles around all the boxes except the biggest one
    for x1,y1,x2,y2,box_area in box_dims[0:-1]:
        # this would be a sencond forloop where all the ones that are not the biggest/most confident get masked
        cv2.rectangle(mask, (x1, y1), (x2, y2), 255, thickness=-1)

    print(f"Detected {len(all_detections)} face(s)")

    _, buffer = cv2.imencode('.jpg', mask)
    io_buf = io.BytesIO(buffer)

    return send_file(io_buf, mimetype='image/png')

if __name__ == '__main__':
    app.run(debug=True)