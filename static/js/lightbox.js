document.addEventListener("DOMContentLoaded", () => {
    const images = document.querySelectorAll(".post-content img");

    const lightbox = document.createElement("div");
    lightbox.className = "image-lightbox";

    const enlargedImage = document.createElement("img");
    enlargedImage.alt = "";

    lightbox.appendChild(enlargedImage);
    document.body.appendChild(lightbox);

    function closeLightbox() {
        lightbox.classList.remove("active");
        document.body.style.overflow = "";
        enlargedImage.removeAttribute("src");
    }

    images.forEach((image) => {
        image.style.cursor = "zoom-in";

        image.addEventListener("click", () => {
            enlargedImage.src = image.currentSrc || image.src;
            enlargedImage.alt = image.alt;

            lightbox.classList.add("active");
            document.body.style.overflow = "hidden";
        });
    });

    lightbox.addEventListener("click", closeLightbox);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeLightbox();
        }
    });
});