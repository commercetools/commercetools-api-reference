VRAP_VERSION := "1.0.0-20200716101307"
SHELL := /bin/bash
CHANGES_PENDING := `git status --porcelain -- ':(exclude)*gen.properties' | grep -c ^ || true`
SUBDIRS := api

.PHONY: build install_deps subdirs $(SUBDIRS)

subdirs: $(SUBDIRS)

$(SUBDIRS):
	$(MAKE) -C $@ $(MAKECMDGOALS)

build: install_deps subdirs

lint: install_deps subdirs

install_deps: codegen_install composer_install yarn_install

codegen_install:
	export VRAP_VERSION=$(VRAP_VERSION) && curl -o- -s https://raw.githubusercontent.com/vrapio/rmf-codegen/master/scripts/install.sh | bash

composer_install:
	composer install --no-ansi --no-interaction --no-progress --no-suggest

yarn_install:
	yarn install

check_pending:
	git status --porcelain -- ':(exclude)*gen.properties'
	@echo "::set-env name=CHANGES_PENDING::$(CHANGES_PENDING)"
