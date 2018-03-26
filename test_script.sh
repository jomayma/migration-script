./import_all.sh
node migrate-data.js
CHK=`mongo --quiet edx-course-db query_checker.js`
RES='{ "state" : "Alabama" }'

if [ "$CHK" == "$RES" ]; then
  echo "MIGRATION SCRIPT OK"
else
  echo "MIGRATION SCRIPT KO"
fi