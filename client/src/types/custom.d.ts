declare module "remark-gfm" {
  const content: any;
  export default content;
}

declare module "*.md" {
  const content: string;
  export default content;
}
