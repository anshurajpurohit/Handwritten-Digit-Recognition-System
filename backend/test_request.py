import requests

url = "http://127.0.0.1:5000/arithmetic"

files = {
    "file1": ("digit1.png", open(r"C:\Users\ANSHUMAAN\handwritten_digit_recognition\backend\test_images\digit1.png", "rb"), "image/png"),
    "file2": ("digit2.png", open(r"C:\Users\ANSHUMAAN\handwritten_digit_recognition\backend\test_images\digit2.png", "rb"), "image/png"),
}
data = {"operation": "+"}

response = requests.post(url, files=files, data=data)

print(response.json())
