document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;

  if (body) {
    const styles = `
      .button-container {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-top: 10px;
        flex-wrap: wrap;
        max-width: 600px; /* Limit width for better wrapping */
        margin-left: auto;
        margin-right: auto;
      }
      
      /* Base style for all buttons */
      .tool-button, .control-button {
        padding: 8px 16px;
        font-size: 15px;
        font-family: Arial, sans-serif;
        font-weight: 600;
        cursor: pointer;
        border: 2px solid transparent;
        border-radius: 8px;
        background-color: #ffffff;
        color: #333;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        transition: all 0.2s ease;
      }

      /* Hover effect for all buttons */
      .tool-button:hover, .control-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      }

      /* Active/click effect for all buttons */
      .tool-button:active, .control-button:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      /* Style for tool buttons (pens, stickers) */
      .tool-button {
        min-width: 50px; /* Give emoji buttons a nice width */
      }

      /* Style for the "selected" tool */
      .tool-button.selected {
        border-color: #3498db;
        box-shadow: 0 0 10px rgba(52, 152, 219, 0.5);
        color: #3498db;
      }

      /* Style for control buttons (Undo, Export, etc.) */
      .control-button {
        background-color: #f4f4f4;
        color: #555;
      }
      
      .control-button:hover {
         background-color: #e9e9e9;
      }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

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
    canvas.style.border = "1px solid #ccc";
    canvas.style.backgroundColor = "#f9f9f9";

    canvas.style.borderRadius = "12px"; // This creates the rounded corners.
    canvas.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.10)";

    body.appendChild(canvas);

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      console.error("2D context is not supported by your browser.");
      return;
    }

    type Point = { x: number; y: number };

    interface Drawable {
      draw(ctx: CanvasRenderingContext2D): void;
    }

    class Path implements Drawable {
      private points: Point[];
      private thickness: number;
      private color: string;

      constructor(
        startPoint: Point,
        thickness: number,
        color: string,
      ) {
        this.points = [startPoint];
        this.thickness = thickness;
        this.color = color;
      }

      addPoint(point: Point) {
        this.points.push(point);
      }

      draw(ctx: CanvasRenderingContext2D) {
        const startPoint = this.points[0];

        if (!startPoint || this.points.length < 2) {
          return;
        }

        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.thickness;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);

        for (let i = 1; i < this.points.length; i++) {
          const subsequentPoint = this.points[i];
          if (subsequentPoint) {
            ctx.lineTo(subsequentPoint.x, subsequentPoint.y);
          }
        }
        ctx.stroke();
      }
    }

    // Sticker class (the "command" for placing a sticker)
    class Sticker implements Drawable {
      private position: Point;
      private sticker: string;
      private fontSize: number = 28;

      constructor(startPoint: Point, sticker: string) {
        this.position = startPoint;
        this.sticker = sticker;
      }

      // drag method
      updatePosition(point: Point) {
        this.position = point;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.font = `${this.fontSize}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#000000";
        ctx.fillText(this.sticker, this.position.x, this.position.y);
        ctx.restore();
      }
    }

    class ToolPreview {
      private position: Point;
      private tool: Tool;
      private thickness: number;
      private sticker: string | null;
      private stickerFontSize: number = 28;
      private color: string;

      constructor(
        startPoint: Point,
        tool: Tool,
        options: {
          thickness: number;
          sticker: string | null;
          color: string;
        },
      ) {
        this.position = startPoint;
        this.tool = tool;
        this.thickness = options.thickness;
        this.sticker = options.sticker;
        this.color = options.color;
      }

      updatePosition(point: Point) {
        this.position = point;
      }

      updateTool(
        tool: Tool,
        options: {
          thickness: number;
          sticker: string | null;
          color: string;
        },
      ) {
        this.tool = tool;
        this.thickness = options.thickness;
        this.sticker = options.sticker;
        this.color = options.color;
      }

      draw(ctx: CanvasRenderingContext2D) {
        if (this.tool === "pen") {
          const radius = this.thickness / 2;
          ctx.beginPath();
          ctx.arc(this.position.x, this.position.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.globalAlpha = 0.5;
          ctx.fill();
          ctx.globalAlpha = 1.0;
        } else if (this.tool === "sticker" && this.sticker) {
          ctx.save();
          ctx.font = `${this.stickerFontSize}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.globalAlpha = 0.5;
          ctx.fillText(this.sticker, this.position.x, this.position.y);
          ctx.restore();
        }
      }
    }

    // State variables
    let lines: Drawable[] = [];
    let redoStack: Drawable[] = [];

    type Tool = "pen" | "sticker";
    let currentTool: Tool = "pen";
    let currentSticker: string | null = null;
    const stickers = ["🎨", "✨", "💡", "💖", "🌟"];

    let isDrawing = false;
    const thinValue = 3;
    const thickValue = 10;
    let currentThickness: number = thinValue;
    let currentColor: string = "#000000";
    let currentToolPreview: ToolPreview | null = null;

    const getRandomColor = (): string => {
      const hue = Math.floor(Math.random() * 361);
      return `hsl(${hue}, 100%, 50%)`;
    };

    const dispatchDrawingChanged = () => {
      const event = new CustomEvent("drawing-changed");
      canvas.dispatchEvent(event);
    };

    // mousedown listener now handles both tools
    canvas.addEventListener("mousedown", (e: MouseEvent) => {
      isDrawing = true;
      // Any new drawing action clears the redo history.
      redoStack = [];

      currentToolPreview = null;

      const startPoint = { x: e.offsetX, y: e.offsetY };

      if (currentTool === "pen") {
        const newPath = new Path(startPoint, currentThickness, currentColor);
        lines.push(newPath);
      } else if (currentTool === "sticker" && currentSticker) {
        const newSticker = new Sticker(startPoint, currentSticker);
        lines.push(newSticker);
      }

      dispatchDrawingChanged();
    });

    // mousemove listener handles drawing, dragging, and previewing
    canvas.addEventListener("mousemove", (e: MouseEvent) => {
      const currentPoint = { x: e.offsetX, y: e.offsetY };

      if (isDrawing) {
        const currentDrawable = lines[lines.length - 1];

        if (currentDrawable) {
          if (currentDrawable instanceof Path) {
            currentDrawable.addPoint(currentPoint);
          } else if (currentDrawable instanceof Sticker) {
            currentDrawable.updatePosition(currentPoint);
          }
          dispatchDrawingChanged();
        }
      } else {
        if (!currentToolPreview) {
          currentToolPreview = new ToolPreview(
            currentPoint,
            currentTool,
            {
              thickness: currentThickness,
              sticker: currentSticker,
              color: currentColor,
            },
          );
        } else {
          currentToolPreview.updatePosition(currentPoint);
        }
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

      if (currentToolPreview) {
        currentToolPreview = null;
        dispatchDrawingChanged();
      }
    });

    // Observer that redraws the canvas when the data changes
    canvas.addEventListener("drawing-changed", () => {
      ctx.fillStyle = "#f9f9f9";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const drawable of lines) {
        drawable.draw(ctx);
      }

      if (currentToolPreview) {
        currentToolPreview.draw(ctx);
      }
    });

    // Creates a container to hold all the buttons together
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "button-container";

    const deselectAllTools = () => {
      document.querySelectorAll(".tool-button").forEach((button) => {
        button.classList.remove("selected");
      });
    };

    const thinButton = document.createElement("button");
    thinButton.textContent = "Fine Tip";
    thinButton.className = "tool-button selected";

    const thickButton = document.createElement("button");
    thickButton.textContent = "Broad Tip";
    thickButton.className = "tool-button";

    thinButton.addEventListener("click", () => {
      currentTool = "pen";
      currentThickness = thinValue;
      currentColor = getRandomColor();

      deselectAllTools();
      thinButton.classList.add("selected");

      if (currentToolPreview) {
        currentToolPreview.updateTool(
          currentTool,
          {
            thickness: currentThickness,
            sticker: null,
            color: currentColor,
          },
        );
        dispatchDrawingChanged();
      }
    });

    thickButton.addEventListener("click", () => {
      currentTool = "pen";
      currentThickness = thickValue;
      currentColor = getRandomColor();

      deselectAllTools();
      thickButton.classList.add("selected");

      if (currentToolPreview) {
        currentToolPreview.updateTool(
          currentTool,
          {
            thickness: currentThickness,
            sticker: null,
            color: currentColor,
          },
        );
        dispatchDrawingChanged();
      }
    });

    // Undo Button
    const undoButton = document.createElement("button");
    undoButton.textContent = "Undo";
    undoButton.className = "control-button";

    undoButton.addEventListener("click", () => {
      if (lines.length > 0) {
        const undoneItem = lines.pop();
        if (undoneItem) {
          redoStack.push(undoneItem);
          dispatchDrawingChanged();
        }
      }
    });

    // Redo Button
    const redoButton = document.createElement("button");
    redoButton.textContent = "Redo";
    redoButton.className = "control-button";

    redoButton.addEventListener("click", () => {
      if (redoStack.length > 0) {
        const redoneItem = redoStack.pop();
        if (redoneItem) {
          lines.push(redoneItem);
          dispatchDrawingChanged();
        }
      }
    });

    // Clear Button
    const clearButton = document.createElement("button");
    clearButton.textContent = "Clear";
    clearButton.className = "control-button";

    clearButton.addEventListener("click", () => {
      lines = [];
      redoStack = []; // Also clear the redo stack
      dispatchDrawingChanged();
    });

    // High resolution export
    const exportButton = document.createElement("button");
    exportButton.textContent = "Export PNG";
    exportButton.className = "control-button";

    exportButton.addEventListener("click", () => {
      const exportCanvas = document.createElement("canvas");
      const exportSize = 1024;
      exportCanvas.width = exportSize;
      exportCanvas.height = exportSize;

      const exportCtx = exportCanvas.getContext("2d");

      if (!exportCtx) {
        console.error("Could not create export canvas context.");
        return;
      }

      exportCtx.fillStyle = "#f9f9f9";
      exportCtx.fillRect(0, 0, exportSize, exportSize);

      const scaleFactor = exportSize / canvas.width;
      exportCtx.scale(scaleFactor, scaleFactor);

      // Redraws all drawings
      for (const drawable of lines) {
        drawable.draw(exportCtx);
      }

      // Triggers file download
      const dataUrl = exportCanvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "D2-SketchPad-Export.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });

    // Adds pen buttons to the single container
    buttonContainer.appendChild(thinButton);
    buttonContainer.appendChild(thickButton);

    // Sticker buttons
    const createStickerButton = (stickerEmoji: string): HTMLButtonElement => {
      const button = document.createElement("button");
      button.textContent = stickerEmoji;
      button.className = "tool-button";

      button.addEventListener("click", () => {
        currentTool = "sticker";
        currentSticker = stickerEmoji;

        deselectAllTools();
        button.classList.add("selected");

        if (currentToolPreview) {
          currentToolPreview.updateTool(
            currentTool,
            {
              thickness: currentThickness,
              sticker: currentSticker,
              color: currentColor,
            },
          );
          dispatchDrawingChanged();
        }
      });

      return button;
    };

    // Creates and adds the initial sticker buttons from the data model
    stickers.forEach((stickerEmoji) => {
      const stickerButton = createStickerButton(stickerEmoji);
      buttonContainer.appendChild(stickerButton);
    });

    // Custom sticker button
    const customStickerButton = document.createElement("button");
    customStickerButton.textContent = "Add Stamp +";
    customStickerButton.className = "tool-button";

    customStickerButton.addEventListener("click", () => {
      const newSticker = prompt(
        "Enter your custom sticker (e.g., an emoji):",
        "✅",
      );

      if (newSticker && newSticker.trim() !== "") {
        const trimmedSticker = newSticker.trim();

        if (!stickers.includes(trimmedSticker)) {
          stickers.push(trimmedSticker);
          const newStickerButton = createStickerButton(trimmedSticker);
          buttonContainer.insertBefore(newStickerButton, customStickerButton);
        }

        currentTool = "sticker";
        currentSticker = trimmedSticker;
        deselectAllTools();
        document.querySelectorAll<HTMLButtonElement>(".tool-button").forEach(
          (btn) => {
            if (btn.textContent === trimmedSticker) {
              btn.classList.add("selected");
            }
          },
        );

        if (currentToolPreview) {
          currentToolPreview.updateTool(
            currentTool,
            {
              thickness: currentThickness,
              sticker: currentSticker,
              color: currentColor,
            },
          );
          dispatchDrawingChanged();
        }
      }
    });

    buttonContainer.appendChild(customStickerButton);

    buttonContainer.appendChild(undoButton);
    buttonContainer.appendChild(redoButton);
    buttonContainer.appendChild(clearButton);
    buttonContainer.appendChild(exportButton);

    // Adds the container to the body
    body.appendChild(buttonContainer);

    dispatchDrawingChanged();
  }
});
