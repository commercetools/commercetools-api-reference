SHELL := /bin/bash
CHANGES_PENDING := `git status --porcelain -- ':(exclude)*gen.properties' | grep -c ^ || true`

build: install_deps generate lint cleanup

install_deps: codegen_install composer_install yarn_install

lint: check_markdown validate_raml

generate: generate_oas generate_plantuml

oas_convert: oas_convert3

codegen_install:
	curl -o- -s https://raw.githubusercontent.com/vrapio/rmf-codegen/master/scripts/install.sh | bash

composer_install:
	composer install --no-ansi --no-interaction --no-progress --no-suggest

yarn_install:
	yarn install

check_markdown: yarn_install
	node bin/explode-raml.js

lint_raml: yarn_install
	yarn run lint:raml

validate_raml: codegen_install
	rmf-codegen verify api-specs/api/api.raml

generate_oas: codegen_install
	rmf-codegen generate -o oas -t OAS api-specs/api/api.raml

generate_plantuml: codegen_install
	rmf-codegen generate -o uml/api -t PLANTUML api-specs/api/api.raml

raml_doc_convert: codegen_install
	rmf-codegen generate -o tmpdoc -t RAML_DOC api-specs/api/api.raml

oas_convert3: lint raml_doc_convert
	node bin/doc-convert-oas3.js
	rm -rf tmpdoc
	sed -ibak -e "s/includePath/x-annotation-includePath/g" api.swagger3.json
	sed -ibak -e "s/example/x-annotation-example/g" api.swagger3.json
	sed -ibak -e "s/additionalProperties/x-annotation-additionalProperties/g" api.swagger3.json
	yarn run swagger-cli validate api.swagger3.json
	rm api.swagger3.jsonbak

oas_convert2: lint raml_doc_convert
	node bin/doc-convert-oas2.js
	rm -rf tmpdoc
	sed -ibak -e "s/additionalProperties/x-annotation-additionalProperties/g" api.swagger.json
	sed -ibak -e "s/\"oneOf\"/\"x-annotation-oneOfDef\"/g" api.swagger.json
	yarn run swagger-cli validate api.swagger.json
	rm api.swagger.jsonbak

cleanup:
	rm -rf tmpdoc
