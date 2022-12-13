SHELL := /bin/bash
CHANGES_PENDING := `git status --porcelain -- ':(exclude)*gen.properties' | grep -c ^ || true`

build: install_deps generate lint cleanup

install_deps: codegen_install

lint: validate_raml

generate: generate_oas generate_plantuml

codegen_install:
	curl -o- -s https://raw.githubusercontent.com/vrapio/rmf-codegen/master/scripts/install.sh | bash

validate_raml: codegen_install
	rmf-codegen verify api-specs/api/api.raml

generate_oas: codegen_install
	rmf-codegen generate -o oas -t OAS api-specs/api/api.raml

generate_plantuml: codegen_install
	rmf-codegen generate -o uml/api -t PLANTUML api-specs/api/api.raml

cleanup:
	rm -rf tmpdoc
