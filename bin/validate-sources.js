/*
* validates the source JSON files
* (it is easier to debug the exploded dereferenced stuff if the atomic sources are OK)
*/

var fs = require('fs');
var jsonSchemaDeref = require('json-schema-deref-sync');

// better readable output of errors than JSON.parse
var jsonlint = require("jsonlint");

var JSCK = require('jsck');
var jsonSchemaSchema = JSON.parse(fs.readFileSync('json-schema-draft4.json', 'utf8'));
var metaValidator = new JSCK.draft4(jsonSchemaSchema);

console.log("\n# Source JSON validation\n");

console.log("\n## Schema File Validation (JSON validity and schema validity)\n");
var schemata = fs.readdirSync('schemas');
for(var index in schemata){
    var path = "schemas/"+schemata[index];
    if(path.substr(path.length - 5) == ".json"){
        var schemaString = fs.readFileSync(path, "utf8");
        try{
            var schemaObj = JSON.parse(schemaString);
        } catch (ex){
            console.log(" * **could not parse JSON of this schema: " + path + "**");
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
        var schemaErrors = metaValidator.validate(schemaObj);
        if(!schemaErrors.valid){
            console.log(" * **schema NOT OK: "+ path + "**");
            console.log("```json");
            console.log(JSON.stringify(schemaErrors.errors, null, 2));
            console.log("```");
        }else{
            console.log(" * schema OK: "+ path);
        }

    }
}

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
