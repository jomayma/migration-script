function get_results (result) {
    print(tojson(result));
}

db['m3-customer'].find({id: "1000"},{state:1,_id:0}).forEach(get_results)