from flask import Flask, request, send_file
from flask_cors import CORS
import cv2
import numpy as np
import mediapipe as mp
import io
from PIL import Image

app = Flask(__name__)
CORS(app)  # Allow cross-origin from p5.js

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
