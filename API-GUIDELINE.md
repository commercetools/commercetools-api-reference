# API GUIDELINES

## Overview
As commercetools is 100% API First, it's important to have a well designed developer experience.
Additionally we aim to achieve more automation and improve the review process of new changes in the APIs.

With this in mind, we have created "API Guidelines" that aims to help developers to design APIs:

 - simple
 - consistent 
 - self-explanatory
 
The Keywords to have a good Guidelines are:
 
 - Consistency => following the Guidelines
 - Uniformity => checking in the code if there are other fields with similar names and adjusting field naming based on it
 - Explicability => explaining in a few words the purpose of the field avoiding abbreviations (there are some [exceptions](#exceptions)).

## Scope
The purpose of these guidelines is to define consistent practices and patterns for all API endpoints.

## URI
Our URIs are composed by:
   
    Base Uri like:
        https://{service}.{region}.{cloudProvider}.commercetools.com 

    {projectKey}

    resources

    URI parameters like:
        /{ID}
        /customer-id={customerId}


See our documentation for more details https://docs.commercetools.com/http-api.html#hosts and  https://docs.commercetools.com/http-api-authorization#requesting-an-access-token-using-commercetools-oauth2-server

### Query Parameters
The Query Parameters is a set of parameters added to the end of the URL. They are extensions of the URL that are used to help define specific content or action based of the data being passed.

In this case the rules to follow are:
 - follow the same naming convention as the properties
 - don't change the response type based on the query parameters
 - avoid XOR parameters
 
 Some examples:
 
    customerId
    staged
    sku
    cartId
    markMatchingVariants
    country
    currency
    localeProjection

## Resources
A Resource is a set of data in the e-commerce domain, which is specified by properties and methods to operate on them.

A resource can be singleton or collection:
 - Singleton is a single resource that has to be written in singular. For example:
 
        /product
        /products/{ID}
 - Collections are a set of resources that must be in plural. For example:

        /products
 
A resource may contain sub-collection resources.

## Methods
The HTTP verbs used are:

 - GET -> retrieve resource
 - POST -> create resource (it should return a 201 HTTP status code) or update resource (it should return a 200 HTTP status code)
 - DELETE -> delete resource

It's important to avoid unexpected behavior. So for instance use GET to retrieve data and not to delete content!

## Properties/Payload
Clients interact with a service by exchanging representations of resources and providing URL parameters.

An example of the Cart payload:

    {
       "type": "Cart",
       "id": "2a3baa00-44fa-4ab8-bec7-933c31e18dcc",
       "version": 5,
       "createdAt": "2015-09-22T15:36:17.510Z",
       "lastModifiedAt": "2015-09-22T15:41:55.816Z",
       "lineItems": [
         {
           "id": "b925a817-d5ad-48bb-a407-29ad8e0649b5",
           "productId": "9f10dcfb-5cc9-4a18-843a-c07f7e22d01f",
           "name": {
             "en": "SAPPHIRE"
           },
           "productType": {
             "typeId": "product-type",
             "id": "2543e1d8-4915-4f72-a3c9-1df9b1b0082d",
             "version": 8
           },
           "productSlug": {
             "en": "sapphire1421832124423"
           },
           "variant": {
             "id": 1,
             "sku": "sku_SAPPHIRE_variant1_1421832124423",
             "prices": [
               {
                 "value": {
                   "type": "centPrecision",
                   "fractionDigits": 2,
                   "currencyCode": "EUR",
                   "centAmount": 2800
                 },
                 "id": "8da659ef-9e54-447d-9c36-84912db1848f"
               }
             ],
             "images": [
               {
                 "url": "https://www.commercetools.com/cli/data/252542005_1.jpg",
                 "dimensions": {
                   "w": 1400,
                   "h": 1400
                 }
               }
             ],
             "attributes": [],
             "assets": []
           },
           "price": {
             "value": {
               "type": "centPrecision",
               "fractionDigits": 2,
               "currencyCode": "EUR",
               "centAmount": 2800
             },
             "id": "8da659ef-9e54-447d-9c36-84912db1848f"
           },
           "quantity": 2,
           "discountedPricePerQuantity": [],
           "state": [
             {
               "quantity": 2,
               "state": {
                 "typeId": "state",
                 "id": "7c2e2694-aefe-43d7-888e-6a99514caaca"
               }
             }
           ],
           "priceMode": "Platform",
           "lineItemMode": "Standard",
           "totalPrice": {
             "type": "centPrecision",
             "fractionDigits": 2,
             "currencyCode": "EUR",
             "centAmount": 5600
           }
         }
       ],
       "store": {
         "typeId": "store",
         "key": "test-key"
       },
       "cartState": "Active",
       "totalPrice": {
         "type": "centPrecision",
         "fractionDigits": 2,
         "currencyCode": "EUR",
         "centAmount": 5600
       },
       "customLineItems": [],
       "discountCodes": [],
       "inventoryMode": "None",
       "taxMode": "Platform",
       "taxRoundingMode": "HalfEven",
       "taxCalculationMode": "LineItemLevel",
       "refusedGifts": [],
       "origin": "Customer"
     }

## Naming convention

### General Guidelines
To use consistent names these are the rules to follow:

 DO'S
 - use nouns instead of verbs to expose resources
 - use lower case and separated by hyphens (-) for path segments like /shopping-lists
 - use camel case for properties and query parameters names
 - use American English
 - create each resource as unique resource name
 - use the proper HTTP methods for API operations whenever possible so GET or POST or DELETE
 
 DON'TS
 - DON'T use snake case (_) or other special characters
 - DON'T use file extensions
 - DON'T use abbreviations
 - DON'T use CRUD HTTP methods or verbs

### Naming Properties
The properties are identified in base of the type: 
 - DateTime
 - Boolean
 - Number/Integer
 - String
 - Array
 - Object

#### DateTime
In general, define a DateTime property using a name ending with "At", then if there is a range of date use "From" and "To".

Some examples:

        returnAt
        expirationAt
        validFrom
        validTo

#### Boolean
Define a Boolean property by a the past participle form of a verb. 
Do NOT use the auxiliary verb "is" as prefix here, but "has" can be used in combination with a noun.

Some examples:

        emailVerified
        hasStagedChanges
        published
        active
        
#### Number/Integer
Define a Number/Integer property using names that can be quantified.

Some examples:

        availableQuantity
        restockableInDays
        version
        weight
        height
        variantId
        totalAmount
      
#### String
Define a String property using names that have to be explicable about the content.

Some examples:

      orderEditResult
      productName
      productKey
      productSku
      discountCode
         
#### Array
Define an Array property using names in plural form, typically ending with "s".

Some examples:

    discountCodes
    refusedGifts
    roles
    allowedValues
    
#### Object
Define an Object property using names that have to be explicable about the content and the scope.

Some examples:

    shippingMethod
    shippingRateInput
    product
    shippingDetailsToRemove
    discountedPricePerQuantity
    discountedPrice 

#### Exceptions
The only exception allowed is:
 - write "Id" even if is an abbreviation
 - write "Sku" even if is an abbreviation
