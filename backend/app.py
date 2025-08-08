from flask import Flask, request, jsonify, session
from flask_cors import CORS
import numpy as np
import tensorflow as tf
from PIL import Image
import io
import os
import cv2
import sqlite3
from flask_bcrypt import Bcrypt

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

app.secret_key = "supersecretkey"  # Change this in production!

# Load trained MNIST model
model_path = os.path.join(os.path.dirname(__file__), "model", "mnist_model.h5")
model = tf.keras.models.load_model(model_path)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# 🗄️ Database Connection
def get_db_connection():
    conn = sqlite3.connect("users.db")
    conn.row_factory = sqlite3.Row
    return conn


# 📝 User Registration
@app.route("/register", methods=["POST"])
def register():
    data = request.json
    username, email, password = data["username"], data["email"], data["password"]
    
    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
                       (username, email, hashed_password))
        conn.commit()
        return jsonify({"message": "Registration successful!"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "User already exists!"}), 409
    finally:
        conn.close()


# 🔑 User Login
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email, password = data["email"], data["password"]

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = cursor.fetchone()
    conn.close()

    if user and bcrypt.check_password_hash(user["password"], password):
        session["user_id"] = user["id"]
        session["username"] = user["username"]
        return jsonify({"message": "Login successful!", "username": user["username"]})
    else:
        return jsonify({"error": "Invalid credentials!"}), 401


# 🚪 User Logout
@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully!"})


# ✅ Check Login Status
@app.route("/check_login", methods=["GET"])
def check_login():
    if "user_id" in session:
        return jsonify({"logged_in": True, "username": session.get("username")})
    return jsonify({"logged_in": False})


# 🔄 Preprocess Image for Prediction
def preprocess_image(image):
    """Preprocess image to match MNIST format (28x28, white digit on black)."""
    try:
        image = image.convert("L")  # Convert to grayscale
        image_np = np.array(image)

        # Automatic Inversion Check
        mean_pixel_value = np.mean(image_np)
        if mean_pixel_value > 128:  # White background detected
            image_np = 255 - image_np  # Invert colors to match MNIST format

        # Ensure the image is not fully black or white
        if np.all(image_np == 0) or np.all(image_np == 255):
            return None

        # Thresholding to remove noise
        _, image_np = cv2.threshold(image_np, 128, 255, cv2.THRESH_BINARY)

        # Find contours to detect the digit
        contours, _ = cv2.findContours(image_np, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if contours:
            x, y, w, h = cv2.boundingRect(contours[0])  # Get bounding box
            digit = image_np[y:y+h, x:x+w]  # Crop the digit

            # Resize to 20x20 and pad to 28x28
            digit = cv2.resize(digit, (20, 20), interpolation=cv2.INTER_AREA)
            padded_digit = np.pad(digit, ((4, 4), (4, 4)), mode='constant', constant_values=0)
        else:
            padded_digit = np.zeros((28, 28), dtype=np.uint8)  # Return blank if no digit detected

        # Normalize pixel values
        padded_digit = padded_digit.astype("float32") / 255.0  

        # Reshape for model input
        return padded_digit.reshape(1, 28, 28, 1)

    except Exception as e:
        print(f"❌ Error in preprocess_image: {str(e)}")
        return None


# 🔢 Digit Prediction
@app.route("/predict", methods=["POST"])
def predict_digit():
    """Predict a single digit from an uploaded image."""
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    try:
        image = Image.open(io.BytesIO(file.read()))
        processed_image = preprocess_image(image)

        if processed_image is None:
            return jsonify({"error": "Invalid image format"}), 400

        # Get model prediction
        prediction = model.predict(processed_image)
        digit = int(np.argmax(prediction))

        return jsonify({"digit": digit})

    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


# ➕➖✖️➗ Arithmetic Operations
@app.route("/arithmetic", methods=["POST"])
def arithmetic_operation():
    """Perform arithmetic operations on two digit images."""
    if "file1" not in request.files or "file2" not in request.files:
        return jsonify({"error": "Two files must be uploaded"}), 400

    file1 = request.files["file1"]
    file2 = request.files["file2"]

    try:
        image1 = Image.open(io.BytesIO(file1.read()))
        image2 = Image.open(io.BytesIO(file2.read()))

        processed_image1 = preprocess_image(image1)
        processed_image2 = preprocess_image(image2)

        if processed_image1 is None or processed_image2 is None:
            return jsonify({"error": "Invalid image format"}), 400

        # Get predictions for both images
        prediction1 = model.predict(processed_image1)
        prediction2 = model.predict(processed_image2)

        digit1 = int(np.argmax(prediction1))
        digit2 = int(np.argmax(prediction2))

        # Perform arithmetic operations
        results = {
            "digit1": digit1,
            "digit2": digit2,
            "addition": digit1 + digit2,
            "subtraction": digit1 - digit2,
            "multiplication": digit1 * digit2,
            "division": str(digit1 / digit2) if digit2 != 0 else "∞"
        }

        return jsonify(results)

    except Exception as e:
        return jsonify({"error": f"Arithmetic operation failed: {str(e)}"}), 500


# 🚀 Run the Flask Server
if __name__ == "__main__":
    app.run(debug=True, port=5000)
