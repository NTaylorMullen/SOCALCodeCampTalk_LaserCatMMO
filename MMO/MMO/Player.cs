using EndGate.Server;
using EndGate.Server.MovementControllers;

namespace MMO
{
    // A light weight version of the client player.  The server player does not need to render anything graphically. It just has to represent a player in its lightest form.
    public class Player : IUser, IMoveable, IUpdateable
    {
        public Player()
        {
            // Every player that is created will start at 100, 100
            Position = new Vector2d(100, 100);
            // With a rotation of 0
            Rotation = 0;
            // Just like the client, we pass in an array of IMoveables, in this case just "us" and our MovementController will move us at 100 pixels per second.
            MovementController = new LinearMovementController(new IMoveable[] { this }, 100);
        }

        /// <summary>
        /// Updated by the MMO game object
        /// </summary>
        /// <param name="gameTime">Represents the overall game time and how much time has passed since the last time the game updated.</param>
        public void Update(GameTime gameTime)
        {
            // We update the MovementController so that it can move our player in the desired direction.
            MovementController.Update(gameTime);
        }

        public LinearMovementController MovementController { get; set; }

        public Vector2d Position { get; set; }

        public double Rotation { get; set; }

        /// <summary>
        /// A ConnectionId is assigned via a SignalR connection, every connected client to a signalr server has a unique Connection Id GUID.
        /// </summary>
        public string ConnectionID { get; set; }

        public long ID { get; set; }
    }
}