import CommandInt from "@Interfaces/CommandInt";
import PokemonInt from "@Interfaces/commands/PokemonInt";
import axios from "axios";
import { MessageEmbed } from "discord.js";

const pokename: CommandInt = {
  names: ["pokename", "pokemonname"],
  description: "Provides information on the Pokemon named **name**.",
  parameters: ["`<name>`: name of the Pokemon to search for"],
  run: async (message) => {
    try {
      const { bot, channel, commandArguments } = message;

      // Get the next parameter as the pokemon name.
      const name = commandArguments.shift();

      // Check if the pokemon name is empty.
      if (!name) {
        await message.reply(
          "Would you please try the command again, and provide the Pokemon name you want me to search for?"
        );
        return;
      }

      try {
        // Get the pokemon information from the poke API.
        const data = await axios.get<PokemonInt>(
          `https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`
        );

        // Get the pokemon data.
        const pokemon = data.data;

        // Send an embed message to the current channel.
        await channel.send(
          new MessageEmbed()
            .setColor(bot.color)
            .setTitle(pokemon.name)
            .setDescription(`#${pokemon.id}`)
            .setThumbnail(pokemon.sprites.front_default)
            .setFooter(`Weight: ${pokemon.weight}, Height: ${pokemon.height}`)
        );
      } catch (error) {
        console.log(
          "Pokemon Name Command:",
          error?.response?.data?.message ?? "Unknown error."
        );

        await message.reply("I am so sorry, but I could not find anything...");
      }
    } catch (error) {
      console.log(
        `${message.guild?.name} had the following error with the pokename command:`
      );
      console.log(error);
      message.reply("I am so sorry, but I cannot do that at the moment.");
    }
  },
};

export default pokename;
