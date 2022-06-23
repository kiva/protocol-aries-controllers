# Protocol Aries Controllers

This repo contains controllers using the aries-controller base.

The controllers in the repo are: FSP, Kiva, and TDC.

Note: These controllers were copied from the private repo [protocol-aries](https://github.com/kiva/protocol-aries).

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
1. Create a `home directory`.  The idea here is that we want some top level folder on your machine that contains all our repos in one place.
   You can call this "protocol-all" if you like.  Unless, specified, always run commands from the `home directory`.

3. Inside `home directory`, clone all our repos using these commands (please note the commands assume you have ssl setup):
    ```
    git clone git@github.com:kiva/protocol-aries.git
    ```
4. Change your working directory to protocol-aries
   ```
   cd protocol-aries
   ```
5. Run the following command, to populate some dummy env values into .env files
    ```
    ./scripts/dummy_env.sh
    ```
   There are a few token values still needed which can be found here:  
   [google doc](https://docs.google.com/document/d/1zpRvDuEpnbBiPN5JGVvBDujBUgSufGiKAf2AZd3azP8)

6. Run the following command to manually pull the latest bcgov image:
    ```
    docker pull bcgovimages/aries-cloudagent:py36-1.16-1_0.7.1
    ```

7. From the `protocol-aries-controllers`, start the dependency docker container (if you wish, you can append -d to the run command)
   ```
   docker-compose -f docker-compose.dep.yml build
   docker-compose -f docker-compose.dep.yml up
   ```

8. From the `protocol-aries-controllers`, start the protocol-aries-controllers containers
   ```
   docker-compose -f docker-compose.local.yml up --build --force-recreate
   ```
   Before you proceed to the next step, make sure all of the containers are actually running.
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
   tdc-agent                       Up 2 hours
   fsp-agent                       Up 2 hours
   kiva-agent                      Up 2 hours
   ```
9. From the `protocol-aries-controllers`, configure the controllers
   ```
   ./scripts/setup.sh
   ```
