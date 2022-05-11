#!/bin/bash
# Simple setup of each controller to be run as part of the integration tests
set -ev

docker exec -it kiva-controller node /www/scripts/setup.sl.kiva.js
docker exec -it ncra-controller node /www/scripts/setup.sl.ncra.js
./implementations/ncra/identity_db/insertData.sh
docker exec -it ncra-controller node /www/scripts/issue.credentials.js NIN00001
docker exec -it ncra-controller node /www/scripts/issue.credentials.js NIN00002
docker exec -it kiva-controller node /www/scripts/setup.employee.kiva.js
docker exec -it kiva-controller node /www/scripts/setup.note.kiva.js
docker exec -it tdc-controller node /www/scripts/setup.tdc.js
docker exec -it tdc-controller node /www/scripts/setup.citizen.tdc.js

