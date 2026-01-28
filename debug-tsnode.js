
try {
  console.log("Requiring ts-node...");
  require("ts-node");
  console.log("ts-node required");
} catch (e) {
  console.error("Error:", e.message);
}
