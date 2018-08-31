database="${COCKROACH_DB:-helloworld}"
user="${COCKROACH_USER:-helloworld}"

if [ $COCKROACH_SECURE ]
then
  cockroach start \
  --certs-dir=certs
  echo "CREATE DATABASE ${database}; \
  CREATE USER ${user}; \
  GRANT ALL ON DATABASE ${database} TO ${user}" | cockroach sql 
else
  cockroach start --insecure
  echo "CREATE DATABASE ${database}; \
  CREATE USER ${user}; \
  GRANT ALL ON DATABASE ${database} TO ${user}"  | cockroach sql --insecure
fi