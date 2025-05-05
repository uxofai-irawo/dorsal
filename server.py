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
    mp_face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.05),
    mp_face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.05)
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

    for detection in all_detections:
        bbox = detection.location_data.relative_bounding_box
        x = int(bbox.xmin * w)
        y = int(bbox.ymin * h)
        box_width = int(bbox.width * w)
        box_height = int(bbox.height * h)

        # Scale box size
        width_scale = 1.2
        height_scale = 1.5

        cx = x + box_width // 2
        cy = y + box_height // 2

        half_w = int(box_width * width_scale / 2)
        half_h = int(box_height * height_scale / 2)

        x1 = max(cx - half_w, 0)
        y1 = max(cy - half_h, 0)
        x2 = min(cx + half_w, w)
        y2 = min(cy + half_h, h)

        cv2.rectangle(mask, (x1, y1), (x2, y2), 255, thickness=-1)

    print(f"Detected {len(all_detections)} face(s)")

    _, buffer = cv2.imencode('.jpg', mask)
    io_buf = io.BytesIO(buffer)

    return send_file(io_buf, mimetype='image/png')

if __name__ == '__main__':
    app.run(debug=True)


'''

@app.route('/mask-face', methods=['POST'])
def mask_face():
    file = request.files['image']
    img = Image.open(file.stream).convert('RGB')
    image = np.array(img)
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

    mp_face_mesh = mp.solutions.face_mesh
    face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True)

    mask = np.zeros(image.shape[:2], dtype=np.uint8)
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb_image)

    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            h, w, _ = image.shape
            points = [(int(lm.x * w), int(lm.y * h)) for lm in face_landmarks.landmark]
            FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361,
                         288, 397, 365, 379, 378, 400, 377, 152, 148, 176,
                         149, 150, 136, 172, 58, 132, 93, 234, 127, 162,
                         21, 54, 103, 67, 109]
            oval_pts = np.array([points[i] for i in FACE_OVAL], dtype=np.int32)
            cv2.fillPoly(mask, [oval_pts], 255)

    is_success, buffer = cv2.imencode(".png", mask)
    io_buf = io.BytesIO(buffer)
    return send_file(io_buf, mimetype='image/png')

if __name__ == '__main__':
    app.run(debug=True)


'''