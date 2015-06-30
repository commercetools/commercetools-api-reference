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
*/

var fs = require('fs');
var traverse = require('traverse');
var raml = require('raml-parser');
var toRAML = require('raml-object-to-raml');
var jsonlint = require("jsonlint");
var jsonSchemaDeref = require('json-schema-deref-sync');
var JSCK = require('jsck');
var jsonSchemaSchema = JSON.parse(fs.readFileSync('json-schema-draft4.json', 'utf8'));
var metaValidator = new JSCK.draft4(jsonSchemaSchema);
var markdownlint = require("markdownlint");

var markdownLintDefaults = {
    config: {
        // TODO agree on markdown style and ruleset
        // find the rules and their well-written rationale here: https://github.com/DavidAnson/markdownlint/blob/master/doc/Rules.md
        "default": true,
        "MD002": false, // first heading must not necessarily be a H1 because the markdown is a document fragment and not a document.
        "MD013": {
            "line_length": 120
        },
    }
}

// go!
var numErrors = 0;

// FYI: the "raml.loadFile" call does already:
// * _validate_ the RAML file against the RAML spec
// * _inline_ the RAML file references ("!include" statements)
console.log("\n# RAML consistency check and explosion\n");

raml.loadFile('project.raml').then( function(raml) {

        var outputFilename = 'project-exploded';

        var lintedRaml = traverse.clone(raml);

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

        validateMarkdown(dereferencedRaml);

        console.log("\n## Writing exploded files\n");

        // write out the RAML
        // FYI: the "writeRAML" implies "linting" the RAML
        writeRAML(lintedRaml, outputFilename);
        writeRAML(dereferencedRaml, outputFilename+"-dereferencedSchemata");

        // write a JSON version to have a programatically more approachable version at hand.
        // FYI: this is not a 1:1 representation of the JSON view on the RAML YAML,
        //      it's the internal representation of the  RAML library.
        writeJSON(lintedRaml, outputFilename+"-ast");
        writeJSON(dereferencedRaml, outputFilename+"-dereferencedSchemata-ast");

        // confirm that the traversal hasn't eaten some error:
        console.log("\n# done!\n");

        process.exit(numErrors);

  }, function(error) {
          numErrors++;
          console.log(' * **Error parsing project RAML: ' + error + "**");
          process.exit(numErrors);
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
                numErrors++;
                console.log(" * **could not parse JSON of this schema: " + prettifyRamlPath(this.parent).join(" -> ") + "**");
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
                numErrors++;
                console.log(" * **could not parse JSON of this schema: " + prettifyRamlPath(this.parent).join(" -> ") + "**");
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
                numErrors++;
                console.log(" * **schema NOT OK: "+ prettifyRamlPath(this.parent).join(" -> ") + "**");
                console.log("```json");
                console.log(JSON.stringify(schemaErrors.errors, null, 2));
                console.log("```");
            }else{
                console.log(" * schema OK: "+ prettifyRamlPath(this.parent).join(" -> "));
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
                numErrors++;
                console.log(" * **could not parse JSON of this schema: " + prettifyRamlPath(this.parent).join(" -> ") * "**");
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
                numErrors++;
                console.log(" * **could not parse JSON of this example: " + prettifyRamlPath(this.parent).join(" -> ") + "**");
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
                numErrors++;
                console.log(" * **could not instantiate validator for schema: " + prettifyRamlPath(this.parent).join(" -> ") + "**");
                console.log("```");
                console.log(ex);
                console.log("```");
                return;
            }

            var schemaErrors = validator.validate(exampleObj);
            if(!schemaErrors.valid){
                numErrors++;
                console.log(" * **example NOT OK: " + prettifyRamlPath(this.parent).join(" -> ") + "**");
                console.log("```json");
                console.log(JSON.stringify(schemaErrors.errors, null, 2));
                console.log("```");
            }else{
                console.log(" * example OK: " + prettifyRamlPath(this.parent).join(" -> "));
            }

            // "lint":
            this.update(JSON.stringify(exampleObj, null, 4));

        }
    });
}

function validateMarkdown(rootNode){
    console.log("\n## Description Markdown Check\n");
    traverse(rootNode).forEach(function (node) {
        if (this.key == "description" && typeof this.node == "string"){
            var mdLintOptions = traverse.clone(markdownLintDefaults);
            mdLintOptions.strings =  { "" : this.node };
            var mdLintResult = markdownlint.sync(mdLintOptions);
            var mdLintResultString = mdLintResult.toString();
            if (mdLintResultString) {
                // FYI: the markdown lint does currently not break the test, it's just for warning purpose.
                // numErrors++;
                console.log(" * **description markdown NOT OK: " + prettifyRamlPath(this).join(" -> ") + "**");
                console.log("```");
                console.log(mdLintResultString);
                console.log("```");
                console.log("```markdown");
                console.log(this.node);
                console.log("```");
            }else{
                console.log(" * description markdown OK: " + prettifyRamlPath(this).join(" -> "));
            }

        }
    });
}

// recursively walks up the tree and creates a readable array of RAML position.
function prettifyRamlPath(traverseContext, outputArray){
    if(typeof outputArray == "undefined") outputArray = [];
    // exit on the root node:
    if(typeof traverseContext.key == "undefined") return outputArray;
    // skip "resources" and "methods" entries (self-explanatory by context):
    if(traverseContext.key == "resources" || traverseContext.key == "methods") return prettifyRamlPath(traverseContext.parent, outputArray);

    var pretty = "";
    // decide what's the best name
    if(traverseContext.node["displayName"]){
        pretty += traverseContext.node["displayName"];
    }else{
        if(isNaN(traverseContext.key)){
            pretty += traverseContext.key;
        }else if(traverseContext.node["method"]){
            pretty += traverseContext.node["method"];
        }else{
            if(traverseContext.key.length == 3){
                // it is very unlikely that we have arrays > 100 entries, so this is an HTTP code:
                pretty += "HTTP " + traverseContext.key;
            }else{
                // some numeric cases remain, so we'll output them as a number
                pretty += "[" + traverseContext.key + "]";
            }
        }
    }
    // add helpful extra info:
    if(traverseContext.node["relativeUri"]){
        pretty += " (" + traverseContext.node["relativeUri"] + ")";
    }
    // add to result
    outputArray.unshift(pretty)
    // recurse:
    prettifyRamlPath(traverseContext.parent, outputArray);
    return outputArray;
}

function printNodeProps(node){
    var out = "";
    for (var key in node){
        out += key + " ,";
    }
    return out;
}