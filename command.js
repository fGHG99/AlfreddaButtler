const { REST, Routes, SlashCommandBuilder } = require("discord.js");
require("dotenv").config();
const botId = process.env.BOTID;
const serverId = process.env.SERVERID;
const botToken = process.env.DISCORD_TOKEN;

const rest = new REST().setToken(botToken);
const slashRegister = async () => {
  try {
    await rest.put(Routes.applicationGuildCommands(botId, serverId), {
      body: [
        new SlashCommandBuilder()
          .setName("ping")
          .setDescription("Replies with Pong!"),
        new SlashCommandBuilder()
          .setName("hello")
          .setDescription("Replies with a nice warm hello."),
        new SlashCommandBuilder()
          .setName("pomodoro")
          .setDescription("Starts a Pomodoro timer.")
          .addStringOption((option) =>
            option
              .setName("title")
              .setDescription("Title of your Pomodoro session")
              .setRequired(false)
          ),
        new SlashCommandBuilder()
          .setName("timer")
          .setDescription("Starts a countdown timer.")
          .addIntegerOption((option) =>
            option
              .setName("digits")
              .setDescription("How many minutes or seconds?")
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName("unit")
              .setDescription("Unit of time")
              .setRequired(true)
              .addChoices(
                { name: "minute", value: "minute" },
                { name: "second", value: "second" }
              )
          ),
      ],
    });
  } catch (error) {
    console.error(error);
  }
};
slashRegister();
