const canvas1 = document.getElementById("canvas1");
const ctx1 = canvas1.getContext("2d");
const upload1 = document.getElementById("upload1");
const clearCanvas1 = document.getElementById("clearCanvas1");

const canvas2 = document.getElementById("canvas2");
const ctx2 = canvas2.getContext("2d");
const upload2 = document.getElementById("upload2");
const clearCanvas2 = document.getElementById("clearCanvas2");

const operation = document.getElementById("operation");
const calculateBtn = document.getElementById("calculateBtn");
const calcResult = document.getElementById("calcResult");

// 🖌 Enable Drawing on Canvases
function enableDrawing(canvas, ctx) {
    let isDrawing = false;

    canvas.addEventListener("mousedown", () => (isDrawing = true));
    canvas.addEventListener("mouseup", () => {
        isDrawing = false;
        ctx.beginPath();
    });
    canvas.addEventListener("mousemove", (event) => {
        if (!isDrawing) return;
        ctx.lineWidth = 8;
        ctx.lineCap = "round";
        ctx.strokeStyle = "black";
        ctx.lineTo(event.offsetX, event.offsetY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(event.offsetX, event.offsetY);
    });
}

enableDrawing(canvas1, ctx1);
enableDrawing(canvas2, ctx2);

// 🖼 Handle Image Upload
function handleImageUpload(event, ctx, canvas) {
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
}

upload1.addEventListener("change", (e) => handleImageUpload(e, ctx1, canvas1));
upload2.addEventListener("change", (e) => handleImageUpload(e, ctx2, canvas2));

// 🧹 Clear Canvas
clearCanvas1.addEventListener("click", () => ctx1.clearRect(0, 0, canvas1.width, canvas1.height));
clearCanvas2.addEventListener("click", () => ctx2.clearRect(0, 0, canvas2.width, canvas2.height));

// 🔄 Convert Canvas to Blob with White Background
function getCanvasBlob(canvas) {
    return new Promise((resolve) => {
        let tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        let tempCtx = tempCanvas.getContext("2d");

        // 🖌 Fill background with white (fixes transparency issue)
        tempCtx.fillStyle = "white";
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(canvas, 0, 0);

        tempCanvas.toBlob(resolve, "image/png");
    });
}

// 🚀 Send Images to Backend for Arithmetic Calculation
calculateBtn.addEventListener("click", async function () {
    calcResult.textContent = "Processing...";

    let blob1 = await getCanvasBlob(canvas1);
    let blob2 = await getCanvasBlob(canvas2);

    if (!blob1 || !blob2) {
        calcResult.textContent = "Please draw or upload digits before calculating!";
        return;
    }

    const formData = new FormData();
    formData.append("file1", blob1, "digit1.png");
    formData.append("file2", blob2, "digit2.png");

    try {
        let response = await fetch("http://127.0.0.1:5000/arithmetic", {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            let errorResponse = await response.json();
            calcResult.textContent = `Error: ${errorResponse.error || "Unknown error"}`;
            return;
        }

        let result = await response.json();
        let operationType = operation.value;

        let operationMap = {
            "+": "addition",
            "-": "subtraction",
            "*": "multiplication",
            "/": "division"
        };

        let displayKey = operationMap[operationType];

        if (result.hasOwnProperty(displayKey)) {
            calcResult.textContent = `Result: ${result[displayKey]}`;
        } else {
            calcResult.textContent = "Error: Invalid operation!";
        }
    } catch (error) {
        console.error("Error:", error);
        calcResult.textContent = "Error: Could not connect to the backend.";
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
