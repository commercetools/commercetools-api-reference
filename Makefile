VRAP_VERSION := "1.0.0-20200716101307"
SHELL := /bin/bash
CHANGES_PENDING := `git status --porcelain -- ':(exclude)*gen.properties' | grep -c ^ || true`

build: install_deps generate lint

install_deps: codegen_install composer_install yarn_install

lint: yarn_install check_markdown lint_raml validate_raml

generate: update_types oas_convert generate_collection

codegen_install:
	export VRAP_VERSION=$(VRAP_VERSION) && curl -o- -s https://raw.githubusercontent.com/vrapio/rmf-codegen/master/scripts/install.sh | bash

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

validate_raml:
	docker run -v$(pwd):/api vrapio/vrap -rc /api/update-actions.raml

oas_convert:
	yarn run oas_convert

generate_collection:
	rmf-codegen generate -o postman -t postman postman.raml

check_pending:
	git status --porcelain -- ':(exclude)*gen.properties'
	@echo "::set-env name=CHANGES_PENDING::$(CHANGES_PENDING)"
