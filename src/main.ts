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

    interface Drawable {
      draw(ctx: CanvasRenderingContext2D): void;
    }

    class Path implements Drawable {
      private points: Point[];
      private thickness: number;

      constructor(startPoint: Point, thickness: number) {
        this.points = [startPoint];
        this.thickness = thickness;
      }

      addPoint(point: Point) {
        this.points.push(point);
      }

      draw(ctx: CanvasRenderingContext2D) {
        const startPoint = this.points[0];

        if (!startPoint || this.points.length < 2) {
          return;
        }

        ctx.strokeStyle = "#000000";
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
      private fontSize: number = 32;

      constructor(startPoint: Point, sticker: string) {
        this.position = startPoint;
        this.sticker = sticker;
      }

      // drag method
      updatePosition(point: Point) {
        this.position = point;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.font = `${this.fontSize}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#000000";
        ctx.fillText(this.sticker, this.position.x, this.position.y);
      }
    }

    class ToolPreview {
      private position: Point;
      private tool: Tool;
      private thickness: number;
      private sticker: string | null;
      private stickerFontSize: number = 32;

      constructor(
        startPoint: Point,
        tool: Tool,
        options: { thickness: number; sticker: string | null },
      ) {
        this.position = startPoint;
        this.tool = tool;
        this.thickness = options.thickness;
        this.sticker = options.sticker;
      }

      updatePosition(point: Point) {
        this.position = point;
      }

      updateTool(
        tool: Tool,
        options: { thickness: number; sticker: string | null },
      ) {
        this.tool = tool;
        this.thickness = options.thickness;
        this.sticker = options.sticker;
      }

      draw(ctx: CanvasRenderingContext2D) {
        if (this.tool === "pen") {
          const radius = this.thickness / 2;
          ctx.beginPath();
          ctx.arc(this.position.x, this.position.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
          ctx.fill();
        } else if (this.tool === "sticker" && this.sticker) {
          ctx.font = `${this.stickerFontSize}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.globalAlpha = 0.5;
          ctx.fillText(this.sticker, this.position.x, this.position.y);
          ctx.globalAlpha = 1.0;
        }
      }
    }

    // State variables
    let lines: Drawable[] = [];
    let redoStack: Drawable[] = [];

    type Tool = "pen" | "sticker";
    let currentTool: Tool = "pen";
    let currentSticker: string | null = null;
    const stickers = ["😍", "🚀", "🔥"];

    let isDrawing = false;
    let currentThickness: number = 2;
    const thinValue = 2;
    const thickValue = 8;
    let currentToolPreview: ToolPreview | null = null;

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
        const newPath = new Path(startPoint, currentThickness);
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
            { thickness: currentThickness, sticker: currentSticker },
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const drawable of lines) {
        drawable.draw(ctx);
      }

      if (currentToolPreview) {
        currentToolPreview.draw(ctx);
      }
    });

    // Creates a container to hold all the buttons together
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "center";
    buttonContainer.style.gap = "10px";
    buttonContainer.style.marginTop = "10px";
    buttonContainer.style.flexWrap = "wrap";

    const thinButton = document.createElement("button");
    thinButton.textContent = "Thin";
    thinButton.style.padding = "10px 20px";
    thinButton.style.fontSize = "16px";
    thinButton.style.cursor = "pointer";
    thinButton.style.border = "2px solid #333";

    const thickButton = document.createElement("button");
    thickButton.textContent = "Thick";
    thickButton.style.padding = "10px 20px";
    thickButton.style.fontSize = "16px";
    thickButton.style.cursor = "pointer";
    thickButton.style.border = "2px solid transparent";

    thinButton.addEventListener("click", () => {
      currentTool = "pen";
      currentThickness = thinValue;
      thinButton.style.border = "2px solid #333";
      thickButton.style.border = "2px solid transparent";

      if (currentToolPreview) {
        currentToolPreview.updateTool(
          currentTool,
          { thickness: currentThickness, sticker: null },
        );
        dispatchDrawingChanged();
      }
    });

    thickButton.addEventListener("click", () => {
      currentTool = "pen";
      currentThickness = thickValue;
      thickButton.style.border = "2px solid #333";
      thinButton.style.border = "2px solid transparent";

      if (currentToolPreview) {
        currentToolPreview.updateTool(
          currentTool,
          { thickness: currentThickness, sticker: null },
        );
        dispatchDrawingChanged();
      }
    });

    // Undo Button
    const undoButton = document.createElement("button");
    undoButton.textContent = "Undo";
    undoButton.style.padding = "10px 20px";
    undoButton.style.fontSize = "16px";
    undoButton.style.cursor = "pointer";

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
    redoButton.style.padding = "10px 20px";
    redoButton.style.fontSize = "16px";
    redoButton.style.cursor = "pointer";

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
    clearButton.textContent = "Clear Canvas";
    clearButton.style.padding = "10px 20px";
    clearButton.style.fontSize = "16px";
    clearButton.style.cursor = "pointer";

    clearButton.addEventListener("click", () => {
      lines = [];
      redoStack = []; // Also clear the redo stack
      dispatchDrawingChanged();
    });

    // Adds pen buttons to the single container
    buttonContainer.appendChild(thinButton);
    buttonContainer.appendChild(thickButton);

    // Sticker buttons
    const createStickerButton = (stickerEmoji: string): HTMLButtonElement => {
      const button = document.createElement("button");
      button.textContent = stickerEmoji;
      button.style.padding = "10px 20px";
      button.style.fontSize = "16px";
      button.style.cursor = "pointer";
      button.style.fontFamily = "Arial";

      button.addEventListener("click", () => {
        currentTool = "sticker";
        currentSticker = stickerEmoji;

        thinButton.style.border = "2px solid transparent";
        thickButton.style.border = "2px solid transparent";

        if (currentToolPreview) {
          currentToolPreview.updateTool(
            currentTool,
            { thickness: currentThickness, sticker: currentSticker },
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
    customStickerButton.textContent = "Custom +";
    customStickerButton.style.padding = "10px 20px";
    customStickerButton.style.fontSize = "16px";
    customStickerButton.style.cursor = "pointer";

    customStickerButton.addEventListener("click", () => {
      const newSticker = prompt(
        "Enter your custom sticker (e.g., an emoji):",
        "✨", // Just as an example of what can be used. Can also use text as a sticker
      );

      if (newSticker && newSticker.trim() !== "") {
        const trimmedSticker = newSticker.trim();

        stickers.push(trimmedSticker);

        const newStickerButton = createStickerButton(trimmedSticker);

        buttonContainer.insertBefore(newStickerButton, customStickerButton);
      }
    });

    buttonContainer.appendChild(customStickerButton);

    buttonContainer.appendChild(undoButton);
    buttonContainer.appendChild(redoButton);
    buttonContainer.appendChild(clearButton);

    // Adds the container to the body
    body.appendChild(buttonContainer);
  }
});
