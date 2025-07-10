from fastapi import FastAPI, UploadFile, File
from typing import List
import torch

model_path = "fashion_mnist_pytorch.pt"

# Load the model
model = torch.load(model_path, weights_only=False)
model.eval()

app = FastAPI()

@app.post("/predict")
async def predict(files: List[UploadFile] = File(...)):
    import tempfile, shutil

    image_paths = []
    for file in files:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            shutil.copyfileobj(file.file, tmp)
            image_paths.append(tmp.name)

    predictions = model.predict(image_paths)
    return {"predictions": predictions.tolist()}