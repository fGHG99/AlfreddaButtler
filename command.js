require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const botId = process.env.BOTID;
const serverId = process.env.SERVERID;
const botToken = process.env.DISCORD_TOKEN;

const rest = new REST().setToken(botToken);
const slashRegister = async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(botId, serverId),
            {
                body: [
                    new SlashCommandBuilder()
                        .setName('ping')
                        .setDescription('Replies with Pong!'),
                    new SlashCommandBuilder()
                        .setName('hello')
                        .setDescription('Replies with a nice warm hello.')
                ]
            }
        );
    } catch (error) {
        console.error(error);
    }
}
slashRegister()
