
try {
  console.log("Attempting to import src/api/admin/affiliates/route.ts");
  require("./src/api/admin/affiliates/route.ts");
  console.log("Success!");
} catch (error) {
  console.error("Failed to import:", error);
}
