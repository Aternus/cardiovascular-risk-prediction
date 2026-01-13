/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config & import('prettier-plugin-tailwindcss').PluginOptions}}
 */
const config = {
  proseWrap: "always",
  plugins: [
    "@ianvs/prettier-plugin-sort-imports",
    // prettier-plugin-tailwindcss must be loaded last
    "prettier-plugin-tailwindcss",
  ],

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

  tailwindStylesheet: "./app/globals.css",
  tailwindFunctions: ["tw", "clsx", "cva", "cn"],
};

export default config;
