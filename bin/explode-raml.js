
import traverse from 'traverse';
import yaml from 'js-yaml';
import {globby} from 'globby';
import fs from 'fs';
import markdownlint from 'markdownlint';

const IncludeYamlType = new yaml.Type('!include', {
    kind: 'scalar',
    construct: (data) => {
        return data !== null ? data : '';
    },
});

const jsYamlSchema = yaml.DEFAULT_SCHEMA.extend([IncludeYamlType]);

const markdownLintDefaults = {
    config: {
        // TODO agree on markdown style and ruleset
        // find the rules and their well-written rationale here: https://github.com/DavidAnson/markdownlint/blob/master/doc/Rules.md
        "default": true,
        "MD041": false,  // First line must not necessarily be a top level header because the markdown is a document fragment and not a document.
        "MD002": false, // first heading must not necessarily be a H1 because the markdown is a document fragment and not a document.
        "MD013": false, // ignore line length
        "MD047": false // ignore trailing newline
    }
}

// go!
let numErrors = 0;

console.log("\n# RAML markdown lint\n");

const paths = await globby('api-specs/api/**/*.raml');

console.log("\n## Description Markdown Check\n");

paths.forEach(yamlLoad)

console.log("\n# done!\n");

process.exit(numErrors);

function yamlLoad(file) {
    const raml = yaml.load(fs.readFileSync(file, 'utf8'), {schema: jsYamlSchema})

    validateMarkdown(file, raml);
}


function validateMarkdown(file, rootNode){
    traverse(rootNode).forEach(function (node) {
        if (this.key === "description" && typeof this.node === "string" ){
            if (this.path && this.path.indexOf('resourceTypes') === 0) {
                return;
            }
            let mdLintOptions = traverse.clone(markdownLintDefaults);
            mdLintOptions.strings =  { "" : this.node };
            let mdLintResult = markdownlint.sync(mdLintOptions);
            let mdLintResultString = mdLintResult.toString();
            if (mdLintResultString) {
                // FYI: the markdown lint does currently not break the test, it's just for warning purpose.
                numErrors++;
                console.log("file: " + file)
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

    let pretty = "";
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
