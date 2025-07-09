require('dotenv').config();
const Discord = require('discord.js')
const token = process.env.DISCORD_TOKEN

const client = new Discord.Client({ intents: ["Guilds"]})

client.once('ready', () => {
    console.log("Alfred is ready to serve!");
})

client.on('interactionCreate', async (interaction) => {
    if(interaction.isCommand()) {
      if(interaction.commandName === 'ping') {
          interaction.reply({ content: 'Pong!'});
      }
      if(interaction.commandName === 'hello') {
          interaction.reply({ content: 'Hello, Master Bruce!'});
      }
    }
});

client.login(token);
