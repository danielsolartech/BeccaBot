import { Client, Guild, WebhookClient } from "discord.js";

/**
 * Send a debug message when a guild has been created.
 *
 * @async
 * @function
 * @param { Guild } guild
 * @param { WebhookClient | null } debugChannelHook
 * @param { Client } client
 * @returns { Promise<void> }
 */
async function onGuildCreate(
  guild: Guild,
  debugChannelHook: WebhookClient | null,
  client: Client
): Promise<void> {
  if (debugChannelHook) {
    // Get the user from the bot client.
    const { user } = client;

    if (user) {
      // Get the server name from the current guild.
      const { name } = guild;

      // Send a message to the debug channel.
      await debugChannelHook.send(
        `${user.username} has joined the ${name} server!`
      );
    }
  }
}

export default onGuildCreate;
