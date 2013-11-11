/// <reference path="Scripts/endgate-0.2.0.d.ts" />
/// <reference path="Scripts/typings/signalr/signalr.d.ts" />

class MMO extends eg.Game {
    private _players: { [id: number]: Player };
    private _controller: eg.InputControllers.DirectionalInputController;
    private _userId: number; // The user ID of the player that I will be controlling

    // If a canvas is not passed through to the Game's super constructor EndGate will generate a canvas that fills the entire page.
    constructor(canvas, proxy) {
        super(canvas);

        this._players = {};

        // Use JQuery to retrieve world.txt (a JSON file).
        // Only reason why it's not .json is because I'm lazy and didn't feel like adding the .json mime type.
        $.getJSON("world.txt").done((json: string) => {
            // We now have the JSON from world.txt so we can use the EndGate JSONLoader to load it.
            // This loads maps that are created via http://www.mapeditor.org/ tiled program.
            // Maps are loaded asynchronously since they could take a long time, to learn more check out http://endgate.net/samples/maploading
            eg.MapLoaders.JSONLoader.Load(json, (result: eg.MapLoaders.IMapLoadedResult) => {
                // Maps can have multiple layers so we have to iterate through the layers and then add them to our scene one by one.
                for (var i = 0; i < result.Layers.length; i++) {
                    // We're just subtracting 100 from each layers ZIndex to ensure that our laser cats are rendered on top of them.
                    result.Layers[i].ZIndex -= 100;
                    // Add the layer to the scene so it's rendered.
                    this.Scene.Add(result.Layers[i]);
                }
            });
        });

        // This method is triggered roughly 25 times per second, the default value. (can be configured in the server)
        proxy.client.serverPush = (serverPlayers) => {
            var serverPlayer, clientPlayer: Player;

            // The server pushes down a list of all players down to every client so we need to iterate over the servers version of the players
            // and see if we need to create or update a client version of a player.
            for (var i = 0; i < serverPlayers.length; i++) {
                serverPlayer = serverPlayers[i];
                // Try and look up our client player
                clientPlayer = this._players[serverPlayer.ID];

                // Check if there is a client version of the server player.
                if (clientPlayer) {
                    clientPlayer.LoadPayload(serverPlayer);
                } else { // There was not a client version of the player so we need to create a new one.
                    // Build a new player based off of the server player.
                    clientPlayer = new Player(serverPlayer);
                    // Monitor the created player so we don't create it again
                    this._players[serverPlayer.ID] = clientPlayer;
                    // Add the player to the scene so it's rendered.
                    this.Scene.Add(clientPlayer);
                }
            }
        };

        // Start the SignalR connection to the server.
        // This is asynchronous and returns a jQuery deferred.  You can learn more about jQuery deferred here: http://api.jquery.com/category/deferred-object/
        $.connection.hub.start().done(() => {
            // Invoke the server method "WhoAmI" (note that SignalR camel cases the method in the /signalr/hubs dynamically generated javascript file) so we can determine what our players user id is.
            proxy.server.whoAmI().done((userId) => {
                // Save our user id so we can set the Scene's camera position to our players position.
                this._userId = userId;

                // Build an input controller to do all of our heavy lifting of capturing keyboard input.
                // To learn more check out the input controller sample here: XXXXXXXXXXXXXXXX
                this._controller = new eg.InputControllers.DirectionalInputController(this.Input.Keyboard,
                    // This function is executed every time the "User" attempts to perform a move. Aka every time they press the following keys:
                    // "w", "a", "s", "d", "Left", "Up", "Right", "Down".
                    // The direction is the direction in which the user attempted to move and the startMoving is whether or not the user attempted to start or stop moving.
                    (direction: string, startMoving: boolean) => {
                        // Invoke the "Move" function on the server and pass in the direction and the startMoving parameter.(note that SignalR camel cases the method in the /signalr/hubs dynamically generated javascript file) so we can determine what our players user id is.
                        proxy.server.move(direction, startMoving);
                    });
            });
        });
    }

    // The Update function is triggered roughly 60 times per second (can be configured).
    public Update(gameTime: eg.GameTime): void {
        // Iterate through each of our players and update each one so that they can move.
        for (var id in this._players) {
            this._players[id].Update(gameTime);
        }

        // Check "Do I have a client player that is 'me'?"
        if (this._players[this._userId]) {
            // Move the scene's camera to be looking directly at me.
            // Note: In EndGate all positions are "center" positioned so simply setting the camera's position to my position centers it directly on me.
            // To learn more check out the camera sample here: XXXXXXXXXXXXX
            this.Scene.Camera.Position = this._players[this._userId].MovementController.Position;
        }
    }
}

// A player (laser cat) that inherits from the EndGate Sprite2d class (essentially an image that can be rendered to the screen).
// To learn more about Sprite2d's check out the sample here: XXXXXXXXXXXXX
class Player extends eg.Graphics.Sprite2d {
    // Define our graphic to be static since all of our players should be using the same image
    static Graphic = new eg.Graphics.ImageSource("player.png", 75, 75);

    // Our player uses the LinearMovementController which is great at performing "Linear" movement. AKA moving an object with no acceleration.
    // It supports the following movements: "Left", "Right", "Up", "Down".
    // To learn more check ou the MovementController sample here: XXXXXXXXXXXXXXXXX
    public MovementController: eg.MovementControllers.LinearMovementController;

    // Our player takes in a server player and then updates its flags to match.
    constructor(serverPlayer) {
        // We initially set the Player to be at 0, 0 because we immediately set the position to the server player's position via the LoadPayload method.
        super(0, 0, Player.Graphic);

        // Initialize a MovementController with the player as one of the IMoveables that are taken in and set the initial move speed to 100 pixels per second.
        // The reason why the IMoveables is an array is because the MovementController can sync more than one objects position to match its own.
        // You can see a great example of where this is used in the XXXX sample here: XXXXXXXXXXXXXXXXX
        this.MovementController = new eg.MovementControllers.LinearMovementController(new Array<eg.IMoveable>(this), 100);

        // Ensure that our position and our movement controller are up-to-date with the server version of the player.
        this.LoadPayload(serverPlayer);
    }

    // Used to synchronize client and server positions
    public LoadPayload(serverPlayer): void {
        this.MovementController.Position = new eg.Vector2d(serverPlayer.MovementController.Position.X, serverPlayer.MovementController.Position.Y);

        // Iterate through each of the serverPlayer's moving flags and synchronize the client players MovementController to match.
        for (var direction in serverPlayer.MovementController.Moving) {
            this.MovementController.Move(direction, serverPlayer.MovementController.Moving[direction]);
        }
    }

    // Called from the MMO's Update method
    public Update(gameTime: eg.GameTime): void {
        // We update the MovementController so that it can move our player in the desired direction.
        this.MovementController.Update(gameTime);
    }
}

// The .connection in $.connection is added by SignalR and the .gameHub is added by the /signalr/hubs file.  
// Since the / signalr / hubs file is dynamically generated we have to tell TypeScript that we know that the
// .gameHub property is there so we cast the $.connection to "any".  "any" is essentially any raw javascript object.
var hubProxy = (<any>$.connection).gameHub,
    // Initialize a new instance of our game (so it starts rendering/updating) and pass in the canvas with the id of "game" to be used as the game area.
    game = new MMO(document.getElementById("game"), hubProxy);