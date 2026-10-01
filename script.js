const beginButton = document.getElementById("beginBtn");

beginButton.addEventListener("click", () => {

    // Start the cinematic fade
    document.body.classList.add("page-transition");

    // Wait for the fade, then open Chapter 1
    setTimeout(() => {
        window.location.href = "chapters/chapter1.html";
    }, 1200);

});