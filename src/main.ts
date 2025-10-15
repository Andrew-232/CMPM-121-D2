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

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      console.error("2D context is not supported by your browser.");
      return;
    }

    // State variables
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    // Drawing Function
    const draw = (e: MouseEvent) => {
      if (!isDrawing) return;

      ctx.strokeStyle = "#000000"; // Black color
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Draws the line
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();

      [lastX, lastY] = [e.offsetX, e.offsetY];
    };

    // When the mouse is pressed down
    canvas.addEventListener("mousedown", (e: MouseEvent) => {
      isDrawing = true;
      [lastX, lastY] = [e.offsetX, e.offsetY];
    });

    // When the mouse is moved
    canvas.addEventListener("mousemove", draw);
    // When the mouse is released
    canvas.addEventListener("mouseup", () => isDrawing = false);
    // Stops drawing if the mouse leaves the canvas area
    canvas.addEventListener("mouseout", () => isDrawing = false);

    // Clear Button
    const clearButton = document.createElement("button");
    clearButton.textContent = "Clear Canvas";
    clearButton.style.display = "block";
    clearButton.style.margin = "10px auto";
    clearButton.style.padding = "10px 20px";
    clearButton.style.fontSize = "16px";
    clearButton.style.cursor = "pointer";

    clearButton.addEventListener("click", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    body.appendChild(clearButton);
  }
});
