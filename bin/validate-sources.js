/*
* validates the source JSON files
* (it is easier to debug the exploded dereferenced stuff if the atomic sources are OK)
*
* TODO load and validate the RAML itself, too (like in the explosion script).
*/

var fs = require('fs');
var jsonSchemaDeref = require('json-schema-deref-sync');
// better readable output of errors than JSON.parse
var jsonlint = require("jsonlint");
var JSCK = require('jsck');
var jsonSchemaSchema = JSON.parse(fs.readFileSync('json-schema-draft4.json', 'utf8'));
var metaValidator = new JSCK.draft4(jsonSchemaSchema);

// go!
var hasErrors = 0;

console.log("\n## Example File Validation (just JSON, check against schema happens in RAML validation)\n");
var examples = fs.readdirSync('examples');
for(var index in examples){
    var path = "examples/"+examples[index];
    if(path.substr(path.length - 5) == ".json"){
        var exampleString = fs.readFileSync(path, "utf8");
        try{
            var exampleObj = JSON.parse(exampleString);
            console.log(" * example OK: "+ path);
        }catch (ex){
            hasErrors++;
            console.log(" * **could not parse JSON of this example: " + path + "**");
            console.log("```");
            try{
                jsonlint.parse(exampleString);
            }catch(ex){
                console.log(ex);
                console.log("```");
                continue;
            }
            console.log("```");
            continue;
        }

    }
}

console.log("\n# done!\n");

process.exit(hasErrors);
