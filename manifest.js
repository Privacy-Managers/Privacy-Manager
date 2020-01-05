const {version} = require("./package.json");


function transform(content)
{
  const manifestJson = JSON.parse(content.toString());
  // Use package version to set manifest one.
  manifestJson.version = version;
  return Buffer.from(JSON.stringify(manifestJson));
}

module.exports = {transform};
