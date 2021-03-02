SHELL := /bin/bash
CHANGES_PENDING := `git status --porcelain -- ':(exclude)*gen.properties' | grep -c ^ || true`

build: install_deps generate lint oas_convert cleanup

install_deps: codegen_install composer_install yarn_install

lint: check_markdown format_raml validate_raml

generate: update_types generate_oas

oas_convert: oas_convert3 oas_convert2

codegen_install:
	curl -o- -s https://raw.githubusercontent.com/vrapio/rmf-codegen/master/scripts/install.sh | bash

composer_install:
	composer install --no-ansi --no-interaction --no-progress --no-suggest

yarn_install:
	yarn install

update_types: composer_install
	bin/types.php && bin/generate-updates.php && bin/types.php

check_markdown: yarn_install
	node bin/explode-raml.js

lint_raml: yarn_install update_types
	yarn run lint:raml

format_raml: yarn_install update_types
	yarn run format:raml

validate_raml: update_types format_raml
	docker run -v$(shell pwd)/api-specs/api:/api vrapio/vrap -rc /api/api.raml

generate_oas: codegen_install format_raml
	rmf-codegen generate -o oas -t OAS api-specs/api/api.raml

raml_doc_convert: codegen_install format_raml
	rmf-codegen generate -o tmpdoc -t RAML_DOC api-specs/api/api.raml

oas_convert3: lint raml_doc_convert
	node bin/doc-convert-oas3.js
	rm -rf tmpdoc
	sed -ibak -e "s/includePath/x-annotation-includePath/g" api.swagger3.json
	sed -ibak -e "s/example/x-annotation-example/g" api.swagger3.json
	sed -ibak -e "s/additionalProperties/x-annotation-additionalProperties/g" api.swagger3.json
	yarn run swagger-cli validate api.swagger3.json

oas_convert2: lint raml_doc_convert
	node bin/doc-convert-oas2.js
	rm -rf tmpdoc
	sed -ibak -e "s/additionalProperties/x-annotation-additionalProperties/g" api.swagger.json
	sed -ibak -e "s/\"oneOf\"/\"x-annotation-oneOfDef\"/g" api.swagger.json
	yarn run swagger-cli validate api.swagger.json

cleanup: oas_convert
	rm -rf tmpdoc
	rm api.swagger.jsonbak
	rm api.swagger3.jsonbak
