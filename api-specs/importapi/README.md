# Design Principles

## Data Model

* Parent-child relationships (e.g. a product variant contains prices) are 
modeled as unidirectional import references in the child. This makes it easier to
handle columnar/relational (e.g. CSV) imports, but we should reevaluate this design choice later.