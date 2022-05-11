# Integration tests

The top level integration tests that test whole the whole system functions together.
As a result It's best to run through the setup instructions in the [README](../README.md), first.

All requests go through the publicly exposed fsp controller , which means you can use localhost (eg no docker http references)

### Initial setup 
```
cd integration_tests && npm install
cd ../..
```

### Running the tests
Start up all the containers, run all the setup scripts, then run the tests.  To start up all of the containers,
please read the top level [README](../README.md).  Please remember to wait long enough for
all of the containers to start.

It can be useful to watch the logs at the same time:
```
docker-compose logs -f
```

### Thoughts
TODO we should have a script that watches for the containers coming up and automatically runs the setup scripts
