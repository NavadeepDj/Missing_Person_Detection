ArcFace backend (FastAPI)

Routes:
- POST /process-image -> multipart form file upload, returns { success, embedding, faceDetected }
- POST /match -> accepts { embedding1, embedding2 } -> returns cosine similarity

To run locally:
1. python -m venv .venv
2. .\.venv\Scripts\Activate.ps1
3. pip install -r requirements.txt
4. python app.py

Notes:
- Adjust CORS origins in app.py if your frontend runs on a different origin.
- Ensure an ONNX ArcFace model is present at `models/arcface.onnx` or `arcface.onnx` in repo root.
- The preprocessing follows the Python reference in your TSX: resize 112x112, normalize (img-127.5)/128.0, NCHW input for ONNX.
