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
function QueryObject(){
    this.from = 0
    this.to = 0
}
QueryObject.prototype.setInterval = function(f,t) {
    this.from = f
    this.to = t
}

QueryObject.prototype.updateDocuments = function(db, callback) {
    // Get the collections
    var cust_coll = db.collection('m3-customer')
    var address_coll = db.collection('m3-customer-address')

    var customers = cust_coll.find().skip(this.from).limit(this.to-this.from)
    var addresses = address_coll.find().skip(this.from).limit(this.to-this.from)
    var customer, address
    var addressArray = []
  
    function queryAddresses(coll, callback) {
        coll.toArray(function(error,addArr) {
            if (error) {
                console.error(error)
            } else if (addArr.length > 0) {
                addressArray.push(addArr)
                callback()
            }
            //callback(null, `${this.from} to ${this.to}`)
        })
    }
    queryAddresses(addresses, function(){
        console.log(addressArray.length)
        console.log(addressArray[0].city)
        console.log(addressArray[1].city)
    })

    console.log(addressArray.length)

    customers.forEach(function (cust) {
        console.log(cust.id)
        //console.log(`out ${addressArray.length}`)
     })

        /*
        cust_coll.update({_id: customer._id}, { $set: adress }, (error, result) => {
            if (error) callback(error, null)
            console.log(result.result.n) // will be 1
            console.log(`Updated the customer where id = ${id}`)
        })
        */

    
    //callback(null, cust.id)
    //callback(null, result)
    callback(null, `${this.from} to ${this.to}`)
}
//Set the Starting Point of the Result Set¶
//db.bios.find().skip( 5 )

//Limit the Number of Documents to Return¶
//db.bios.find().limit( 5 )

// Use connect method to connect to the Server
mongodb.MongoClient.connect(url, (err, client) => {
    if (err) return process.exit(1)
    console.log('Connected successfully to server')
    // Perform queries
    const db = client.db(dbname)
    let objArr = []
    let maxRows = 1000
    for(i=0; i<maxRows; i=i+range) {
       let qo = new QueryObject()
       if (i+range < maxRows) {
        qo.setInterval(i,i+range-1)
       } else {
        qo.setInterval(i,maxRows-1)
       } 
       objArr.push(
        function(callback) {
            let q = qo
            q.updateDocuments(db,callback)
            //setTimeout(function() {
            //callback(null, `merged from ${q.from} to ${q.to}`)
            //}, q.from)
        }
       )
    }

    parallel(
        objArr,
        // optional callback
        function(error, results) {
            if (error) console.error(error)
            console.log(results)
        }
    )

    client.close()
})