import requests

# Define the API endpoint
url = "http://127.0.0.1:5000/predict"

# Choose an image from the generated ones
image_path = "backend/test_images/digit_3_7.png"  # Change this filename as needed

# Send the request
with open(image_path, "rb") as img:
    files = {"file": img}
    response = requests.post(url, files=files)

# Print the response
print(response.json())
