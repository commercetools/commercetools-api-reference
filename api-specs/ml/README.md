[![CircleCI](https://circleci.com/gh/commercetools/ml-services-api-reference.svg?style=svg&circle-token=238371835c24c7a0ab677ce159f01879eb226f69)](https://circleci.com/gh/commercetools/ml-services-api-reference)

# Summary

This repository contains the
[RAML specification](https://github.com/raml-org/raml-spec/blob/master/versions/raml-10/raml-10.md)
for commercetools machine learning API.

# Setup

- [install yarn](https://classic.yarnpkg.com/en/docs/install/#mac-stable) if you
  don't already have it.
- run `yarn install` to install dependencies

Now whenever the spec is changed, the git hooks make sure that the precommit
tasks are executed (such as formatting...)

# Checking that the specification is valid

In case you made changes to the spec, and want to check that it's valid before
commiting to git, you can follow these steps.

- install
  [`rmf-codegen`](https://github.com/vrapio/rmf-codegen#install-rmf-codegen-cli)
  cli, if not already installed.
- run `rmf-codegen verify api.raml` at the project root, to check that the api
  is valid.
