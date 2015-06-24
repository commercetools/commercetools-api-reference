/**
* 1. install the below dependencies via "npm install foo" from the project root (local installation, no -g)
* 2. run node bin/explode.js  from the project root
* 3. instead of http://olegilyenko.github.io/api-console/dist/?raml=/api-console/sphere/project.raml
*    open http://olegilyenko.github.io/api-console/dist/?raml=/api-console/sphere/project-exploded.raml
* 4. decide whether to check in the exploded files or not.
*
* FYI: as this is a quick build/test script and not a server application it is intentionally done synchronous
*/

var fs = require('fs');
var raml = require('raml-parser');
var toRAML = require('raml-object-to-raml');
var jsonSchemaDeref = require('json-schema-deref-sync');
var traverse = require('traverse');
var JSCK = require('jsck');
var metaValidator = new JSCK.draft4(
    JSON.parse(
        fs.readFileSync('json-schema-draft4.json', 'utf8')
    )
);

// "main" call:
raml.loadFile('project.raml').then( function(rootNode) {
        var outputFilename = 'project-exploded';
        
        writeRAML(rootNode, outputFilename);
        writeJSON(rootNode, outputFilename);
        
        var rootNodeDeref = traverse.clone(rootNode);
        derefSchemata(rootNodeDeref);
        writeRAML(rootNodeDeref, outputFilename+"-dereferencedSchemata");
        writeJSON(rootNodeDeref, outputFilename+"-dereferencedSchemata");

        // TODO: fix this function. 
        // validateSchemata(rootNodeDeref);
        
        // TODO: this doesn't detect random invalid changes to examples (check specific example change against schema)
        validateExamples(rootNodeDeref);

  }, function(error) {
          console.log('Error parsing project RAML: ' + error);
});

// helpers:
function writeRAML(rootNode, filePath){
    fs.writeFileSync(filePath+".raml", toRAML(rootNode));
    console.log("RAML (yaml) saved to " + filePath+".raml");
}

function writeJSON(rootNode, filePath){
    fs.writeFileSync(filePath+".json", JSON.stringify(rootNode, null, 4));
    console.log("RAML (json) saved to " + filePath+".json");
}

function derefSchemata(rootNode){
    traverse(rootNode).forEach(function (node) {
        if (this.key == "schema" && this.parent.key == "application/json" && this.isLeaf){
            var schemaObj = JSON.parse(node);
            var derefSchemaObj = jsonSchemaDeref(schemaObj, {baseFolder: process.cwd()+"/schemas/"});
            this.update(JSON.stringify(derefSchemaObj, null, 4));
        }
    });
}

function validateSchemata(root){
    traverse(rootNode).forEach(function (node) {
        if (this.key == "schema" && this.parent.key == "application/json" && this.isLeaf){
            var schemaObj = JSON.parse(node);
            // TODO program silently breaks and stops in the following call:
            var schemaErrors = metaValidator.validate(derefSchemaObj);
            
            if(!schemaErrors.valid){
                console.log("schema NOT OK: "+this.path);
                for(error in schemaErrors.errors){
                    console.log(error);
                }
            }else{
                console.log("schema OK: "+this.path);
            }
        }
    });
}

function validateExamples(rootNode){
    traverse(rootNode).forEach(function (node) {
        if (this.key == "example" && this.parent.key == "application/json" && this.parent.node.hasOwnProperty("schema")){
            var schemaObj = JSON.parse(this.parent.node.schema);
            var exampleObj = JSON.parse(node);
            schemaObj = jsonSchemaDeref(schemaObj, {baseFolder: process.cwd()+"/schemas/"});
            var validator = new JSCK.draft4(schemaObj);
            var schemaErrors = validator.validate(exampleObj);
            if(!schemaErrors.valid){
                console.log("example NOT OK: "+this.path);
                for(error in schemaErrors.errors){
                    console.log(error);
                }
            }else{
                console.log("example OK:" + this.path);
            }
        }
    });
}


