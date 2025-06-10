from fastapi import FastAPI
from pydantic import BaseModel
import pickle
import pandas as pd
import numpy as np

model_path = "sample_reg_donation_sklearn_linear.LinearRegression.sav"

# Load the model
with open(model_path, "rb") as model_file:
    model = pickle.load(model_file)

app = FastAPI()

# Input schema
class InputData(BaseModel):
    age: float
    gender: float
    race: float
    income: float
    employment: float
    employment_length: float
    total_donated_amount: float
    number_of_donation: float

@app.post("/predict")
def predict(data: InputData):
    # Convert input to DataFrame
    input_df = pd.DataFrame([data.dict()])

    if input_df.isna().any().any():
        raise ValueError("Input contains NaN values")
    
    # Perform prediction
    prediction = model.predict(input_df)

    return {"prediction": int(prediction[0])}