const fs = require("node:fs");
const path = require("node:path");
const YAML = require("yaml");

const contentPath = path.resolve(__dirname, "../../_data/frames.yml");

module.exports = YAML.parse(fs.readFileSync(contentPath, "utf8"));
