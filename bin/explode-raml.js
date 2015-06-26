/**
* 1. install the below dependencies via "npm install foo" from the project root (local installation, no -g)
* 2. run node bin/explode.js  from the project root
* 3. instead of http://olegilyenko.github.io/api-console/dist/?raml=/api-console/sphere/project.raml
*    open http://olegilyenko.github.io/api-console/dist/?raml=/api-console/sphere/project-exploded.raml
* 4. decide whether to check in the exploded files or not.
*
* FYI: the console output tries to be "markdownish", so you can do node bin/explode-raml.js > results.md for large results
*
* FYI: as this is a build/test script and not a server application it is intentionally done synchronous
* FYI: the traversal code "eats" critical errors under circumstances -> check "done!" output and try/catch calls to libraries
*
* TODO: validate Markdown parts, too.
*/

var fs = require('fs');
var traverse = require('traverse');

var raml = require('raml-parser');
var toRAML = require('raml-object-to-raml');

var jsonSchemaDeref = require('json-schema-deref-sync');

var JSCK = require('jsck');
var jsonSchemaSchema = JSON.parse(fs.readFileSync('json-schema-draft4.json', 'utf8'));
var metaValidator = new JSCK.draft4(jsonSchemaSchema);

// FYI: the "raml.loadFile" call does already:
// * _validate_ the RAML file against the RAML spec
// * _inline_ the RAML file references ("!include" statements)
console.log("# Starting RAML consistency check and explosion");
raml.loadFile('project.raml').then( function(raml) {
        var outputFilename = 'project-exploded';

        var lintedRaml = traverse.clone(raml);

        // validates all schemata against the "metaschema / schema schema"
        // and writes "linted" JSON back into the tree
        validateSchemata(lintedRaml);

        // validates all examples against the matching schema
        // and writes "linted" JSON back into the tree
        validateExamples(lintedRaml);

        // write out the RAML
        // FYI: the "writeRAML" implies "linting" the RAML
        writeRAML(lintedRaml, outputFilename);

        // write a JSON version to have a programatically more approachable version at hand.
        // FYI: this is not a 1:1 representation of the JSON view on the RAML YAML,
        //      it's the internal representation of the  RAML library.
        writeJSON(lintedRaml, outputFilename);
        
        // dereference the schemata in the RAML (sometimes called "schema inlining", too)
        // and write out two more files
        var dereferencedRaml = traverse.clone(lintedRaml);
        derefSchemata(dereferencedRaml);
        writeRAML(dereferencedRaml, outputFilename+"-dereferencedSchemata");
        writeJSON(dereferencedRaml, outputFilename+"-dereferencedSchemata");

        // confirm that the traversal hasn't eaten some error:
        console.log("# done!");

  }, function(error) {
          console.log(' * **Error parsing project RAML: ' + error + "**");
});

// ####  helpers ###:

function writeRAML(rootNode, filePath){
    fs.writeFileSync(filePath+".raml", toRAML(rootNode));
    console.log(" * RAML (yaml) saved to " + filePath+".raml");
}

function writeJSON(rootNode, filePath){
    fs.writeFileSync(filePath+".json", JSON.stringify(rootNode, null, 4));
    console.log(" * RAML (json) saved to " + filePath+".json");
}

function derefSchemata(rootNode){
    console.log("## Schemata Derefefrencing");
    traverse(rootNode).forEach(function (node) {
        if (this.key == "schema" && this.parent.key == "application/json" && this.isLeaf){

            try{
                var schemaObj = JSON.parse(this.parent.node.schema);
            } catch (ex){
                console.log(" * **could not parse JSON of this schema: " + printRamlResponseContext(this.parent) + "**");
                console.log("```");
                console.log(ex);
                console.log("```");
                return;
            }

            var derefSchemaObj = jsonSchemaDeref(schemaObj, {baseFolder: process.cwd()+"/schemas/"});
            this.update(JSON.stringify(derefSchemaObj, null, 4));
        }
    });
}

function validateSchemata(rootNode){
    console.log("## Schemata Validity Check");
    traverse(rootNode).forEach(function (node) {
        if (this.key == "schema" && this.parent.key == "application/json" && this.isLeaf){

            try{
                var schemaObj = JSON.parse(this.parent.node.schema);
            } catch (ex){
                console.log(" * **could not parse JSON of this schema: " + printRamlResponseContext(this.parent) + "**");
                console.log("```");
                console.log(ex);
                console.log("```");
                return;
            }

            var schemaErrors = metaValidator.validate(schemaObj);
            if(!schemaErrors.valid){
                console.log(" * **schema NOT OK: "+ printRamlResponseContext(this.parent) + "**");
                console.log("```json");
                console.log(JSON.stringify(schemaErrors.errors, null, 2));
                console.log("```");
            }else{
                console.log(" * schema OK: "+ printRamlResponseContext(this.parent));
            }
            // "lint":
            this.update(JSON.stringify(schemaObj, null, 4));
        }
    });
}

function validateExamples(rootNode){
    console.log("## Example Validity Check");
    traverse(rootNode).forEach(function (node) {
        if (this.key == "example" && this.parent.key == "application/json" && this.parent.node.hasOwnProperty("schema")){

            try{
                var schemaObj = JSON.parse(this.parent.node.schema);
            } catch (ex){
                console.log(" * **could not parse JSON of this schema: " + printRamlResponseContext(this.parent) * "**");
                console.log("```");
                console.log(ex);
                console.log("```");
                return;
            }

            try{
                var exampleObj = JSON.parse(node);
            } catch (ex){
                console.log(" * **could not parse JSON of this example: " + printRamlResponseContext(this.parent) + "**");
                console.log("```");
                console.log(ex);
                console.log("```");
                return;
            }

            schemaObj = jsonSchemaDeref(schemaObj, {baseFolder: process.cwd()+"/schemas/"});

            try {
                var validator = new JSCK.draft4(schemaObj);
            } catch (ex) {
                console.log(" * **could not instantiate validator for schema: " + printRamlResponseContext(this.parent) + "**");
                console.log("```");
                console.log(ex);
                console.log("```");
                return;
            }

            var schemaErrors = validator.validate(exampleObj);
            if(!schemaErrors.valid){
                console.log(" * **example NOT OK: " + printRamlResponseContext(this.parent) + "**");
                console.log("```json");
                console.log(JSON.stringify(schemaErrors.errors, null, 2));
                console.log("```");
            }else{
                console.log(" * example OK: " + printRamlResponseContext(this.parent));
            }

            // "lint":
            this.update(JSON.stringify(exampleObj, null, 4));

        }
    });
}

// takes a "this" context of the traverse library and tries to make the RAML context transparent
// assumes that the context is a RAML response description node like "application/json".
function printRamlResponseContext(context){
    // TODO some RAML parts have different paths ("undefined" in the results). probably the traits.
    var elements = [];
    elements.unshift(context.key); // should be the content type
    var responseTypeContext = context.parent.parent;
    elements.unshift(responseTypeContext.key);
    var methodContext = responseTypeContext.parent.parent;
    elements.unshift(methodContext.node["method"]);
    var resourceContext = methodContext.parent.parent;
    elements.unshift(resourceContext.node["displayName"] + " ("+resourceContext.node["relativeUri"]+")");
    return elements.join(" -> ");;
}


