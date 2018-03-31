# edX - Microsoft: DEV283x
## Introduction to Node.js
### Module 3 Assignment Lab: MongoDB Migration Node Script

Rel.1.1 - Migration/restoration script which will merge the data from the two sources.

Provided with two sample JSON files customer-data.json and customer-address-data.json which contain 1000 documents/objects (the real data could have 1000000+ objects). Assume that the order of the objects in each file correlates to objects in the other file.

Using the mongodb native driver and async modules. The script read the number of objects to process in a single query from a CLI argument. For example:
```
#will run 10 queries in parallel out of 1000 objects
 $ node migrate-data.js 100
 
#will run 20 queries in parallel out of the same 1000 objects. 
 $ node migrate-data.js 50
 ```

 To test the success of the script, and measure the execution time, yo can use this shell script:
 ```
 $ ./test_script.sh
 ```
