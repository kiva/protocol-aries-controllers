# Intro

The apps in this repo simulate users in the [transaction system](https://github.com/kiva/protocol-aries/tree/master/implementations/tdc).
Each app is interactive, meaning you will direct their behaviors.  Each app run in a separate process.  The apps interact with their agents which in turn
interact with the TDC.

## Apps
In the endpoints directory, there are two desktop apps.  
FSP  - represents a bank, merchant, vendor, NGO etc....  
TRO - represents a citizen, individual   

The screens are simple representations of the workflow that creates a connect between
the TRO and the FSP through use of the TDC (controller in the implementation directory).

## Setup
1. Get [Protocol-Aries-Controllers](https://github.com/kiva/protocol-aries-controllers) working first
2. Download this repo into a separate folder
3. Setup to use dotnet.  Suggest looking at [this for now](https://avaloniaui.net/docs)

## Running
1. Get [Protocol-Aries-Controllers](https://github.com/kiva/protocol-aries-controllers) running.
   You will probably want to do this in separate console windows.  
2. In one console window, run `dotnet run --project endpoints/fsp/fsp.csproj`
3. In another console window, run `dotnet run --project endpoints/tro/tro.csproj`  

