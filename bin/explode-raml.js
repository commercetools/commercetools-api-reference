/**
* 1. install the below dependencies via "npm install foo" from the project root (local installation, no -g)
* 2. run node bin/explode.js  from the project root
* 3. instead of http://olegilyenko.github.io/api-console/dist/?raml=/api-console/sphere/project.raml
*    open http://olegilyenko.github.io/api-console/dist/?raml=/api-console/sphere/project-exploded.raml
* 4. decide whether to check in the exploded files or not.
*
* FYI: as this is a build/test script and not a server application it is intentionally done synchronous
* FYI: the traversal code "eats" critical errors under circumstances -> check "done!" output and try/catch calls to libraries
*/

var fs = require('fs');
var raml = require('raml-parser');
var toRAML = require('raml-object-to-raml');
var jsonSchemaDeref = require('json-schema-deref-sync');
var traverse = require('traverse');
var JSCK = require('jsck');
var jsonSchemaSchema = JSON.parse(fs.readFileSync('json-schema-draft4.json', 'utf8'));
var metaValidator = new JSCK.draft4(jsonSchemaSchema);

// "main" call:
raml.loadFile('project.raml').then( function(rootNode) {
        var outputFilename = 'project-exploded';
        
        writeRAML(rootNode, outputFilename);
        writeJSON(rootNode, outputFilename);
        
        var rootNodeDeref = traverse.clone(rootNode);
        derefSchemata(rootNodeDeref);
        writeRAML(rootNodeDeref, outputFilename+"-dereferencedSchemata");
        writeJSON(rootNodeDeref, outputFilename+"-dereferencedSchemata");

        validateSchemata(rootNodeDeref);
        
        validateExamples(rootNodeDeref);

        // confirm that the traversal hasn't eaten some error:
        console.log("done!");

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

function validateSchemata(rootNode){
    traverse(rootNode).forEach(function (node) {
        if (this.key == "schema" && this.parent.key == "application/json" && this.isLeaf){
            var schemaObj = JSON.parse(node);
            var schemaErrors = metaValidator.validate(schemaObj);
            if(!schemaErrors.valid){
                console.log("# schema NOT OK: "+ printRamlResponseContext(this.parent));
                console.log(JSON.stringify(schemaErrors.errors, null, 2));
            }else{
                console.log("# schema OK: "+ printRamlResponseContext(this.parent));
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
            try {
                var validator = new JSCK.draft4(schemaObj);
            } catch (ex) {
                console.log("# could not instantiate validator for schema: " + printRamlResponseContext(this.parent));
                console.log(ex);
                return;
            }
            var schemaErrors = validator.validate(exampleObj);
            if(!schemaErrors.valid){
                console.log("# example NOT OK: "+ printRamlResponseContext(this.parent));
                console.log(JSON.stringify(schemaErrors.errors, null, 2));
            }else{
                console.log("# example OK: "+ printRamlResponseContext(this.parent));
            }
        }
    });
}

// takes a "this" context of the traverse library and tries to make the RAML context transparent
// assumes that the context is a RAML response description node like "application/json".
function printRamlResponseContext(context){
    var elements = [];
    elements.unshift(context.key); // should be the content type
    var responseTypeContext = context.parent.parent;
    elements.unshift(responseTypeContext.key);
    var methodContext = responseTypeContext.parent.parent;
    elements.unshift(methodContext.node["method"]);
    var resourceContext = methodContext.parent.parent;
    elements.unshift(resourceContext.node["displayName"] + " ("+resourceContext.node["relativeUri"]+")");
    return elements.join("->");;
}


