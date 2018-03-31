 
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
console.log(`${range} Customer records to update by Worker...`)

// QueryObject - Superclass
function MigrationObject(){
    this.from = 0
    this.to = 0
    this.addressArray = []
    this.addresses = null
}
MigrationObject.prototype.getAddressArray = function(db, callback){
    var coll = db.collection('m3-customer-address').find().skip(this.from).limit(this.to-this.from+1)
    coll.toArray(function(error,addArr) {
        if (error) {
            console.error(error)
        } else if (addArr.length > 0) {
            callback(addArr)
        }
    })
}
MigrationObject.prototype.setInterval = function(f,t) {
    this.from = f
    this.to = t
}
MigrationObject.prototype.updateCustomer = function(db, customer, address, callback) {
    var collection = db.collection('m3-customer')
    collection.update(
        { _id: customer._id }
        , {$set: {country : address.country, city: address.city, state: address.state, phone: address.phone}}
        ,callback
    )
}
MigrationObject.prototype.updateCostumersByAddressArr = function(db, addrObj, callback){
    var customers = db.collection('m3-customer').find().skip(this.from).limit(this.to-this.from+1)
    var nUpdated = 0
    var count = 0
    var updateCustomer = this.updateCustomer
    var msg = `from ${this.from} to ${this.to}`
    customers.forEach(
        function(customer){
              // Called zero or more times, once per document in result set
              address = addrObj[count]
              if (customer && address) {
                updateCustomer(db, customer, address, (error, result) => {
                    if (error) return callback(error, msg)
                    nUpdated++
                    if (nUpdated == addrObj.length) {
                        callback(null,msg)
                    }
                })
              } else {
                  console.log("Oops! customer is null ?!?!?")
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

// Use connect method to connect to the Server
mongodb.MongoClient.connect(url, (err, client) => {
    if (err) return process.exit(1)
    console.log('Connected successfully to server')
    // Perform queries
    const db = client.db(dbname)
    let objArr = []
    let maxRows = 1000
    for(i=0; i<maxRows; i=i+range) {
       let mo = new MigrationObject()
       if (i+range < maxRows) {
        mo.setInterval(i,i+range-1)
       } else {
        mo.setInterval(i,maxRows-1)
       } 
       objArr.push(
        function(callback) {
            mo.getAddressArray(db, (addrArr) => {
                mo.updateCostumersByAddressArr(db, addrArr, (error,result) =>{
                    callback(error,result)
                })
            })
        }
       )
    }
    parallel(
        objArr,
        // optional callback
        // running once all the functions have completed 
        function(error, results) {
            if (error) console.error(error)
            console.log(`parallel callback :: Finished Customers updating tasks, with ${objArr.length} Workers [${results}]`)
            console.log("Closing connection.")
            client.close()
        }
    )
})
