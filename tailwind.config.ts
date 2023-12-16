import type { Config } from "tailwindcss";
const { iconsPlugin, getIconCollections } = require("@egoist/tailwindcss-icons");

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      width: {
        "screen-md": "768px",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("daisyui"),
    iconsPlugin({ collections: getIconCollections(["solar", "tabler"]) }),
  ],
  darkMode: "class",
  daisyui: {
    themes: ["dracula", "light"], // false: only light + dark | true: all themes | array: specific themes like this ["light", "dark", "cupcake"]
    darkTheme: "dark", // name of one of the included themes for dark mode
    base: true, // applies background color and foreground color for root element by default
    styled: true, // include daisyUI colors and design decisions for all components
    utils: true, // adds responsive and modifier utility classes
    prefix: "", // prefix for daisyUI classnames (components, modifiers and responsive class names. Not colors)
    logs: true, // Shows info about daisyUI version and used config in the console when building your CSS
    themeRoot: ":root", // The element that receives theme color CSS variables
  },
};
export default config;
