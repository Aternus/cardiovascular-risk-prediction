/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
  proseWrap: "always",
  plugins: ["@ianvs/prettier-plugin-sort-imports"],
  importOrder: [
    "<BUILTIN_MODULES>",
    "",
    "<THIRD_PARTY_MODULES>",
    "",
    "^[.]",
    "",
    "<TYPES>^(node:)",
    "<TYPES>",
    "<TYPES>^[.]",
  ],
  importOrderTypeScriptVersion: "5.0.0",
};

export default config;
