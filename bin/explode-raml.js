/**
* 1. install the below dependencies via "npm install foo" from the project root (local installation, no -g)
* 2. run node bin/explode.js  from the project root
* 3. instead of http://olegilyenko.github.io/api-console/dist/?raml=/api-console/sphere/project.raml
*    open http://olegilyenko.github.io/api-console/dist/?raml=/api-console/sphere/project-exploded.raml
* 4. decide whether to check in the exploded files or not.
*/
var fs = require('fs');
var raml = require('raml-parser');
var toRAML = require('raml-object-to-raml');
var jsonSchemaDeref = require('json-schema-deref-sync');
var traverse = require('traverse');
var Validator = require('jsonschema').Validator;
var jsonValidator = new Validator();

var options = {
  derefSchemata: true
};

raml.loadFile('project.raml').then( function(rootNode) {
        var outputFilename = 'project-exploded';
        
        writeRAML(rootNode, outputFilename+".raml");
        
        var rootNodeDeref = traverse.clone(rootNode);
        derefSchemata(rootNodeDeref);
        writeRAML(rootNodeDeref, outputFilename+"-dereferencedSchemata.raml");
        
  }, function(error) {
          console.log('Error parsing: ' + error);
  });

function writeRAML(rootNode, filePath){
    fs.writeFile(filePath, toRAML(rootNode), function(err) {
            if(err) {
              console.log(err);
            } else {
              console.log("RAML saved to " + filePath);
            }
        });
    }

function derefSchemata(rootNode){
    if(options.derefSchemata){
        traverse(rootNode).forEach(function (x) {
            if (this.key == "schema" && this.parent.key == "application/json" && this.isLeaf){
                // console.log(v.validate(x, "TODO json schema metaschema"));
                // TODO crappy sh... the jsonSchemaDeref call simply does nothing but doesn't show errors either.
                this.update(jsonSchemaDeref(x, {baseFolder: process.cwd()+"/schemas/"}));
            }
        });
    }
}
