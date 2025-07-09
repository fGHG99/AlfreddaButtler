import dotenv from 'dotenv'
dotenv.config()

import Discord from 'discord.js'
const token = process.env.DISCORD_TOKEN

const client = new Discord.Client({ intents: [
  Discord.GatewayIntentBits.Guilds,
  Discord.GatewayIntentBits.GuildMessages
]})

client.once('ready', () => {
    console.log("Alfred is ready to serve!");
})

client.login(token);
