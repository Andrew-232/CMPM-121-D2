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
    // A stack to store undone lines for the redo function
    let redoStack: Line[] = [];

    // State variable
    let isDrawing = false;

    const dispatchDrawingChanged = () => {
      const event = new CustomEvent("drawing-changed");
      canvas.dispatchEvent(event);
    };

    // When starting a new line, clear the redo stack
    canvas.addEventListener("mousedown", (e: MouseEvent) => {
      isDrawing = true;
      // Any new drawing action clears the redo history.
      redoStack = [];
      const newLine: Line = [{ x: e.offsetX, y: e.offsetY }];
      lines.push(newLine);
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
        isDrawing = false;
      }
    });

    // When the mouse leaves the canvas, stops drawing.
    canvas.addEventListener("mouseout", () => {
      if (isDrawing) {
        isDrawing = false;
      }
    });

    // Observer that redraws the canvas when the data changes
    canvas.addEventListener("drawing-changed", () => {
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

    // Creates a container to hold all the buttons together
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "center";
    buttonContainer.style.gap = "10px";
    buttonContainer.style.marginTop = "10px";

    // Undo Button
    const undoButton = document.createElement("button");
    undoButton.textContent = "Undo";
    undoButton.style.padding = "10px 20px";
    undoButton.style.fontSize = "16px";
    undoButton.style.cursor = "pointer";

    undoButton.addEventListener("click", () => {
      if (lines.length > 0) {
        const undoneLine = lines.pop();
        if (undoneLine) {
          redoStack.push(undoneLine);
          dispatchDrawingChanged();
        }
      }
    });

    // Redo Button
    const redoButton = document.createElement("button");
    redoButton.textContent = "Redo";
    redoButton.style.padding = "10px 20px";
    redoButton.style.fontSize = "16px";
    redoButton.style.cursor = "pointer";

    redoButton.addEventListener("click", () => {
      if (redoStack.length > 0) {
        const redoneLine = redoStack.pop();
        if (redoneLine) {
          lines.push(redoneLine);
          dispatchDrawingChanged();
        }
      }
    });

    // Clear Button
    const clearButton = document.createElement("button");
    clearButton.textContent = "Clear Canvas";
    clearButton.style.padding = "10px 20px";
    clearButton.style.fontSize = "16px";
    clearButton.style.cursor = "pointer";

    clearButton.addEventListener("click", () => {
      lines = [];
      redoStack = []; // Also clear the redo stack
      dispatchDrawingChanged();
    });

    // Adds all buttons to the single container
    buttonContainer.appendChild(undoButton);
    buttonContainer.appendChild(redoButton);
    buttonContainer.appendChild(clearButton);

    // Adds the container to the body
    body.appendChild(buttonContainer);
  }
});
