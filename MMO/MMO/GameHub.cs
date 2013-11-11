using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using Microsoft.AspNet.SignalR;

namespace MMO
{
    // To learn more about SignalR hubs check out: XXXXXXXXXXXXXX
    public class GameHub : Hub
    {
        // Create a game.  The reason why the game is static is because Hub's do not persist in the lifetime of a SignalR server.
        // They can actually be created multiple times per request.  Therefore we make our game static so there's only ever 1.
        static MMO game = new MMO();

        /// <summary>
        /// A SignalR method that is triggered whenever a new client has connected to the GameHub.
        /// </summary>
        public override Task OnConnected()
        {
            game.UserManager.AddUser(Context.ConnectionId);

            return base.OnConnected();
        }

        /// <summary>
        /// This method is exposed to the client to be invoked.  It is used to control the server's version of the player object.
        /// Note: By only allowing users to trigger the "Move" function the players movement controller our server retains authority over all the connected clients.
        /// </summary>
        /// <param name="direction">The direction that the player wants to move</param>
        /// <param name="startMoving">Whether or not the player wants to start moving.</param>
        public void Move(string direction, bool startMoving)
        {
            game.UserManager[Context.ConnectionId].MovementController.Move(direction, startMoving);
        }

        /// <summary>
        /// Looks up the player associated with the Connection Id and returns his unique identifier (ID).  The ID is set by the games UserManager when the player is created.
        /// </summary>
        /// <returns>The identifier that represents the player.</returns>
        public long WhoAmI()
        {
            return game.UserManager[Context.ConnectionId].ID;
        }
    }
}