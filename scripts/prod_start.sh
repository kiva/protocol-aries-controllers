#!/bin/bash
# Starts up all the containers needed for local testing using the prod containers
# You should run the build commands on each docker-compose to build with the latest code
# Run from the top level protocol-aries
set -ev

docker-compose -f ../aries-guardianship-agency/docker-compose.ci.yml up -d
docker-compose -f ../aries-key-guardian/docker-compose.yml up -d
docker-compose -f ../guardian-bio-auth/docker-compose.yml up -d
# For now we need to make sure the agency is up before trying to spin up agents, we can remove this when we have better error handling
sleep 5
docker-compose -f docker-compose.ci.yml up -d
