document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;

  if (body) {
    // This is the title of the screen
    const appTitle = document.createElement("h1");
    appTitle.textContent = "D2 SketchPad";
    appTitle.style.textAlign = "center";
    appTitle.style.fontFamily = "Arial, sans-serif";
    appTitle.style.color = "#2c3e50";

    body.prepend(appTitle);

    // This is where the canvas is created
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;

    canvas.style.display = "block"; // this makes the margin auto work
    canvas.style.margin = "20px auto"; // this centers the canvas horizontally
    canvas.style.border = "1px solid #333"; // this adds a border to make it visible
    canvas.style.backgroundColor = "#f0f0f0"; // this gives it a light background color

    canvas.style.borderRadius = "12px"; // This creates the rounded corners.
    canvas.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.15)"; // This adds the shadow effect.

    body.appendChild(canvas);
  }
});
