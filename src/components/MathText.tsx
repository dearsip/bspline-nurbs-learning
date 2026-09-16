import katex from "katex";

export function MathText({ value, display = false }: { value: string; display?: boolean }) {
  return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(value, { throwOnError: false, displayMode: display }) }} />;
}
