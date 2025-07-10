const Discord = require("discord.js");
const {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
  AttachmentBuilder,
  EmbedBuilder,
  GatewayIntentBits,
} = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const path = require("path");
require("dotenv").config();
const token = process.env.DISCORD_TOKEN;

const client = new Discord.Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // 👈 THIS IS REQUIRED
    GatewayIntentBits.GuildMessages,
  ],
});

client.once("ready", () => {
  console.log("Alfred is ready to serve!");
});

client.on("guildMemberAdd", async (member) => {
  const channelId = "1392535079083053187"; // replace with your welcome channel ID
  const channel = member.guild.channels.cache.get(channelId);
  if (!channel) return;

  const canvas = createCanvas(1024, 400);
  const ctx = canvas.getContext("2d");

  // Load background image
  const background = await loadImage(
    path.join(__dirname, "assets", "WelcomeBanner.jpg")
  );
  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  // Draw circular avatar
  const avatar = await loadImage(
    member.user.displayAvatarURL({ extension: "png", size: 256 })
  );
  ctx.save();
  ctx.beginPath();
  ctx.arc(512, 200, 100, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(avatar, 412, 100, 200, 200);
  ctx.restore();

  // Text styles
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";

  // Username
  ctx.font = "bold 40px Sans";
  ctx.fillText(member.user.username, 512, 340);

  // Random welcome message
  const messages = [
    `Welcome to the server, ${member.user.username}!`,
    `Ahoy, captain ${member.user.username}!`,
    `⚓ A new adventurer has docked.`,
    `We're thrilled to have you, ${member.user.username}!`,
    `Hail ${member.user.username}, you have entered the realm!`,
  ];
  const welcomeMessage = messages[Math.floor(Math.random() * messages.length)];

  // Send image + message
  const attachment = new AttachmentBuilder(canvas.toBuffer(), {
    name: "welcome.png",
  });

  channel.send({
    content: welcomeMessage,
    files: [attachment],
  });
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === "ping") {
    return interaction.reply({ content: "Pong!" });
  }

  if (interaction.commandName === "hello") {
    return interaction.reply({ content: "Hello, Master Bruce!" });
  }

  if (interaction.commandName === "pomodoro") {
    const title = interaction.options.getString("title") || "Pomodoro Session";
    const user = interaction.user;
    let isPaused = false;
    let timerMessage;

    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${String(mins).padStart(2, "0")}:${String(secs).padStart(
        2,
        "0"
      )}`;
    };

    const getControlRow = () =>
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("pause")
          .setLabel(isPaused ? "▶️ Resume" : "⏸️ Pause")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("cancel")
          .setLabel("❌ Cancel")
          .setStyle(ButtonStyle.Danger)
      );

    const getNextStepRow = (type) =>
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`continue_${type}`)
          .setLabel(`✅ Continue to ${type === "break" ? "Break" : "Pomodoro"}`)
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("cancel")
          .setLabel("❌ Cancel")
          .setStyle(ButtonStyle.Danger)
      );

    const runTimer = async (seconds, label, onComplete) => {
      let totalSeconds = seconds;
      isPaused = false;

      const getTimerContent = () =>
        `⏱️ **${label}**\nTime Left: **${formatTime(totalSeconds)}**\n${
          isPaused ? "⏸️ Paused" : "Running..."
        }`;

      if (!timerMessage) {
        await interaction.reply({
          content: getTimerContent(),
          components: [getControlRow()],
          ephemeral: true,
        });
        timerMessage = await interaction.fetchReply();
      } else {
        await interaction.editReply({
          content: getTimerContent(),
          components: [getControlRow()],
          ephemeral: true,
        });
      }

      const interval = setInterval(async () => {
        if (!isPaused) {
          totalSeconds--;

          if (totalSeconds <= 0) {
            clearInterval(interval);

            await interaction.editReply({
              content: `✅ **${label} is complete!**`,
              components: [],
              ephemeral: true,
            });

            await interaction.followUp({
              content: `⏰ Master <@${user.id}>, your timer is up!`,
              components: [
                getNextStepRow(
                  label === "Break Session" ? "pomodoro" : "break"
                ),
              ],
              ephemeral: true,
            });

            return onComplete();
          } else {
            try {
              await interaction.editReply({
                content: getTimerContent(),
                components: [getControlRow()],
                ephemeral: true,
              });
            } catch (err) {
              console.error("Edit failed:", err);
            }
          }
        }
      }, 1000);

      const collector = timerMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: seconds * 1000 + 60 * 1000,
      });

      collector.on("collect", async (btn) => {
        if (btn.user.id !== user.id) {
          return btn.reply({
            content: "⛔ This is not your session.",
            ephemeral: true,
          });
        }

        if (btn.customId === "pause") {
          isPaused = !isPaused;
          await btn.update({
            content: getTimerContent(),
            components: [getControlRow()],
            ephemeral: true,
          });
        }

        if (btn.customId === "cancel") {
          clearInterval(interval);
          await btn.update({
            content: `❌ **${label} canceled**`,
            components: [],
            ephemeral: true,
          });
          collector.stop();
        }
      });
    };

    const handleSession = async () => {
      await runTimer(1 * 60, title, () => waitForContinue("break"));
    };

    const waitForContinue = (type) => {
      const collector = interaction.channel.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60 * 1000,
      });

      collector.on("collect", async (btn) => {
        if (btn.user.id !== user.id) {
          return btn.reply({
            content: "⛔ You are not allowed to control this session.",
            ephemeral: true,
          });
        }

        if (btn.customId === `continue_${type}`) {
          await btn.update({
            content: `▶️ Starting **${
              type === "break" ? "Break Session" : title
            }**...`,
            components: [],
            ephemeral: true,
          });

          if (type === "break") {
            runTimer(5 * 60, `Break Session for ${title}`, () =>
              waitForContinue("pomodoro")
            );
          } else {
            runTimer(1 * 60, title, () => waitForContinue("break")); // 25 * 60 in real
          }

          collector.stop();
        }

        if (btn.customId === "cancel") {
          await btn.update({
            content: "❌ Pomodoro session ended.",
            components: [],
            ephemeral: true,
          });
          collector.stop();
        }
      });
    };

    await handleSession();
  }

  if (interaction.commandName === "timer") {
    const digits = interaction.options.getInteger("digits");
    const unit = interaction.options.getString("unit");
    const user = interaction.user;

    let totalSeconds = unit === "minute" ? digits * 60 : digits;
    let isPaused = false;
    let interval;
    let timerMessage;

    const formatTime = (s) => {
      const mins = Math.floor(s / 60);
      const secs = s % 60;
      return `${String(mins).padStart(2, "0")}:${String(secs).padStart(
        2,
        "0"
      )}`;
    };

    const getButtonRow = () =>
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("pause_timer")
          .setLabel(isPaused ? "▶️ Resume" : "⏸️ Pause")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("cancel_timer")
          .setLabel("❌ Cancel")
          .setStyle(ButtonStyle.Danger)
      );

    const getTimerContent = () =>
      `⏱️ Countdown Timer\nTime Left: **${formatTime(totalSeconds)}**\n${
        isPaused ? "⏸️ Paused" : "Running..."
      }`;

    // Send ephemeral message
    await interaction.reply({
      content: getTimerContent(),
      components: [getButtonRow()],
      ephemeral: true,
    });

    timerMessage = await interaction.fetchReply();

    // Timer interval every second
    const startTimer = () => {
      interval = setInterval(async () => {
        if (!isPaused) {
          totalSeconds--;

          if (totalSeconds <= 0) {
            clearInterval(interval);
            try {
              await interaction.editReply({
                content: `✅ Timer is complete.`,
                components: [],
                ephemeral: true,
              });

              await interaction.followUp({
                content: `⏰ Master <@${user.id}>, your timer is up.`,
                ephemeral: false,
              });
            } catch (err) {
              console.error("Timer error:", err);
            }
          } else {
            try {
              await interaction.editReply({
                content: getTimerContent(),
                components: [getButtonRow()],
                ephemeral: true,
              });
            } catch (err) {
              console.error("Edit failed:", err);
            }
          }
        }
      }, 1000);
    };

    startTimer();

    const collector = timerMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: (totalSeconds + 60) * 1000,
    });

    collector.on("collect", async (btn) => {
      if (btn.user.id !== user.id) {
        return btn.reply({
          content: "⛔ You are not allowed to control this timer.",
          ephemeral: true,
        });
      }

      if (btn.customId === "pause_timer") {
        isPaused = !isPaused;
        await btn.update({
          content: getTimerContent(),
          components: [getButtonRow()],
          ephemeral: true,
        });
      }

      if (btn.customId === "cancel_timer") {
        clearInterval(interval);
        await btn.update({
          content: `❌ Timer canceled.`,
          components: [],
          ephemeral: true,
        });
        collector.stop();
      }
    });
  }
});

client.login(token);
