VRAP_VERSION := "1.0.0-20200716101307"
SHELL := /bin/bash
CHANGES_PENDING := `git status --porcelain -- ':(exclude)*gen.properties' | grep -c ^ || true`

.PHONY: build install_deps

build: install_deps generate lint

install_deps: codegen_install composer_install yarn_install

lint:
	$(MAKE) -C api install_deps lint

generate:
	$(MAKE) -C api install_deps generate

codegen_install:
	export VRAP_VERSION=$(VRAP_VERSION) && curl -o- -s https://raw.githubusercontent.com/vrapio/rmf-codegen/master/scripts/install.sh | bash

composer_install:
	composer install --no-ansi --no-interaction --no-progress --no-suggest

yarn_install:
	yarn install

check_pending:
	git status --porcelain -- ':(exclude)*gen.properties'
	@echo "::set-env name=CHANGES_PENDING::$(CHANGES_PENDING)"
