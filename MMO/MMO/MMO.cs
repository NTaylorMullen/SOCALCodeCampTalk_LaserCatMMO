using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using EndGate.Server;
using EndGate.Server.SignalR;
using Microsoft.AspNet.SignalR;

namespace MMO
{
    // By extending the EndGate.Server game class the MMO class then has its Update and Push functions triggered on a regular interval (can be configured).
    public class MMO : Game
    {
        // The UserManager is a class defined by EndGate.Server.SignalR and is used to manage and create users.
        public UserManager<Player> UserManager = new UserManager<Player>();
        // This hub context allows us to communicate to users who are connected to the GameHub.
        private IHubContext _hubContext = GlobalHost.ConnectionManager.GetHubContext<GameHub>();

        /// <summary>
        /// The Update function is triggered roughly 60 times per second by default (can be configured) and should be where all the game logic runs.
        /// </summary>
        /// <param name="gameTime">Represents the overall game time and how much time has passed since the last time the game updated.</param>
        public override void Update(GameTime gameTime)
        {
            // Iterate over each user and update them (this allows all of the players to move).
            foreach (var user in UserManager.Users)
            {
                user.Update(gameTime);
            }
        }

        /// <summary>
        /// The Push function is triggered roughly 25 times per second by default (can be configured) and should be where the server pushes information down to the clients.
        /// </summary>
        public override void Push()
        {
            // Invoke the client method "serverPush" on all of the users who are connected to the GameHub Hub.
            _hubContext.Clients.All.serverPush(UserManager.Users);
        }
    }
}