declare module "*.png" {
  const value: import("next/dist/client/image").StaticImageData;
  export default value;
}

declare module "*.jpg" {
  const value: import("next/dist/client/image").StaticImageData;
  export default value;
}

declare module "*.jpeg" {
  const value: import("next/dist/client/image").StaticImageData;
  export default value;
}

declare module "*.svg" {
  const value: string;
  export default value;
}

declare module "*.webp" {
  const value: import("next/dist/client/image").StaticImageData;
  export default value;
}
