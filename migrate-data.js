const parallel = require('async/parallel')
const mongodb = require('mongodb')
//Migration/restoration script which will merge the data from the two sources.
//Use the mongodb native driver and async modules.
//Read the number of objects to process in a single query from a CLI argument.
//For example, node migrate-data.js 100 will run 10 queries in parallel out of 100 objects

// Connection URL
const url = 'mongodb://localhost:27017'
//DB name
const dbname = 'edx-course-db'

if (process.argv.length > 2) {
    range = parseInt(process.argv[2], 10)
} else {
    range = 100
}
console.log(range)

// QueryObject - Superclass
function QueryObject(db){
    this.db = db
    this.from = 0
    this.to = 0
    this.addressArray = []
    this.addresses = null
}
QueryObject.prototype.setInterval = function(f,t) {
    this.from = f
    this.to = t
}
QueryObject.prototype.setAddresses = function(a) {
    this.addresses = a
}
QueryObject.prototype.queryAddresses = function (qObj, innercallback, callback) {
    coll = qObj.addresses
    coll.toArray(function(error,addArr) {
        if (error) {
            console.error(error)
        } else if (addArr.length > 0) {
            qObj.addressArray=addArr
            console.log("Into QueryObject.prototype.queryAddresses from "
            ,qObj.from," to ", qObj.to," addressArray.length ",qObj.addressArray.length
            , " addressArray[0].city=",qObj.addressArray[0].city
            //, " addressArray[1].city=",qObj.addressArray[1].city
            //, " addressArray[",range-2,"].city=",qObj.addressArray[range-2].city
            , " addressArray[",range-1,"].city=",qObj.addressArray[range-1].city)
            innercallback(qObj, callback)
        }
    })
}
QueryObject.prototype.updateCustomers = function (qObj, callback){
    console.log("handle callback updateCustomers addressArray.length ",qObj.addressArray.length)
    var cust_coll = qObj.db.collection('m3-customer')
    var customers = cust_coll.find().skip(qObj.from).limit(qObj.to-qObj.from+1)
    var count = 0
    var nUpdated = 0
    var addressArray = qObj.addressArray
    
    function updateCustomer(collection, customer, address) {
        // Get the m3-customer collection
        var collection = qObj.db.collection('m3-customer')
        collection.update(
            { _id: customer._id }
            , {$set: {country : address.country, city: address.city, state: address.state, phone: address.phone}}
            ,(error, result) => {
                if (error) return process.exit(1)
                //console.log(result.result.n) // will be 1
                //console.log(`Updated the customer document where _id = ${customer._id}`)
                //console.log("count=",count," addressArray.length=",addressArray.length)
                nUpdated++
                if (nUpdated == addressArray.length) {
                    console.log(`From updateCustomers - Updated Customers from ${qObj.from} to ${qObj.to}`)
                    callback(`Calling back - Updated Customers from ${qObj.from} to ${qObj.to}`)
                }
            }
        )
    }

    customers.forEach(
      function(customer){
            // Called zero or more times, once per document in result set
            address = addressArray[count]
            if (customer && address) {
                updateCustomer(customers, customer, address)
            } else {
                console.log("cust is null ?!?!?")
            }
            count++
      }
    , function(err){
        // Called exactly once, after all documents have been iterated over, or when there is an error
        if (err) {
            console.log("err = ",err)
        }
      }
    )
}
QueryObject.prototype.updateDocuments = function(callback) {
    // Get the collections
    var address_coll = this.db.collection('m3-customer-address')
    var addresses = address_coll.find().skip(this.from).limit(this.to-this.from+1)
    var customer, address

    this.setAddresses(addresses)
    this.queryAddresses(this, this.updateCustomers, callback)
}

// Use connect method to connect to the Server
mongodb.MongoClient.connect(url, (err, client) => {
    if (err) return process.exit(1)
    console.log('Connected successfully to server')
    // Perform queries
    const db = client.db(dbname)
    let objArr = []
    let maxRows = 1000
    for(i=0; i<maxRows; i=i+range) {
       let qo = new QueryObject(db)
       if (i+range < maxRows) {
        qo.setInterval(i,i+range-1)
       } else {
        qo.setInterval(i,maxRows-1)
       } 
       objArr.push(
        function(callback) {
            let q = qo
            q.updateDocuments(callback)
        }
       )
    }

    var nWorkers = objArr.length
    var nWorkersFinish = 0
    parallel(
        objArr,
        // optional callback
        function(error, results) {
            if (error) console.error(error)
            console.log(`from parallel ${results}`)
            nWorkersFinish++
            if (nWorkersFinish = nWorkers) {
                client.close()
            }
        }
    )
})