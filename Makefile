SHELL := /bin/bash
CHANGES_PENDING := `git status --porcelain -- ':(exclude)*gen.properties' | grep -c ^ || true`

build: install_deps generate lint

install_deps: codegen_install composer_install yarn_install

lint: yarn_install check_markdown format_raml validate_raml

generate: update_types oas_convert generate_collection format_raml

codegen_install:
	curl -o- -s https://raw.githubusercontent.com/vrapio/rmf-codegen/master/scripts/install.sh | bash

composer_install:
	composer install --no-ansi --no-interaction --no-progress --no-suggest

yarn_install:
	yarn install

update_types:
	bin/types.php && bin/generate-updates.php && bin/types.php

check_markdown:
	node bin/explode-raml.js

lint_raml:
	yarn run lint:raml

format_raml:
	yarn run format:raml

validate_raml:
	docker run -v$(shell pwd):/api vrapio/vrap -rc /api/update-actions.raml

generate_collection:
	rmf-codegen generate -o postman -t postman postman.raml

oas_convert:
	rmf-codegen generate -o tmpdoc -t RAML_DOC update-actions.raml
	node bin/doc-convert.js
	rm -rf tmpdoc
	sed -ibak -e "s/includePath/x-annotation-includePath/g" api.swagger3.json
	sed -ibak -e "s/example/x-annotation-example/g" api.swagger3.json
	sed -ibak -e "s/additionalProperties/x-annotation-additionalProperties/g" api.swagger3.json
	sed -ibak -e "s/additionalProperties/x-annotation-additionalProperties/g" api.swagger.json
	sed -ibak -e "s/\"oneOf\"/\"x-annotation-oneOfDef\"/g" api.swagger.json
	yarn run swagger-cli validate api.swagger3.json
	yarn run swagger-cli validate api.swagger.json

check_pending:
	git status --porcelain -- ':(exclude)*gen.properties'
	@echo "CHANGES_PENDING=$(CHANGES_PENDING)" >> $GITHUB_ENV
