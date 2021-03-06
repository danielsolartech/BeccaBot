import CommandInt from "@Interfaces/CommandInt";
import { MessageEmbed } from "discord.js";

const LISTENERS_CONSTANT = {
  title: "I am always listening...",
  description:
    "For my commands to work, I have to listen to every message in the server. I check each message to see if you have called for my assistance. But did you know I also listen for other events? Here's what they are!",
};

const listeners: CommandInt = {
  names: ["listen", "listeners"],
  description:
    "Provides information on the active listener features for the bot.",
  run: async (message) => {
    try {
      const { bot, channel } = message;

      // Create a new empty embed.
      const listeners = new MessageEmbed();

      // Add the light purple color.
      listeners.setColor(bot.color);

      // Add the title.
      listeners.setTitle(LISTENERS_CONSTANT.title);

      // Add the description.
      listeners.setDescription(LISTENERS_CONSTANT.description);

      // Add the listeners to fields.
      for (const listener of Object.values(bot.customListeners)) {
        listeners.addField(listener.name, listener.description);
      }

      // Send the embed to the current channel.
      await channel.send(listeners);
    } catch (error) {
      console.log(
        `${message.guild?.name} had the following error with the listeners command:`
      );
      console.log(error);
      message.reply("I am so sorry, but I cannot do that at the moment.");
    }
  },
};

export default listeners;
