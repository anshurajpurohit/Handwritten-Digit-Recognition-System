import os
import numpy as np
from tensorflow.keras.datasets import mnist
from PIL import Image

# Load MNIST dataset
(x_train, y_train), (_, _) = mnist.load_data()

# Create a folder to store test images
save_folder = "backend/test_images"
os.makedirs(save_folder, exist_ok=True)

# Save 10 sample images with labels
for i in range(10):
    image = x_train[i]  # Get image
    label = y_train[i]  # Get corresponding label
    
    # Convert to PIL image and save
    image_path = os.path.join(save_folder, f"digit_{label}_{i}.png")
    Image.fromarray(image).convert("L").save(image_path)

print(f"Saved 10 MNIST test images in {save_folder}")
