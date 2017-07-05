var converter = require('oas-raml-converter');
var fs = require('fs');

var ramlToSwagger = new converter.Converter(converter.Formats.RAML10, converter.Formats.OAS);

process.stdout.write("\n# Converting RAML to OAS ...");

ramlToSwagger.convertFile(__dirname + '/../update-actions.raml').then(function(swagger) {
    fs.writeFileSync(__dirname + '/../api.swagger.json', JSON.stringify(swagger, null, 2));
    process.stdout.write(" \x1b[32mdone\x1b[0m.\n");
})
.catch(function(err) {
    process.stdout.write(" \x1b[31mfailed\x1b[0m.\n");
    console.error(err);
});
