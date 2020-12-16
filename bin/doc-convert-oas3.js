var converter = require('oas-raml-converter');
var fs = require('fs');

var ramlToSwagger3 = new converter.Converter(converter.Formats.RAML, converter.Formats.OAS30);

process.stdout.write("\n# Converting RAML to OAS3 ...");

ramlToSwagger3.convertFile(__dirname + '/../tmpdoc/api.raml').then(function(swagger) {
    fs.writeFileSync(__dirname + '/../api.swagger3.json', JSON.stringify(swagger, null, 2));
    process.stdout.write(" \x1b[32mdone\x1b[0m.\n");
})
.catch(function(err) {
    process.stdout.write(" \x1b[31mfailed\x1b[0m.\n");
    console.error(err);
})
