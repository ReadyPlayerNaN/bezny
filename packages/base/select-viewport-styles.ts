import MagicString from "magic-string";
import type { Plugin } from "vite";

// Only the static stylesheet sibling in the pinned Radix Select 2.3.8 viewport.
// Its collection, refs, event composition and scrolling calculations stay intact.
const injectedViewportStyles = `      /* @__PURE__ */ jsx(
        "style",
        {
          dangerouslySetInnerHTML: {
            __html: \`[data-radix-select-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-select-viewport]::-webkit-scrollbar{display:none}\`
          },
          nonce
        }
      ),
`;
const selectModule = /\/@radix-ui\/react-select\/dist\/index\.mjs(?:\?.*)?$/u;

export const transformSelectViewportStyles = (code: string, id: string) => {
  if (!selectModule.test(id)) {
    return null;
  }
  const start = code.indexOf(injectedViewportStyles);
  if (start === -1 || start !== code.lastIndexOf(injectedViewportStyles)) {
    throw new Error(
      "Pinned Radix Select viewport stylesheet changed; review the external CSS integration."
    );
  }
  const transformed = new MagicString(code);
  transformed.remove(start, start + injectedViewportStyles.length);
  return {
    code: transformed.toString(),
    map: transformed.generateMap({
      hires: true,
      includeContent: true,
      source: id,
    }),
  };
};
export const externalSelectViewportStyles = (): Plugin => ({
  enforce: "pre",
  name: "bezny-external-select-viewport-styles",
  transform: transformSelectViewportStyles,
});
