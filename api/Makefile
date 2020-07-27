SHELL := /bin/bash

.PHONY: lint generate

lint: check_markdown lint_raml validate_raml

generate: update_types oas_convert generate_collection

update_types:
	bin/types.php && bin/generate-updates.php && bin/types.php

check_markdown:
	node bin/explode-raml.js

lint_raml:
	yarn run lint:raml

validate_raml:
	docker run -v$(shell pwd):/api vrapio/vrap -rc /api/update-actions.raml

oas_convert:
	yarn run oas_convert

generate_collection:
	rmf-codegen generate -o postman -t postman postman.raml
