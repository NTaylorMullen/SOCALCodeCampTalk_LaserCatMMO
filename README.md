Lightweight MMO
=============================

This is a light weight laser cat MMO that was built live on stage for a talk at the [Southern California Code Camp in LA] (socalcodecamp.com).  It was built using [Microsoft's ASP.NET SignalR] (http://github.com/SignalR/SignalR) and [EndGate] (http://github.com/ntaylormullen/EndGate) all of which were brought down via the [EndGate.Multiplayer Nuget package] (http://www.nuget.org/packages/EndGate.Multiplayer).

**Disclaimers:**
- This code does not represent "proper" coding techniques due to the fashion in which it was created.
- This code is not production ready (it wouldn't hold many players if it were published live).  See below for ways to build upon this code set to get it to production level standards.

**Places to learn more:**  
- SignalR: http://www.asp.net/signalr  
- EndGate: http://endgate.net/  

#Building the source

1. Follow the instructions [here] (http://endgate.net/FAQ#question2) to install TypeScript and get you environment setup.
2. Build :)

#Tasks to learn and improve the codebase

**Note:** I mention ShootR a lot in these tasks however ShootR is not currently using the server version of EndGate (it was just released and I haven't gotten around to updating ShootR);  Therefore for all things that are offered in the EndGate server libraries ShootR implements its own versions.

##Refactoring to "proper" code
1. Classes should be in their own files.  The app.ts should only contain game construction code and any other global level constructions (var game = new MMO....).
2. There should be a ***Map*** class which is then constructed and added to the game scene (instead of doing it inline).
3. SignalR related code should be abstracted into an adapter.  You can see how ShootR does it [here] (https://github.com/NTaylorMullen/ShootR/blob/master/ShootR/ShootR/Client/Server/ServerAdapter.ts).
4. There should be a PlayerManager of some sort which handles creating and updating players.  You can see how ShootR does it [here] (https://github.com/NTaylorMullen/ShootR/blob/master/ShootR/ShootR/Client/Ships/ShipManager.ts).

***There's more refactoring tasks but those are my initial observations after one pass through.***

##Getting to "production level" code
1. Players should ONLY receive player data for player's that they are in their viewport.  ShootR accomplishes this by tracking user viewports and then running intersection checks (intersections with the viewport) to determine what ships can be seen by each player.
2. Payloads should be smaller.  Currently we're sending everything about the players over the wire.  By adding JsonIgnore attributes to our Player's properties that are not used on the client we can minimize the amount of data we send.
3. ***Optional*** Add interpolation logic to the clients so if a user happens to have a slower connection the game doesn't appear choppy. You can see how ShootR does it [here] (https://github.com/NTaylorMullen/ShootR/blob/master/ShootR/ShootR/Client/Ships/ShipInterpolationManager.ts).

***There's more performance improving tasks that could be done but with just 1 and 2 you should be able to get a significant amount of players on a server.  Number 3 is there to improve play quality.***
