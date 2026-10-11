export { default, generateMetadata } from "../page";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ mode: "send" }, { mode: "receive" }];
}
