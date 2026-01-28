
try {
  console.log("1. Requiring ts-node");
  const tsNode = require("ts-node");
  console.log("2. Registering ts-node");
  tsNode.register({
    swc: false,
    ignore: ["node_modules"]
  });
  console.log("3. Registered. Requiring medusa-config.ts");
  const config = require("./medusa-config.ts");
  console.log("4. Config loaded");
} catch (e) {
  console.error("Error:", e);
}
