// Source: https://www.youtube.com/watch?v=lTDKhj83tec
export const draggable = (node: HTMLElement, data: unknown) => {
  let state = data;

  node.draggable = true;
  node.style.cursor = "grab";

  const handleDragStart = (e: DragEvent) => {
    if (!e.dataTransfer) return;
    e.dataTransfer.setData("text/plain", JSON.stringify(state));
    node.style.cursor = "grabbing";
  };

  node.addEventListener("dragstart", handleDragStart);

  return {
    update(newData: unknown) {
      state = newData;
    },
    destroy() {
      node.removeEventListener("dragstart", handleDragStart);
    },
  };
};

export const dropzone = (
  node: HTMLElement,
  options: {
    dropEffect?: "copy" | "move" | "link";
    dragoverClass?: string;
    onDrop: (data: unknown, e: DragEvent) => void;
  },
) => {
  let state = {
    dropEffect: "move" as const,
    dragoverClass: "droppable",
    ...options,
  };

  const handleDragEnter = (e: DragEvent) => {
    if (!(e.target instanceof HTMLElement)) return;
    e.target.classList.add(state.dragoverClass);
  };

  const handleDragLeave = (e: DragEvent) => {
    if (!(e.target instanceof HTMLElement)) return;
    e.target.classList.remove(state.dragoverClass);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (!e.dataTransfer) return;
    e.dataTransfer.dropEffect = state.dropEffect;
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    if (!e.dataTransfer || !(e.target instanceof HTMLElement)) return;

    e.target.classList.remove(state.dragoverClass);

    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
    state.onDrop(data, e);
  };

  node.addEventListener("dragenter", handleDragEnter);
  node.addEventListener("dragleave", handleDragLeave);
  node.addEventListener("dragover", handleDragOver);
  node.addEventListener("drop", handleDrop);

  return {
    update(newOptions: typeof options) {
      state = {
        dropEffect: "move",
        dragoverClass: "droppable",
        ...newOptions,
      };
    },
    destroy() {
      node.removeEventListener("dragenter", handleDragEnter);
      node.removeEventListener("dragleave", handleDragLeave);
      node.removeEventListener("dragover", handleDragOver);
      node.removeEventListener("drop", handleDrop);
    },
  };
};
