SHELL := /bin/bash
CHANGES_PENDING := `git status --porcelain -- ':(exclude)*gen.properties' | grep -c ^ || true`

build: install_deps generate lint cleanup

install_deps: codegen_install

lint: validate_raml validate_oas

generate: generate_oas generate_plantuml

validate_oas:
	npx autorest --v3 --azure-validator --input-file=oas/api/openapi.yaml

codegen_install:
	curl -o- -s https://raw.githubusercontent.com/vrapio/rmf-codegen/master/scripts/install.sh | bash

validate_raml: codegen_install
	rmf-codegen verify api-specs/api/api.raml

generate_oas: generate_oas_api generate_oas_import generate_oas_history generate_oas_ml

generate_oas_api: codegen_install
	rmf-codegen generate -o oas/api -t OAS api-specs/api/api.raml

generate_oas_import: codegen_install
	rmf-codegen generate -o oas/import -t OAS api-specs/importapi/api.raml

generate_oas_history: codegen_install
	rmf-codegen generate -o oas/history -t OAS api-specs/history/api.raml

generate_oas_ml: codegen_install
	rmf-codegen generate -o oas/ml -t OAS api-specs/ml/api.raml

generate_plantuml: codegen_install
	rmf-codegen generate -o uml/api -t PLANTUML api-specs/api/api.raml

cleanup:
	rm -rf tmpdoc
