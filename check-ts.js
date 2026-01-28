
try {
    const ts = require('typescript');
    console.log("Typescript version:", ts.version);
    console.log("getParsedCommandLineOfConfigFile type:", typeof ts.getParsedCommandLineOfConfigFile);
    if (typeof ts.getParsedCommandLineOfConfigFile !== 'function') {
        console.log("Keys in ts:", Object.keys(ts).filter(k => k.includes('Command')));
    }
} catch (e) {
    console.error("Error:", e);
}
