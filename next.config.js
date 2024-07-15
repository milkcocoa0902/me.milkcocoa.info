/** @type {import('next').NextConfig} */
const { withKumaUI } = require("@kuma-ui/next-plugin");
const nextConfig = {
    reactStrictMode: true,
    typescript: {
        tsconfigPath: "tsconfig.build.json"
    }
};

module.exports = withKumaUI(nextConfig, {
    // The destination to emit an actual CSS file. If not provided, the CSS will be injected via virtual modules.
    outputDir: "./.kuma", // Optional
    // Enable WebAssembly support for Kuma UI. Default is false and will use Babel to transpile the code.
    wasm: true // Optional
});