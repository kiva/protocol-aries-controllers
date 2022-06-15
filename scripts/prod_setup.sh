#!/bin/bash
# Simple setup of each controller to be run as part of the integration tests
set -ev

docker exec -it kiva-controller node /www/dist/scripts/setup.employee.kiva.js
docker exec -it kiva-controller node /www/dist/scripts/setup.note.kiva.js
docker exec -it tdc-controller node /www/dist/scripts/setup.tdc.js
docker exec -it tdc-controller node /www/dist/scripts/setup.citizen.tdc.js

