document.addEventListener("DOMContentLoaded", function () {
    const navbarContainer = document.getElementById("navbar");

    if (!navbarContainer) {
        console.error("❌ Navbar container not found!");
        return;
    }

    fetch("navbar.html")
        .then(response => {
            if (!response.ok) {
                throw new Error(`Navbar file not found: ${response.status} ${response.statusText}`);
            }
            return response.text();
        })
        .then(data => {
            navbarContainer.innerHTML = data;
        })
        .catch(error => {
            console.error("❌ Error loading navbar:", error);
            navbarContainer.innerHTML = "<p>⚠️ Navbar failed to load.</p>";
        });
});
