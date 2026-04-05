import { createShareOgImage, OG_ALT, OG_SIZE } from "@/lib/og-share-image";

export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return createShareOgImage();
}
