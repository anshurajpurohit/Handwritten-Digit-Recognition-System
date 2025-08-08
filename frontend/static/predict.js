const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const imageUpload = document.getElementById("imageUpload");
const predictBtn = document.getElementById("predictBtn");
const clearCanvas = document.getElementById("clearCanvas");
const predictionResult = document.getElementById("predictionResult");

let drawing = false;

// 🎨 Enable Drawing on Canvas
canvas.addEventListener("mousedown", () => (drawing = true));
canvas.addEventListener("mouseup", () => (drawing = false));
canvas.addEventListener("mousemove", draw);

function draw(event) {
    if (!drawing) return;
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(event.offsetX, event.offsetY, 5, 0, Math.PI * 2);
    ctx.fill();
}

// 📸 Upload Image and Draw on Canvas
imageUpload.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// 🗑 Clear Canvas
clearCanvas.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 🏳 Refill with white background (so it's not transparent)
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
});

// 📤 Convert Canvas to Blob (Ensures it's sent as a file)
async function getCanvasBlob() {
    return new Promise((resolve) => {
        let tempCanvas = document.createElement("canvas");
        let tempCtx = tempCanvas.getContext("2d");

        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;

        // 🏳 Fill background with white (fix black image issue)
        tempCtx.fillStyle = "white";
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // 🎨 Copy the actual drawing
        tempCtx.drawImage(canvas, 0, 0);

        // Convert to image blob
        tempCanvas.toBlob((blob) => {
            resolve(blob || new Blob());
        }, "image/png");
    });
}

// 🤖 Predict Digit (Ensures canvas data is always sent)
predictBtn.addEventListener("click", async function () {
    predictionResult.textContent = "Processing...";

    const formData = new FormData();
    const blob = await getCanvasBlob(); // Get drawn image
    formData.append("file", blob, "canvas.png"); // ✅ Ensure correct filename

    try {
        const response = await fetch("http://127.0.0.1:5000/predict", {
            method: "POST",
            body: formData,
        });

        const result = await response.json();

        if (result.digit !== undefined) {
            predictionResult.textContent = "Prediction: " + result.digit;
        } else {
            predictionResult.textContent = "Error: " + result.error;
        }
    } catch (error) {
        predictionResult.textContent = "Server Error: Unable to connect.";
    }
});

// Navbar Scroll Effect
window.addEventListener("scroll", function() {
    let navbar = document.querySelector(".navbar");
    if (window.scrollY > 50) {
        navbar.classList.add("scrolled");
    } else {
        navbar.classList.remove("scrolled");
    }
});

const themeToggle = document.getElementById("theme-toggle");

// Check saved theme on page load
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    themeToggle.textContent = "☀️";
}

// Toggle Dark Mode
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
        themeToggle.textContent = "☀️";
        localStorage.setItem("theme", "dark");
    } else {
        themeToggle.textContent = "🌙";
        localStorage.setItem("theme", "light");
    }
});
