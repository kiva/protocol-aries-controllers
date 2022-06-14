#!/bin/bash
# Simple setup of each controller to be run as part of the integration tests
set -ev

docker exec -it kiva-controller node /www/scripts/setup.employee.kiva.js
docker exec -it kiva-controller node /www/scripts/setup.note.kiva.js
docker exec -it tdc-controller node /www/scripts/setup.tdc.js
docker exec -it tdc-controller node /www/scripts/setup.citizen.tdc.js

