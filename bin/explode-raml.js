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
var raml = require('raml-1-parser');
var markdownlint = require("markdownlint");

var markdownLintDefaults = {
    config: {
        // TODO agree on markdown style and ruleset
        // find the rules and their well-written rationale here: https://github.com/DavidAnson/markdownlint/blob/master/doc/Rules.md
        "default": true,
        "MD041": false,  // First line must not necessarily be a top level header because the markdown is a document fragment and not a document.
        "MD002": false, // first heading must not necessarily be a H1 because the markdown is a document fragment and not a document.
        "MD013": false // ignore line length
    }
}

// go!
var numErrors = 0;

// FYI: the "raml.loadFile" call does already:
// * _validate_ the RAML file against the RAML spec
// * _inline_ the RAML file references ("!include" statements)
console.log("\n# RAML consistency check and explosion\n");

raml.loadApi('api-specs/api/api.raml').then(function (api) {
    return api.expand(true).toJSON();
}).then( function(raml) {

        var outputFilename = 'project-exploded';

        var lintedRaml = raml;

        validateMarkdown(lintedRaml);

        console.log("\n## Writing exploded files\n");

        // write out the RAML
        // FYI: the "writeRAML" implies "linting" the RAML
        // writeRAML(lintedRaml, outputFilename);
        // writeRAML(dereferencedRaml, outputFilename+"-dereferencedSchemata");

        // write a JSON version to have a programatically more approachable version at hand.
        // FYI: this is not a 1:1 representation of the JSON view on the RAML YAML,
        //      it's the internal representation of the  RAML library.
        writeJSON(lintedRaml, outputFilename+"-ast");

        // confirm that the traversal hasn't eaten some error:
        console.log("\n# done!\n");

        process.exit(numErrors);

  }, function(error) {
          numErrors++;
          console.log(' * **Error parsing project RAML: ' + error + "**");
          process.exit(numErrors);
});

// ####  helpers ###:

function writeJSON(rootNode, filePath){
    fs.writeFileSync(filePath+".json", JSON.stringify(rootNode, null, 4));
    console.log(" * RAML (json) saved to " + filePath+".json");
}

function validateMarkdown(rootNode){
    console.log("\n## Description Markdown Check\n");
    traverse(rootNode).forEach(function (node) {
        if (this.key === "description" && typeof this.node === "string" ){
            if (this.path && this.path.indexOf('resourceTypes') === 0) {
                return;
            }
            var mdLintOptions = traverse.clone(markdownLintDefaults);
            mdLintOptions.strings =  { "" : this.node };
            var mdLintResult = markdownlint.sync(mdLintOptions);
            var mdLintResultString = mdLintResult.toString();
            if (mdLintResultString) {
                // FYI: the markdown lint does currently not break the test, it's just for warning purpose.
                numErrors++;
                console.log(" * **description markdown \x1b[31mNOT OK\x1b[0m: " + prettifyRamlPath(this).join(" -> ") + "**");
                console.log("```");
                console.log(mdLintResultString);
                console.log("```");
                console.log("```markdown");
                console.log(this.node);
                console.log("```");
            }else{
                // console.log(" * description markdown \x1b[32mOK\x1b[0m: " + prettifyRamlPath(this).join(" -> "));
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
