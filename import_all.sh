mongoimport --db edx-course-db --collection m3-customer --drop --jsonArray --maintainInsertionOrder --file ./data/m3-customer-data.json

mongoimport --db edx-course-db --collection m3-customer-address --drop --jsonArray --maintainInsertionOrder --file ./data/m3-customer-address-data.json