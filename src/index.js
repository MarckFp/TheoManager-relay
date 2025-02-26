export default {
    async fetch(request, env) {
      // Get a Durable Object stub. In this case, we always use the same DO instance.
      const id = env.SIGNALING_DO.idFromName("default");
      const signalingObject = env.SIGNALING_DO.get(id);
      // Forward the request to the Durable Object.
      return signalingObject.fetch(request);
    }
};
