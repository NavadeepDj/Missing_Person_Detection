import cv2
import numpy as np
import mediapipe as mp
import tensorflow as tf
from scipy.spatial.distance import cosine

# Load MobileFaceNet (TF Lite recommended for mobile; here we'll just load pb or h5 if you converted)
interpreter = tf.lite.Interpreter(model_path=r"C:\Users\navad\FAST_Attendance\output_model.tflite")
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

mp_face_detection = mp.solutions.face_detection
mp_drawing = mp.solutions.drawing_utils

def preprocess_face(image):
    """Detect and crop face, resize to 112x112, normalize."""
    if image is None:
        print("❌ Image not found or failed to load!")
        return None
    
    with mp_face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.5) as face_detection:
        results = face_detection.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        
        if not results.detections:
            print("❌ No face detected!")
            return None
        
        bbox = results.detections[0].location_data.relative_bounding_box
        h, w, _ = image.shape
        x1, y1 = max(0, int(bbox.xmin * w)), max(0, int(bbox.ymin * h))
        x2, y2 = min(w, x1 + int(bbox.width * w)), min(h, y1 + int(bbox.height * h))

        face = image[y1:y2, x1:x2]
        if face.size == 0:
            print("⚠️ Cropped face is empty!")
            return None

        face = cv2.resize(face, (112, 112))
        face = face.astype("float32") / 127.5 - 1.0
        return np.expand_dims(face, axis=0)


def get_embedding(face_img):
    """Run TFLite inference to get embedding."""
    interpreter.set_tensor(input_details[0]['index'], face_img)
    interpreter.invoke()
    embedding = interpreter.get_tensor(output_details[0]['index'])
    return embedding.flatten()

# ---- Registration ----
reg_img = cv2.imread("known_faces\\WhatsApp Image 2025-09-07 at 16.53.23_0779b327.jpg")
face_reg = preprocess_face(reg_img)
registered_embedding = get_embedding(face_reg)

# ---- Authentication ----
auth_img = cv2.imread("known_faces\\Professional Photo.jpg")
face_auth = preprocess_face(auth_img)
auth_embedding = get_embedding(face_auth)

similarity = 1 - cosine(registered_embedding, auth_embedding)
print("Similarity Score:", similarity)

if similarity > 0.75:
    print("✅ Authentication Success")
else:
    print("❌ Authentication Failed")
