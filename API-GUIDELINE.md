# API GUIDELINES
This page is a REST API Guidelines for the Backend Team.

##Overview
This Guidelines is to help developers to design APIs:

 - simple
 - consistent 
 - self-explanatory
 
The Keywords to have a good Guidelines are:
 
 - Consistency => following the Guidelines
 - Uniformity => checking in the code if there are other properties with similar name and adjust in base of it or improve it
 - Explicability => explain with a few words the purpose of the property Avoiding Abbreviations (there are some exceptions)

##Scope
These guidelines aim to achieve the definition of consistent practices and patterns for all API endpoints.

##URI
Our URIs are composed by:

BaseUri it's composed by:
   
    https://api.{region}.{cloudProvider}.commercetools.com 

    {projectKey}

    resources

    by ID

    by external ID with equals e.g. customers/key={key}

See our documentation for more details https://docs.commercetools.com/http-api.html#hosts

##Resources
Resource is an object or representation of something, which has some associated data with it and can be helped by methods to operate on it.

A resource can be an entity or a collection:
 - Entity is a resource that has to be in singular.
 - Collections are a set of resources that must be in plural.
 
A resource may contain sub-collection resources.

##Methods
The HTTP verbs used are;

 - GET - only for retrieving data
 - POST - Create or Update data
 - DELETE - Delete data

It's important to keep in mind the concept of Idempotency. So for instance use GET to retrieve data and not to delete content!

##Properties/Payload
Clients interact with a service by exchanging representations of resources.

##Naming convention

###General Guidelines
To use consistent names these are the rules to follow:

 DO'S
 - use nouns instead of verbs to expose resources
 - use lowercase and separated by hyphens (-) for path segments like /shopping-lists
 - use American English
 - create each resource as unique resource name
 - use the proper HTTP methods for API operations whenever possible
 
 DON'TS
 - DON'T use snake case (_) or other punctuation
 - DON'T use file extensions
 - DON'T use abbreviations
 - DON'T use CRUD HTTP methods or verbs

###Naming Properties
The properties are identified in base of the type: 
 - DateTime
 - Boolean
 - Number/Integer
 - String
 - Array
 - Object
 - Exceptions

####DateTime
In general, define a DateTime property using a name ending with "At", then if there is a range of date use "From" and "To".
Some examples:

        returnAt
        expirationAt
        validFrom
        validTo

####Boolean
Define a Boolean property using a name which includes "is" or "has" and the verb at past participle 
Some examples:

        isEmailVerified
        hasStagedChanges
        isPublished
        isActive
        
####Number/Integer
Define a Boolean property using names that can be quantified.
Some examples:

        availableQuantity
        restockableInDays
        version
        weight
        height
        orderNumber
        variantId
        totalAmount
      
####String
Define a Boolean property using names that have to be explicable.
Some examples:

      orderEditResult
      productName
      productKey
      productSku
      discountCode
         
####Array
Define an Array property using names ending with "s".
Some examples:

    discountCodes
    refusedGifts
    roles
    allowedValues
    
####Object
Define an Object property using "ResourceIdentifier" or "Draft" or "Reference" in the name.
Some examples:

    shippingMethod => ShippingMethodResourceIdentifier
    shippingRateInput => ShippingRateInputDraft
    product => ProductReference
    shippingDetailsToRemove => ItemShippingDetailsDraft
    discountedPricePerQuantity => DiscountedLineItemPriceForQuantity[]
    discountedPrice => DiscountedLineItemPrice  

####Exceptions
The rules mention have some exceptions:
 - it's allowed to write "id" even if is an abbreviation
 - "version" is one of the main fields that we have so we can avoid to explicate it better
        