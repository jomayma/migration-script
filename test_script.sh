./import_all.sh
START="$(date +%s)"
node migrate-data.js 150
END="$(date +%s)"
DIFF="$(($END-$START))"
CHK=`mongo --quiet edx-course-db query_checker.js`
RES='{ "state" : "Florida" }
{ "state" : "Alabama" }'
#echo "query result $CHK"
if [ "$CHK" == "$RES" ]; then
  echo "MIGRATION SCRIPT OK. EXECUTED ON $DIFF SECONDS"
else
  echo "MIGRATION SCRIPT KO"
fi
