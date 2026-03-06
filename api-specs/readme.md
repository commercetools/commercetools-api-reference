# RAML update guideline

Our APIs have to follow our
[API Design Guideline](https://github.com/commercetools/api-design-guidelines/blob/master/guidelines.md) to maintain a consistent developer experience.

## Table of contents

- How to:
  - [Set a new baseUri](#set-a-new-baseuri)
  - [Create a new resources definition](#create-a-new-resources-definition)
    - [Create a query endpoint](#create-a-query-endpoint)
    - [Create a create endpoint](#create-a-create-endpoint)
    - [Create an update endpoint](#create-an-update-endpoint)
    - [Create a delete endpoint](#create-a-delete-endpoint)
    - [Create an endpoint for InStore](#create-an-endpoint-for-the-instore)
  - [Create a method](#create-a-method)
  - [Create a type](#create-a-type)
  - [Create a message](#create-a-message)
  - [Add a field](#add-a-field)
  - [Add a custom field](#add-a-custom-field)
  - [Add a scope](#add-a-scope)
  - [Use discriminator and discriminatorValue](#use-discriminator-and-discriminatorvalue)
  - [Use an annotation](#use-an-annotation)
    - [(package)](#package)
    - [(identifier)](#identifier)
    - [(elementIdentifier)](#elementidentifier)
    - [(placeholderParam)](#placeholderparam)
    - [(updateType)](#updatetype)
    - [(updateable)](#updateable)
    - [(deleteable)](#deleteable)
    - [(createable)](#createable)
    - [(methodName)](#methodname)
    - [(asMap)](#asmap)
    - [(deprecated)](#deprecated)
    - [(markDeprecated)](#markdeprecated)
    - [(actionType)](#actiontype)
    - [(beta)](#beta)
    - [(sdkBaseUri)](#sdkbaseuri)
    - [(enumDescriptions)](#enumdescriptions)
- Composable Commerce API folder structure
  - [/examples](#examples)
  - [/resources](#resources)
  - [/securitySchemes](#securityschemes)
  - [/traits](#traits)
  - [/types](#types)
    - [Resource data with the related Draft](#resource-data-with-the-related-draft)
    - [Paged Query Response](#paged-query-response)
    - [Update and Update Action](#update-and-update-action)
    - [/updates](#updates)
    - [/common](#common)
    - [/error](#error)
    - [/message](#message)
    - [annotations.raml](#annotationsraml)
    - [types.raml](#typesraml)
  - [api.raml](#apiraml)
- [Validator Rules](#validator-rules)

### How to:

#### Set a new baseUri

1. Open the **api.raml** file in the folder of the respective API.
2. Include the `baseUri` in this way:
   ```raml
   baseUri: https://api.{region}.commercetools.com  // This is the general baseUri
   baseUriParameters:
     region:
       type: string
       enum:             // here below are listed all of the regions available
         - us-east-2.aws
         - europe-west1.gcp
   ```

#### Create a new resources definition

1. Go to the [api.raml](./api/api.raml) file and add at the end preferably, like this:

   ```raml
   /stores: !include resources/stores.raml
   ```

2. In the [/resources](./api/resources) folder, add a new file called with the name of the resource definition. This is an example for the content:
   [stores.raml](./api/resources/stores.raml).

3. Add the different resource endpoints available to this file.

4. If you specify **queryParameters** to be used on several endpoints, consider modelling those as [/traits](#traits).

##### Create a query endpoint

1. Go to the respective resources file in the [/resources](./api/resources) folder, add a new file called with the name of the endpoint. This is an example for the content:
   [stores.raml](./api/resources/stores.raml). Refer to [How to create a Method section](#create-a-method) for information on how to add methods.
2. In addition, create a folder in [/types](./api/types) that contains the **updates** folder, like here [/updates](./api/types/cart/updates).
3. Add the main types in the folder created see the [How to create a type section](#create-a-type).
4. Add, if already available, the update actions like [CartAddCustomLineItemAction.raml](./api/types/cart/updates/CartAddCustomLineItemAction.raml) and the related JSON file to the [/examples](./api/examples) folder.

   ```raml
   type:
     baseDomain:
       resourceType: Cart
       resourceQueryType: CartPagedQueryResponse
       resourceDraft: CartDraft
       whereExample: 'customerEmail = "john.doe@example.com"'
       sortExample: createdAt asc
   (updateable): Cart
   (deleteable): Cart
   (createable): CartDraft
   description: A shopping cart holds product variants and can be ordered.
   get:
     securedBy: [oauth_2_0: { scopes: ['view_orders:{projectKey}'] }]
     queryParameters:
       customerId?:
         type: string
     responses:
       200:
         body:
           application/json:
             example: !include ../examples/carts.example.json
   ```

##### Create a create endpoint

In this case, it's pretty much like in the section [How to Create a Query Endpoint](#create-a-query-endpoint), the only difference is in the method to add.

So just as an example about the content:

1. Add the reference to the new endpoint to the [api-specs/api/types/common/ReferenceTypeId.raml](api-specs/api/types/common/ReferenceTypeId.raml) file.
2. In the respective resources file in the [/resources](./api/resources) folder, add a new file called with the name of the endpoint and this is just an example about the content, in this case was
   [orders.raml](./api/resources/orders.raml), and then add the **POST** method.
   The rest is like the points 2-3-4 of the section [How to Create a Query Endpoint](#create-a-query-endpoint). To get an overview, see the example below:

   ```raml
   type:
     baseDomain:
       resourceType: Order
       resourceQueryType: OrderPagedQueryResponse
       resourceDraft: OrderFromCartDraft
       whereExample: 'customerEmail = "john.doe@example.com"'
       sortExample: createdAt asc
   (updateable): Order
   (deleteable): Order
   (createable): OrderFromCartDraft
   description:
     An order can be created from a order, usually after a checkout process has
     been completed.
   post:
     securedBy: [oauth_2_0: { scopes: ['manage_orders:{projectKey}'] }]
     is:
       - conflicting
     description: |
       Creates an order from a Cart.
       The cart must have a shipping address set before creating an order.
       When using the Platform TaxMode, the shipping address is used for tax calculation.
     body:
       application/json:
         example: !include ../examples/order-create.example.json
     responses:
       201:
         body:
           application/json:
             example: !include ../examples/order.example.json
   ```

##### Create an Update Endpoint

To create an update endpoint by URI parameters like Id or Key, it's necessary to add to the parts of the code mentioned in the sections [How to Create a Query Endpoint](#create-a-query-endpoint) and [How to Create a Create Endpoint](#create-a-create-endpoint), the following parts:

1. Add the URI parameter, in the example below it is the **Id**.
2. Add the **methodName**.
3. Add the **post** method.
   To have an overview see the example below:

   ```raml
   /{ID}:
     (methodName): withId
     type:
       baseResource:
         uriParameterName: ID
         resourceType: Cart
         resourceUpdateType: CartUpdate
     post:
       securedBy: [oauth_2_0: { scopes: ['manage_orders:{projectKey}'] }]
       body:
         application/json:
           example: !include ../examples/cart-update.example.json
       responses:
         200:
           body:
             application/json:
               example: !include ../examples/cart.example.json
   ```

##### Create a delete endpoint

To create a delete endpoint by URI parameters like Id or Key, it's necessary to add to the parts of the code mentioned in the sections [How to Create a Query Endpoint](#create-a-query-endpoint) and [How to Create a Create Endpoint](#create-a-create-endpoint), the following parts:

1. Add the URI parameter, in the example below is the **Key**.
2. Add the **methodName**.
3. Add the **delete** method.
   To have an overview see the example below:

   ```raml
   /key={key}:
     (methodName): withKey
     type:
       baseResource:
         uriParameterName: key
         resourceType: Cart
         resourceUpdateType: CartUpdate
     delete:
       is:
         - dataErasure
       securedBy: [oauth_2_0: { scopes: ['manage_orders:{projectKey}'] }]
       responses:
         200:
           body:
             application/json:
               example: !include ../examples/cart.example.json
   ```

##### Create an endpoint for the instore

For an endpoint to be connected to the Store and have a structure similar to `/{projectKey}/stores/key={key}/new-endpoint`, you need to:

1. Modify the [/resources/in-store.raml](./api/resources/in-store.raml) file.
2. Add the new endpoint here.
3. The other changes depend on the structure of the new API itself.

#### Create a method

To create a new method for the endpoint, you need to:

1. Modify the related file in the [/resources](./api/resources) folder.
2. Add a section with the declaration of the new method in the **methodName** annotation.
3. Add the **baseResource** definition composed of **uriParameterName** and **resourceType** to the **type** section.
4. Add the **HTTP method** response which (in most cases) is usually **get** or **post**.

Below an example:

```raml
/password-token={passwordToken}:
  (methodName): withPasswordToken
  type:
    baseResource:
      uriParameterName: passwordToken
      resourceType: Customer
  get:
    displayName: Get customer by password verification token
    securedBy: [oauth_2_0: { scopes: ['view_customers:{projectKey}'] }]
    responses:
      200:
        body:
          application/json:
            example: !include ../examples/customer.example.json
```

#### Create a type

To create a new type, these are the files which have to be created:

1. The **BaseResources** which generally have the same name as the **package**. There is also the definition of **updateType** and then there are in detail the definition of the **properties**. Here is an example of the structure that each **BaseResources** have in common: [Category.raml](./api/types/category/Category.raml).
2. The **Draft**: the object submitted as payload to a create method. Following the previous example: [CategoryDraft.raml](./api/types/category/CategoryDraft.raml).
3. The **PagedQueryResponse**: for example [CategoryPagedQueryResponse.raml](./api/types/category/CategoryPagedQueryResponse.raml), which is the extension of our Common API Type [PagedQueryResponse.raml](./api/types/PagedQueryResponse.raml).
4. The **Reference**: see [CategoryReference.raml](./api/types/category/CategoryReference.raml), which is the extension of our Common API Type [Reference.raml](./api/types/common/Reference.raml).
5. The **ResourceIdentifier**: see [CategoryResourceIdentifier.raml](./api/types/category/CategoryResourceIdentifier.raml), which is the "extension" of our Common API Type [ResourceIdentifier.raml](./api/types/common/ResourceIdentifier.raml).
6. The **Update**: the definition of the **updateType** declared in the **BaseResources**, see [CategoryUpdate.raml](./api/types/category/CategoryUpdate.raml), which is the "extension" of[Update.raml](./api/types/Update.raml).
7. The **UpdateAction**: the definition of the actions declared in the **Update** file, see [CategoryUpdateAction.raml](./api/types/category/CategoryUpdateAction.raml), which is the "extension" of [UpdateAction.raml](./api/types/UpdateAction.raml).
   To see the definition and the details of all of them, see our documentation.

#### Create a message

To create a new Message, follow these steps:

1. Go in the [/types/message](./api/types/message) folder and create the file naming it _something_ + "Message.raml", like [CategoryCreatedMessage.raml](./api/types/message/CategoryCreatedMessage.raml).
2. Then, create the content like this below:

   ```raml
   #%RAML 1.0 DataType
   (package): Message
   type: Message
   displayName: CategoryCreatedMessage
   discriminatorValue: CategoryCreated
   properties:
     category:
       type: Category
   ```

3. The MessagePayload type should be automatically created by the Github action. In case it has to be done manually create a file in the [/types/message/payload](./api/types/message/payload) folder and naming the file _something_ + "MessagePayload.raml",
   like [CategoryCreatedMessagePayload.raml](./api/types/message/payload/CategoryCreatedMessagePayload.raml).
4. And create the content like this below:

   ```raml
   #%RAML 1.0 DataType
   (package): Message
   type: MessagePayload
   displayName: CategoryCreatedMessagePayload
   discriminatorValue: CategoryCreated
   properties:
     category:
       type: Category
   ```

5. Finally, include both files created in the [/types/types.raml](./api/types/types.raml). There is an automatism which in the CI pipeline to generate the related line in this file.

#### Add a field

To add a new field in the properties:

1. Go in the [/types](./api/types) folder and then in the resource related folder.
2. Add the name of the field based on our naming convention guidelines. If the field is **Optional** add `?`.
   - for numbers:\
     Use a specific type if applicable, like `integer`, or `number` plus `format`, and specify `minimum` and/or `maximum` if different from the physical limits of the data type. For optional fields in write models, specify a `default` value.

   ```raml
     accessTokenValiditySeconds?:
       type: number
       format: int32
       minimum: 3600
       maximum: 604800
       default: 172800
   ```

   - for strings:\
     Specify a `pattern` if applicable, also `minLength` and `maxLength` if useful.

   ```raml
     key?:
       type: string
       pattern: ^[A-Za-z0-9_-]+$
       minLength: 2
       maxLength: 256
   ```

   - for arrays:\
     Choose a property name in plural.\
     Declare property as **required** in read models since the value cannot be `null`, just empty.\
     In write models declare the field as **optional** in case array can be empty, like in "Set ..." update actions used for setting as well as unsetting fields.
   - for objects :\
     Use singular form for the property name. Use a named type. Creating an inline type is not allowed as it can't be projected in a nominal type system.

   ```raml
    geoLocation?:
      type: GeoJson
      description: |
        GeoJSON geometry object encoding the geo location.
   ```

3. Add `(beta): true` if it relates to a Beta feature.
4. Add `(markDeprecated): true` if the field is deprecated.

#### Add a custom field

To add a new Custom Field to a resource or object:

1. Go in the [/types](./api/types) folder and then navigate to the resource-related folder.
2. Find the file that is named after the resource or object you want to add the Custom Field to.
3. Add the `custom` field at the end of the standard fields and make it **Optional** by adding `?`.
4. Define the `type` as `CustomFields` for the read model type, and as `CustomFieldsDraft` for the write model object.

   ```raml
     custom?:
       type: CustomFields
       description: Custom Fields of this <object>.
   ```

5. Add the type for the payload of the _Set CustomField_ update action. For this, add a new file in the `/updates` subfolder of the resource named as: `<Resource>SetCustomFieldAction.raml`

   If the custom field is added to an object that is embedded into a resource, the filename should look like this: `<Resource>Set<embeddedObject>CustomFieldAction.raml`

   ```raml
   #%RAML 1.0 DataType
   (package): <Resource>
   type: <Resource>UpdateAction
   displayName: <Resource>Set<embeddedObject>CustomFieldAction
   discriminatorValue: <id for the update action>
   example: !include ../../../examples/<Resource>/<Resource>Set<embeddedObject>CustomFieldAction.json
   properties:
     name:
       type: string
     value?:
       type: CustomFieldValue
   ```

   If the updated action offers more fields, like additional identifiers, also add those as properties.

6. Add the type for the payload of the _Set Custom Type_ update action. For this, add a new file in the `/updates` subfolder of the specific resource named as: `<Resource>SetCustomTypeAction.raml`

   If the custom field is added to an object that is embedded into a resource, the filename should look like this: `<Resource>Set<embeddedObject>CustomTypeAction.raml`

   ```raml
   #%RAML 1.0 DataType
   (package): <Resource>
   type: <Resource>UpdateAction
   displayName: <Resource>Set<embeddedObject>CustomTypeAction
   discriminatorValue: <id for the update action>
   example: !include ../../../examples/<Resource>/<Resource>Set<embeddedObject>CustomTypeAction.json
   properties:
     type?:
       type: TypeResourceIdentifier
     fields?:
       type: FieldContainer
   ```

   For Order update actions, you may have to add the respective update actions for Order Edits as well. The files are located in the `/order-edits/updates/` folder and their filenames are prefixed with `StagedOrder`, for example, _StagedOrderSetReturnItemCustomTypeAction.raml_.

7. Add example files for update actions (according to the path in the `example` field).

   For `setCustomField` action:

   ```json
   {
     "action": "setCustomField",
     "name": "ExampleStringTypeField",
     "value": "TextString"
   }
   ```

   For `setCustomType` action:

   ```json
   {
     "action": "setCustomType",
     "type": {
       "id": "{{type-id}}",
       "typeId": "type"
     },
     "fields": {
       "exampleStringTypeField": "TextString"
     }
   }
   ```

8. Add custom field examples to the examples for the resource and its draft type.

   ```json
     "custom": {
       "type": {
         "typeId": "type",
         "id": "3ae9bcca-df23-443e-bd22-0c592f9694fa"
       },
       "fields": {
         "offer_name": "SuperMax"
       }
     }
   ```

9. Add the resource type ID for the customizable resource or object to the enumeration in file `api-specs/api/types/type/ResourceTypeId.raml`, and the `(enumDescriptions)` for it in the same file.

   ```yaml
   enum:
     - <resourceTypeID_1>
     - <resourceTypeID_2>
   (enumDescriptions):
     <resourceTypeID_1>: |
       [<Resource>](ctp:api:type:<Resource>)
     <resourceTypeID_2>: |
       [<Object>](ctp:api:type:Object) on [<Resource>](ctp:api:type:<Resource>)
   ```

IMPORTANT NOTE: For a new endpoint, if you need to add a CustomField/Type, this new endpoint has to be added in the `api-specs/api/types/common/ReferenceTypeId.raml` file:

- In the enum list: the list is in alphabetic order,
- as well as in the **(enumDescriptions)**

#### Add a scope

If you need to add a new **scope**, follow these steps:

1. Go in the [/resources](./api/resources) folder and in the resource domain file like [categories.raml](./api/resources/categories.raml).
2. In the HTTP methods which require to have it add the scope in the **oauth_2_0** part:

   ```raml
   get:
     securedBy:
       [
         oauth_2_0:
           {
             scopes:
               [
                 'manage_project:{projectKey}',
                 'view_products:{projectKey}',
                 'view_categories:{projectKey}',
               ],
           },
   ```

3. Add the new **scope** in 4 files (for more information, check [/securitySchemes](#security-schemes)):
   - [oauth2.raml](./api/securitySchemes/oauth2.raml),
   - [oauth2_password.raml](./api/securitySchemes/oauth2_password.raml),
   - [oauth2_refresh.raml](./api/securitySchemes/oauth2_refresh.raml),
   - [oauth2_anonymous.raml](./api/securitySchemes/oauth2_anonymous.raml)

   Precisely, in the **settings/scopes** section like in the example below:

   ```raml
   settings:
     authorizationUri: https://auth.europe-west1.gcp.commercetools.com/oauth/token
     accessTokenUri: https://auth.europe-west1.gcp.commercetools.com/oauth/token
     authorizationGrants: [client_credentials]
     scopes:
       - 'manage_project:{projectKey}'
       - 'manage_products:{projectKey}'
       - 'view_products:{projectKey}'
       - 'manage_orders:{projectKey}'
   ```

#### Use discriminator and discriminatorValue

**discriminator** is used to define an object as **action** or **type**, while **discriminatorValue** is used to name the UpdateActions and map them in the request.

#### Use an annotation

You can find the list of the annotations available of our APIs in the [annotations.raml](./api/types/annotations.raml) file.

In the RAML spec for the HTTP API (`api-specs/api` folder), use the following format:

```raml
  (placeholderParam):
or
  (markDeprecated): true
```

In the RAMl spec for other libraries (such as the Connect API in `api-specs/connect`) use the following format:

```raml
uses:
  annotations: annotationTypes/annotations.raml
  postman: annotationTypes/postman.raml
```

For these APIs the namespaces are defined in the related **api.raml** file. This means that you need to prefix the annotation with the API's namespace when using it.
For example:

```raml
  (annotations.placeholderParam):
or
  (annotations.markDeprecated): true
```

##### (package)

This annotation is included in the [/types](#types) folder of every RAML file. The scope is to indicate to which resource the data belongs to.

##### (identifier)

Use this annotation to specify the main key as identifier. To do this, add it to the **id**:

```raml
  id:
    (identifier): true
    type: string
```

##### (elementIdentifier)

Use this annotation in combination with the [(identifier)](#identifier), if the key is not identical to the **id**:

```raml
  name:
    (identifier): true
    (elementIdentifier): true
    type: string
    description: ''
```

##### (placeholderParam)

Use this annotation when defining a **Query Parameter** that has a REGEX parameter:

```raml
queryParameters:
  /text\.[a-z]{2}(-[A-Z]{2})?/:
    (placeholderParam):
      paramName: text
      template: text.<locale>
      placeholder: locale
```

##### (updateType)

This annotation has to be mentioned in the definition of the resource itself in the [/types](#types) folder in the resource data, so for instance in [CartDiscount.raml](./api/types/cart-discount/CartDiscount.raml). It's necessary to assign the related `<Resource>Update` to the resource.

##### (updateable)

This annotation gets the resource data assigned and has to be defined in the [/resources](#resources) files like this:
`(updateable): Cart`

##### (deleteable)

This annotation gets the resource data assigned and has to be defined in the [/resources](#resources) files like this:
`(deleteable): Cart`

##### (createable)

This annotation gets the resource data draft assigned and has to be defined in the [/resources](#resources) files like this:
`(createable): CartDraft`

##### (methodName)

Use this annotation to declare which method is used in our SDKs for that specific request.

##### (asMap)

The scope of this annotation for key => value mapping, it's used for instance to map properties which are in REGEX format. See the example below:

```raml
(asMap):
  key: string
  value: string
properties:
  /^[a-z]{2}(-[A-Z]{2})?$/:
    type: string
```

##### (deprecated)

This annotation indicates that an endpoint, property or class is deprecated and therefore removed from the SDKs.

##### (markDeprecated)

This annotation is used to inform customers that an endpoint, property, HTTP method or class is deprecated and that a replacement already exists.

Each URI and the related HTTP methods that are deprecated should get the respective annotation, see for [how to use an annotation](#use-an-annotation) section for more details.
Only in this way the related classes or methods in our SDKs will be annotated as deprecated.

Here below, an example about how to add the annotation, in general, the annotation **(markDeprecated): true** has to be added below the resource, method, query parameter that has to be deprecated.

```raml
(markDeprecated): true   // this annotation on top is to deprecate the whole endpoint
/attributes:
  (markDeprecated): true
  post:
    (markDeprecated): true
    body:
      application/json:
        type: missing-data.MissingAttributesSearchRequest
    responses:
      202:
        body:
          application/json:
            type: common.TaskToken
            example: !include ../examples/missing-data-token.json
  /status:
    (markDeprecated): true
    /{taskId}:
      (markDeprecated): true
      (methodName): withTaskId
      uriParameters:
        taskId:
        type: string
      get:
        (markDeprecated): true
        responses:
          200:
            body:
              application/json:
                type: missing-data.MissingDataTaskStatus
                example: !include ../examples/missing-data-response.json
```

##### (actionType)

This annotation has to be mentioned in the definition of the resource itself in the [/types](#types) folder in the resource data, so for instance in [CartDiscount.raml](./api/types/cart-discount/CartDiscount.raml). It's necessary to assign the related `<Resource>Action` to the resource.

##### (beta)

Use this annotation to indicate that the related feature is still in a beta phase.

##### (sdkBaseUri)

This annotation is declared on the API settings level, so in the [api-specs/api/api.raml](./api/api.raml) file.

##### (enumDescriptions)

Use this annotation to add descriptions to an enum property, like here [ChannelRoleEnum.raml](./api/types/channel/ChannelRoleEnum.raml).

##### (ignoreValidators)

Use this annotation to ignore the rules in this list for the specific type, resource or module.

### Composable Commerce API folder structure

#### /examples

This folder contains files in JSON format which are the response samples of the API call.
The update examples are divided per package, like here: [CategoryChangeNameAction.json](./api/examples/Category/CategoryChangeNameAction.json), while the generic API responses are directly under the **examples** folder such as:

- [category.example.json](./api/examples/category.example.json)
- [category-create.example.json](./api/examples/category-create.example.json)

As convention, the names of the JSON files of the Actions are exactly the same of the related RAML in the [/types](#types) folder.

The RAML files related to the actions or the main endpoint, contain the path of these examples as described in details in the [/update](#update) section.

#### /resources

In the files of this folder, there are files which, the most of them, are named like our endpoint, and we define for each of our endpoints:

- Base Domain
- Resource Methods
- Query parameters
- URI parameters
- Responses

Like here: [categories.raml](./api/resources/categories.raml).

#### /securitySchemes

The common case, when these files in this folder have to be modified, is when we introduce a new scope under the **scopes** section in the **settings**.
In really rare cases, we change the **authorizationUri** and the **accessTokenUri**.

```raml
settings:
  authorizationUri: https://auth.europe-west1.gcp.commercetools.com/oauth/token
  accessTokenUri: https://auth.europe-west1.gcp.commercetools.com/oauth/token
  authorizationGrants: [client_credentials]
  scopes:
    - 'manage_project:{projectKey}'
    - 'manage_products:{projectKey}'
    - 'view_products:{projectKey}'
```

#### /traits

In this folder, there are some part of the code like query parameters which are redundant.
So they have to be created in this folder then declared in the [./api/api.raml](./api/api.raml) in the **traits:** section, so then they can be called everywhere.

These are the steps about how to create and set a trait:

- Create the file in the traits folder like this:
  [price-selecting.raml](./api/traits/price-selecting.raml).

- Define it in the [./api/api.raml](./api/api.raml), like here:

  ```raml
  traits:
    priceSelecting: !include traits/price-selecting.raml
  ```

- After these steps, we can call the trait in the resource like here:
  [product-projections-search.raml](./api/resources/product-projections-search.raml).

  ```raml
  get:
    is:
      - priceSelecting
  ```

#### /types

In this folder, there is the detailed data definition of all the resources that we are passing through our APIs.
In common in each of the file there are:

- **(package)**: the package name matches the folder name and often the domain name, which it lives in
- **displayName**: the name of the resource data
- **type**: it could be BaseResource, in case of the main resource data, or one of the type found in the common folder
- **property**: the fields of the resource data

Most of the folders are named like our endpoints, but with the hyphens, and in each of them there are:

##### - Resource data with the related draft

Here the **resourceType** and the **resourceDraft** of our **baseDomain** are explained in detail, including for example the definition of the **properties** and the definition of the name of the **(updateType)**.

Example:

- [CartDiscount.raml](./api/types/cart-discount/CartDiscount.raml)
- [CartDiscountDraft.raml](./api/types/cart-discount/CartDiscountDraft.raml)

Our properties names follow our naming convention, see our
[API Design Guideline](https://github.com/commercetools/api-design-guidelines/blob/master/guidelines.md).

##### - Paged query response

The **resourceQueryType** of our **baseDomain** is written here in details.
Each new endpoint has to have this response defined, so this response has to be named: (_resource data name_) + _"PagedQueryResponse.raml"_ as implicit convention, here an example:
[CartDiscountPagedQueryResponse.raml](./api/types/cart-discount/CartDiscountPagedQueryResponse.raml).

##### - Update and update action

The Update is defined generically in the main resource data as **(updateType)** and here an example of update file:

```raml
(package): CartDiscount
type: object
displayName: CartDiscountUpdate
properties:
  version:
    type: number
    format: int64
  actions:
    type: array
    items: CartDiscountUpdateAction
```

The Update Action is defined in the Update file as actions properties,

```raml
properties:
  version:
    type: number
    format: int64
  actions:
    type: array
    items: CartDiscountUpdateAction
```

as well as in each Update actions as **type** which are in the [/updates](#updates) folder:

```raml
(package): CartDiscount
type: CartDiscountUpdateAction
displayName: CartDiscountChangeNameAction
discriminatorValue: changeName
example: !include ../../../examples/CartDiscount/CartDiscountChangeNameAction.json
properties:
  name:
    type: LocalizedString
    description: ''
```

##### - /updates

As said in the previous point [Update and Update Action](#update-and-update-action), in this folders there are all the update actions available for each endpoint.
In each of them is defined the **examples**, so the JSON file which is present in the example folder and the properties.
There is an implicit convention about how to name these files: (_name of the package_) + (_update action_) + _"Action.raml"_ like _"CartDiscountChangeNameAction.raml"_.

##### - /common

In this folder, there is the definition of all of our object collections. Which is defined also in our documentation: [https://docs.commercetools.com/api/types](https://docs.commercetools.com/api/types).
Here a classic example

```raml
(package): Common
displayName: LocalizedString
type: object
(asMap):
  key: string
  value: string
properties:
  /^[a-z]{2}(-[A-Z]{2})?$/:
    type: string
```

##### - /error

When we need to define an error, the related file is meant to be here in this folder.
The list of all of our error is also defined in our documentation [https://docs.commercetools.com/api/errors](https://docs.commercetools.com/api/errors).
There is an implicit convention about how to name these files: _name of the error_ + _"Error.raml"_.

##### - /message

As documented [https://docs.commercetools.com/api/projects/messages#message-types](https://docs.commercetools.com/api/projects/messages#message-types), we have Messages that are defined in this folder.
If you write at least the Message, automatically it will generate the related Payload in the **/message/payload** folder.
There is an implicit convention about how to name these files: _name of the error_ + _"Message.raml"_.
The same dynamic is for the _Payloads_: _name of the error_ + _"MessagePayload.raml"_.

##### - annotations.raml

In this file, there is the definition of all the annotations which can be used in the RAML files.
They can be added in our RAML file like in this case and they are enclosed in parenthesis like here:

```raml
  lastModifiedBy?:
    type: LastModifiedBy
    (beta): true
```

If you see the need for additional annotations, please raise your request in the slack channel: **#raml**

##### - types.raml

Every new file created will be add automatically in this file.

#### api.raml

The api.raml file contains the base of our APIs and the definition of everything mentioned before, such as:

- the _baseUri_ is defined in base of the Regions which are specified in the _baseUriParameters_.
- the _securitySchemes_: the path where we can find the default security scheme applied on all API endpoints (see [/securitySchemes](#security-schemes)).
- the _annotationTypes_: where the annotations are defined (see [annotations.raml](#annotationsraml)).
- the _types_: where the types are defined (see [types.raml](#typesraml)).

### Validator rules

Our own [RMF-Codegen](https://github.com/commercetools/rmf-codegen) contains a RAML validator tool that checks if:

- The given JSON examples adhere to their RAML types (optional values can be absent).
- The type names, property names, etc. follow our [API design guidelines](https://commercetools.atlassian.net/wiki/spaces/ADGAG/pages/467697895/API+DESIGN+GUIDELINES).

The validation takes place during the CI process triggered by a Github workflow. It is a required step in the build process, you cannot merge a Docs PR with validation errors.

You can run the validator locally from the root of each api specs folder:
`yarn raml:validate`.

#### Current status of validator rules

On [this wiki page](https://commercetools.atlassian.net/wiki/spaces/ADGAG/pages/2947514403/Spec+Validation+Rules), you can find an overview about the design rules that are currently checked by the validator and which are still to be added.

#### Newly added validator rules

A new validation rule is added to the [RMF-Codegen](https://github.com/commercetools/rmf-codegen) which is then pulled to this repository via [npm](https://www.npmjs.com/package/@commercetools-docs/rmf-codegen/).

To give us time to add the exception rules, we pinned the version of the validator in the CI workflow.

When a new validator version gets released,

- Try it out by running `yarn ramlvalidate` in the `api-specs` folder and add an exception for each of the validation errors.
- Increment the version of `@commercetools-docs/rmf-codegen` in the Github workflow files `.github/workflows/raml-validate-diff.yaml` and `.github/workflows/docs-kit-preview-pipeline.yaml`.

#### Add exceptions from validator rules

When a validator rule is introduced or tightened, existing RAML definitions can fail validation even if they must remain unchanged for compatibility reasons. In this case, add an exception in the `ruleset.xml` file of the affected API specs folder.

Use this general pattern:

1. Identify the failing validator rule from the validation output.
2. Open the matching `ruleset.xml` (for example, `api-specs/api/ruleset.xml` or `api-specs/import/ruleset.xml`).
3. Find the `<rule>` entry for that validator rule (`<name>...</name>`).
4. Add an exclusion under `<options>` using `<option type="exclude">...</option>`.
5. Use the exact value expected by that rule (for example, a resource path segment, type name, property name, enum type, or endpoint signature).
6. Re-run `yarn raml:validate` and keep the exception as narrow as possible.

Example:

```xml
<rule>
  <name>com.commercetools.rmf.validators.SomeRule</name>
  <options>
    <option type="exclude">exact-value-from-validation-error</option>
  </options>
</rule>
```

If multiple values must be excluded, add one `<option>` per value.

Prefer targeted exceptions instead of disabling an entire rule by:

```xml
<rule enabled="false">
  <name>com.commercetools.rmf.validators.ProblematicRule</name>
</rule>
```

# Generate a Postman Collection

Follow the steps in the [Generate a Postman Collection](https://github.com/commercetools/commercetools-docs/blob/main/api-specs/generate-a-postman-collection.md) guide to learn more.
