# Change History API Reference

> ! CURRENTLY THIS IS JUST A TEST API

The RAML API reference for the Change History API. The API is documented in the `api` microsite in this repository. It's regenerated when starting the GatsbyJS development or build of that website.

Available yarn scripts:

- `test`: verifies the validity using RMF-Codegen
- `ramldoc`: generates the normalized "ramldoc" RAML into the api-spec folder of the `api` microsite. It's not committed there!
- `build`: alias for `ramldoc`

## Random helpful links for the PoC:

- change history swagger UI: https://history.europe-west1.gcp.commercetools.com/api-docs/#/
- existing docs-kit issue concerning OAS to RAML using the current non-deprecated RAML parser: https://github.com/commercetools/commercetools-docs-kit/issues/754
- existing docs-kit package to provide rmf-codegen to a javascript project as a simple dependency without any other tooling: https://github.com/commercetools/commercetools-docs-kit/tree/master/packages/ramldoc-generator

## commercetools API Spec Conventions

### Number Types

Numbers are documented as floats or integers. For proper parsing by the RAML transformer, floats and integers are defined in the following way:

- Floats

```raml
properties:
  floatProperty?: number
```

- Integers

```raml
properties:
  integerProperty:
    description: integer description
    type: integer
    format: int64
```

### Union Types

Union types should generally be avoided, also they would not be properly parsed or generate an arror by one or more of the series of tools used in documentation. So the definitions in this API eliminates union types wherever possible.
