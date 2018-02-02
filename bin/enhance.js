const {RamlJsonGenerator} = require('raml-json-enhance-node');

process.stdout.write("\n# Converting RAML to enhanced JSON ...");

const enhancer = new RamlJsonGenerator('./update-actions.raml', {
    output: './update-actions.json',
    prettyPrint: true
});
enhancer.generate()
    .then(function(json) {
        process.stdout.write(" \x1b[32mdone\x1b[0m.\n");
    })
    .catch((cause) => {
        process.stdout.write(" \x1b[31mfailed\x1b[0m.\n");
        console.error(cause);
    });
