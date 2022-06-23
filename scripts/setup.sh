#!/bin/bash
# Setups up Kiva & NCRA with everything they need on ledger, and inserts data into the DB
# Run from the top level protocol-aries
# Runs in dev mode using the .ts files (as opposed to prod mode using transpiled .js files)
set -ev

# Install ts-node for each controller
docker exec --privileged -i -t -u root kiva-controller npm install -g ts-node
docker exec --privileged -i -t -u root ncra-controller npm install -g ts-node
docker exec --privileged -i -t -u root tdc-controller npm install -g ts-node

docker exec -it kiva-controller ts-node -r dotenv/config /www/src/scripts/setup.employee.kiva.ts
docker exec -it tdc-controller ts-node -r dotenv/config /www/src/scripts/setup.tdc.ts
docker exec -it tdc-controller ts-node -r dotenv/config /www/src/scripts/setup.citizen.tdc.ts
docker exec -it kiva-controller ts-node -r dotenv/config /www/src/scripts/setup.note.kiva.ts
