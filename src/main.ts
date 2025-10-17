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

    type Point = { x: number; y: number };
    type Line = Point[];
    // This array will store all the lines the user draws.
    let lines: Line[] = [];

    // State variable
    let isDrawing = false;

    const dispatchDrawingChanged = () => {
      console.log("Dispatching 'drawing-changed' event.");
      const event = new CustomEvent("drawing-changed");
      canvas.dispatchEvent(event);
    };

    // When the mouse is pressed down, start a new line in our data array.
    canvas.addEventListener("mousedown", (e: MouseEvent) => {
      isDrawing = true;
      // Create a new line array for the new stroke
      const newLine: Line = [{ x: e.offsetX, y: e.offsetY }];
      lines.push(newLine);
      console.log("Mouse Down: Started a new line. Total lines:", lines.length);
      dispatchDrawingChanged();
    });

    // When the mouse is moved, add a new point to the current line.
    canvas.addEventListener("mousemove", (e: MouseEvent) => {
      if (!isDrawing) return;

      // Finds the line we are currently drawing (the last one in the array)
      const currentLine = lines[lines.length - 1];

      if (currentLine) {
        currentLine.push({ x: e.offsetX, y: e.offsetY });
        dispatchDrawingChanged();
      }
    });

    // When the mouse is released, stops drawing.
    canvas.addEventListener("mouseup", () => {
      if (isDrawing) {
        console.log("Mouse Up: Finished drawing line.");
        isDrawing = false;
      }
    });

    // When the mouse leaves the canvas, stops drawing.
    canvas.addEventListener("mouseout", () => {
      if (isDrawing) {
        console.log("Mouse out of bounds: Paused drawing line.");
        isDrawing = false;
      }
    });

    // Observer that redraws the canvas when the data changes
    canvas.addEventListener("drawing-changed", () => {
      console.log(
        `Event received: Redrawing canvas with ${lines.length} line(s).`,
      );
      console.log("Current data:", JSON.parse(JSON.stringify(lines)));

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Redraws everything from the 'lines' data array
      for (const line of lines) {
        const startPoint = line[0];

        if (!startPoint || line.length < 2) {
          continue;
        }

        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);

        for (let i = 1; i < line.length; i++) {
          const subsequentPoint = line[i];
          if (subsequentPoint) {
            ctx.lineTo(subsequentPoint.x, subsequentPoint.y);
          }
        }
        ctx.stroke();
      }
    });

    // Changed the clear button which now clears data and dispatches an event
    const clearButton = document.createElement("button");
    clearButton.textContent = "Clear Canvas";
    clearButton.style.display = "block";
    clearButton.style.margin = "10px auto";
    clearButton.style.padding = "10px 20px";
    clearButton.style.fontSize = "16px";
    clearButton.style.cursor = "pointer";

    clearButton.addEventListener("click", () => {
      console.log("Clear Button Clicked!");
      lines = [];
      dispatchDrawingChanged();
    });

    body.appendChild(clearButton);
  }
});
