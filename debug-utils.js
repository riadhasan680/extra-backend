console.log("Starting debug-utils.ts");
try {
  const utils = require("@medusajs/utils");
  console.log("Utils loaded:", Object.keys(utils));
} catch (e) {
  console.error("Error loading utils:", e);
}
