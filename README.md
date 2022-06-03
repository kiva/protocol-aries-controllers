# Protocol Aries Controllers

This repo contains controllers using the aries-controller base.

The controllers in the repo are: FSP and TDC.

Note: These controllers were copied from the private repo [protocol-aires](https://github.com/kiva/protocol-aries).

### Notes
This repo is dependent on additional protocol resources.  Here's the links:  
[aries-guardianship-agency](https://github.com/kiva/aries-guardianship-agency)  
[aries-key-guardian](https://github.com/kiva/aries-key-guardian.git)  
[protocol-common](https://github.com/kiva/protocol-common.git)  
[protocol](https://github.com/kiva/protocol.git)

### Pre-setup
You will need git, docker, docker-compose, npm, nodejs and java installed on your machine.

For docker, we recommend increasing its allocated resources to:
- CPUs: 8
- Memory: 7 GB
- Swap: 2 GB

## Setup
1. Create a `home directory`.  The idea here is that we want some top level folder on your machine that contains all our repos in one place.  You can call this "protocol-all" if you like.  Unless, specified, always run commands from the `home directory`.

2. Inside `home directory`, clone all our repos using these commands (please note the commands assume you have ssl setup):
    ```
    git clone git@github.com:kiva/protocol-aries.git
    ```
3. Change your working directory to protocol-aries
   ```
   cd protocol-aries
   ```
4. Run the following command, to populate some dummy env values into .env files
    ```
    ./scripts/dummy_env.sh
    ```
   There are a few token values still needed which can be found here:  
   [google doc](https://docs.google.com/document/d/1zpRvDuEpnbBiPN5JGVvBDujBUgSufGiKAf2AZd3azP8)

5. Run the following command to manually pull the latest bcgov image:
    ```
    docker pull bcgovimages/aries-cloudagent:py36-1.16-1_0.7.1
    ```

6. From the `protocol-aries`, start the dependency docker container (if you wish, you can append -d to the run command)
   ```
   docker-compose -f docker-compose.dep.yml build
   docker-compose -f docker-compose.dep.yml up
   ```

7. From the `protocol-aries`, start the protocol-aries container
   ```
   docker-compose -f docker-compose.local.yml up --build --force-recreate
   ```
   Before you proceed to the next step, make sure all of the containers are actually
   running.
   ```
   docker ps --format "table {{.Names}}\t{{.Status}}"'
   ```

   Make sure the following containers by name are running aka status `up` is indicated. Please note that the times shown below are examples and
   do not have to match exactly.  Make sure the status `up` is indicated.
   ```
   NAMES                           STATUS
   fsp-controller                  Up 54 minutes
   tdc-controller                  Up 54 minutes
   kiva-controller                 Up 54 minutes
   ncra-controller                 Up 54 minutes
   ncra-agent                      Up 2 hours
   tdc-agent                       Up 2 hours
   fsp-agent                       Up 2 hours
   kiva-agent                      Up 2 hours
   ```
8. From the `protocol-aries`, configure the controllers
   ```
   ./scripts/setup.sh
   ```
