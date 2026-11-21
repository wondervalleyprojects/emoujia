// Reading and shrinking the screenshot, all in the browser. Only the JPEG this
// makes leaves the device.

// A data URL, not an object URL: the studio site's policy allows data: images
// and not blob: ones.
export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('That file could not be read.'));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('That file is not an image we can read.'));
    img.onload = () => resolve(img);
    img.src = src;
  });
}

export interface Rect { x: number; y: number; w: number; h: number } // fractions of the image, 0 to 1

// The part of the image inside `rect`, at most 1024 px on its long side, as a JPEG.
export function cropToJpeg(img: HTMLImageElement, rect: Rect = { x: 0, y: 0, w: 1, h: 1 }): string {
  const sx = Math.round(rect.x * img.naturalWidth), sy = Math.round(rect.y * img.naturalHeight);
  const sw = Math.max(1, Math.round(rect.w * img.naturalWidth)), sh = Math.max(1, Math.round(rect.h * img.naturalHeight));
  const scale = Math.min(1, 1024 / Math.max(sw, sh));
  const c = document.createElement('canvas');
  c.width = Math.round(sw * scale); c.height = Math.round(sh * scale);
  c.getContext('2d')!.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.8);
}

// PROPOSED: a tall phone screenshot starts with its lower part selected, where
// the keyboard sits. Anything else starts whole.
export function startingRect(img: HTMLImageElement): Rect {
  return img.naturalHeight / img.naturalWidth > 1.4 ? { x: 0, y: 0.55, w: 1, h: 0.45 } : { x: 0, y: 0, w: 1, h: 1 };
}
