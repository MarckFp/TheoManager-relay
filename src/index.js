export default {
    async fetch(request, env) {
      // Get a Durable Object stub. In this case, we always use the same DO instance.
      const id = env.SIGNALING_DO.idFromName("default");
      const signalingObject = env.SIGNALING_DO.get(id);
      // Forward the request to the Durable Object.
      return signalingObject.fetch(request);
    }
};

export class SignalingDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    // Store active WebSocket connections
    this.clients = new Set();
  }

  async fetch(request) {
    // Ensure the request is trying to upgrade to a WebSocket
    const upgradeHeader = request.headers.get("Upgrade");
    if (upgradeHeader !== "websocket") {
      return new Response("Expected websocket", { status: 400 });
    }

    // Create a WebSocket pair – one for the client, one for the Durable Object
    const [clientSocket, serverSocket] = Object.values(new WebSocketPair());
    // Start handling the connection in the Durable Object
    this.handleSession(serverSocket);

    // Return the client socket to upgrade the connection
    return new Response(null, {
      status: 101,
      webSocket: clientSocket,
    });
  }

  handleSession(socket) {
    socket.accept();
    this.clients.add(socket);

    socket.addEventListener("message", event => {
      // Relay the message to every other connected client
      for (const client of this.clients) {
        if (client !== socket) {
          client.send(event.data);
        }
      }
    });

    socket.addEventListener("close", () => {
      this.clients.delete(socket);
    });
  }
};