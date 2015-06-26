/**
* 1. install the below dependencies via "npm install foo" from the project root (local installation, no -g)
* 2. run node bin/explode.js  from the project root
* 3. instead of http://olegilyenko.github.io/api-console/dist/?raml=/api-console/sphere/project.raml
*    open http://olegilyenko.github.io/api-console/dist/?raml=/api-console/sphere/project-exploded.raml
* 4. decide whether to check in the exploded files or not.
*
* FYI: the console output is "markdown", so you can do node bin/explode-raml.js > results.md for large results and look at it
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

// better readable output of errors than JSON.parse
var jsonlint = require("jsonlint");

var jsonSchemaDeref = require('json-schema-deref-sync');

var JSCK = require('jsck');
var jsonSchemaSchema = JSON.parse(fs.readFileSync('json-schema-draft4.json', 'utf8'));
var metaValidator = new JSCK.draft4(jsonSchemaSchema);

// var MarkdownIt = require('markdown-it');
// var mdAst = MarkdownIt.parse("# heading", {});
// TODO hwo to find out if there are errors in the MD?

// FYI: the "raml.loadFile" call does already:
// * _validate_ the RAML file against the RAML spec
// * _inline_ the RAML file references ("!include" statements)
console.log("\n# RAML consistency check and explosion\n");
raml.loadFile('project.raml').then( function(raml) {
        var outputFilename = 'project-exploded';

        var lintedRaml = traverse.clone(raml);

        // write out the RAML
        // FYI: the "writeRAML" implies "linting" the RAML
        writeRAML(lintedRaml, outputFilename);

        // write a JSON version to have a programatically more approachable version at hand.
        // FYI: this is not a 1:1 representation of the JSON view on the RAML YAML,
        //      it's the internal representation of the  RAML library.
        writeJSON(lintedRaml, outputFilename+"-ast");
        
        // dereference the schemata in the RAML (sometimes called "schema inlining", too)
        // and write out two more files
        var dereferencedRaml = traverse.clone(lintedRaml);
        derefSchemata(dereferencedRaml);

        // validates all schemata against the "metaschema / schema schema"
        // and writes "linted" JSON back into the tree
        validateSchemata(dereferencedRaml);

        // validates all examples against the matching schema
        // and writes "linted" JSON back into the tree
        validateExamples(dereferencedRaml);

        writeRAML(dereferencedRaml, outputFilename+"-dereferencedSchemata");
        writeJSON(dereferencedRaml, outputFilename+"-dereferencedSchemata-ast");

        // confirm that the traversal hasn't eaten some error:
        console.log("\n# done!\n");

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
    console.log("\n## Schemata Dereferencing\n");
    traverse(rootNode).forEach(function (node) {
        if (this.key == "schema" && this.parent.key == "application/json" && this.isLeaf){

            try{
                var schemaObj = JSON.parse(this.parent.node.schema);
            } catch (ex){
                console.log(" * **could not parse JSON of this schema: " + printRamlResponseContext(this.parent) + "**");
                console.log("```");
                try{
                    jsonlint.parse(this.parent.node.schema);
                }catch(ex){
                    console.log(ex);
                    console.log("```");
                    return;
                }
                console.log("```");
                return;
            }

            var derefSchemaObj = jsonSchemaDeref(schemaObj, {baseFolder: process.cwd()+"/schemas/"});
            this.update(JSON.stringify(derefSchemaObj, null, 4));
        }
    });
}

function validateSchemata(rootNode){
    console.log("\n## Schemata Validity Check\n");
    traverse(rootNode).forEach(function (node) {
        if (this.key == "schema" && this.parent.key == "application/json" && this.isLeaf){

            try{
                var schemaObj = JSON.parse(this.parent.node.schema);
            } catch (ex){
                console.log(" * **could not parse JSON of this schema: " + printRamlResponseContext(this.parent) + "**");
                console.log("```");
                try{
                    jsonlint.parse(this.parent.node.schema);
                }catch(ex){
                    console.log(ex);
                    console.log("```");
                    return;
                }
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
    console.log("\n## Example Validity Check\n");
    traverse(rootNode).forEach(function (node) {
        if (this.key == "example" && this.parent.key == "application/json" && this.parent.node.hasOwnProperty("schema")){

            try{
                var schemaObj = JSON.parse(this.parent.node.schema);
            } catch (ex){
                console.log(" * **could not parse JSON of this schema: " + printRamlResponseContext(this.parent) * "**");
                console.log("```");
                try{
                    jsonlint.parse(this.parent.node.schema);
                }catch(ex){
                    console.log(ex);
                    console.log("```");
                    return;
                }
                console.log("```");
                return;
            }

            try{
                var exampleObj = JSON.parse(node);
            } catch (ex){
                console.log(" * **could not parse JSON of this example: " + printRamlResponseContext(this.parent) + "**");
                console.log("```");
                try{
                    jsonlint.parse(node);
                }catch(ex){
                    console.log(ex);
                    console.log("```");
                    return;
                }
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
    var elements = [];
    elements.unshift(context.key); // should be the content type
    var responseTypeContext = context.parent.parent;
    elements.unshift(responseTypeContext.key);
    var methodContext = responseTypeContext.parent.parent;
    if(methodContext.node["method"]){
        // probably a normal endpoint definition
        elements.unshift(methodContext.node["method"]);
        var resourceContext = methodContext.parent.parent;
        elements.unshift(resourceContext.node["displayName"] + " ("+resourceContext.node["relativeUri"]+")");
    }else{
        // probably a trait or so -> fail over to the traverse path.
        elements.unshift(methodContext.path.join(" -> "));
    }
    return elements.join(" -> ");
}


