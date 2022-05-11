# Top level readme for implementations

To run the implementations, see the repo [README](../README.md) for instructions.

### To tests the full loop manually

Ensure that all containers have been spun up, including the agents for kiva, ncra, and fsp
Then run the setup scripts (we use docker exec to call them from within the docker container)
Note: I don't love this approach, we need the npm install -g command to get ts-node working globally

From the `protocol-aries directory`:
```
./implementations/ncra/identity_db/insertData.sh
```

Then manually run through the issuer and verifier flows using insomnia
``` 
  Onboard citizen  
  POST  http://localhost:3012/v1/issuer/onboard  
    {  
        "credDefProfile": "ncra.kyc.cred.def.json",  
        "entityId": "NIN00001"  
    }  
  Check docker to see a random container has been spun up (eg LO2PEzO0nAbE6Xg7GJ2KfK)  
  Check the escrow db for connection details if you want to access the agent directly  
  docker exec -it escrow-db psql -U dbuser escrowdb  
  select * from wallet_credentials  
```
```  
  Manually spin down the agent  
  DELETE http://localhost:3010/v1/manager  
  {  
      "agentId": "THE_AGENT_ID"  
  }  
  Note this will happen automatically in 15 min, or we can have the end of the issuer flow do this  
```
``` 
  Do the sms otp flow  
  POST http://localhost:3013/v1/kyc/sms  
    {  
        "filters": {  
            "nationalId": "NIN00001"  
        },  
        "phoneNumber": "+23287654321",  
        "device": {}  
    }  
  Takes about 20s...  
```

Once you're confirmed that the setup is correctly locally, spin everything down and head over to the integration_tests folder

## Notes
TODO instead of having custom module names, they could all have the same, and that would reduce the number of env params  

## Testing with local code base for aries-guardianship-agency
(If this doesn't make sense, ask Matt.  He probably is no help though)
1. Get aries-guardianship-agency code.  
   `git clone https://github.com/kiva/aries-guardianship-agency`
2. Get environment configured for code downloaded in #1 above.
3. Add these env settings to .env for aries-guardianship-agency
   ```
     AGENT_GUARD_ENABLED=false
     MULTI_CONTROLLER=true
   ```
4. Build/Run docker-compose.yml in aries-guardianship-agency
5. Configure the .env for ncra, fsp and tdc controller to protocol-aries/implementation to use wallets-db
6. Run protocol-aries/implementation/docker-compose.local.yml
7. Run what you need from scripts/setup.sh in protocol-aries. This probably should be enough:
   ```
     docker exec -it kiva-controller ts-node -r dotenv/config /www/src/scripts/setup.sl.kiva.ts
     docker exec -it tdc-controller ts-node -r dotenv/config /www/src/scripts/setup.tdc.ts
     docker exec -it tdc-controller ts-node -r dotenv/config /www/src/scripts/setup.citizen.tdc.ts
   ```

