const fs = require("fs");
const path = require("path");
const { 
  Client, 
  Collection, 
  GatewayIntentBits, 
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.commands = new Collection();
client.activeTickets = new Map(); // Track open tickets

// Load slash commands
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Interaction handler
client.on("interactionCreate", async (interaction) => {

  // Slash commands
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (command) await command.execute(interaction);
  }

  // Start ticket
  if (interaction.isButton() && interaction.customId === "start_study_ticket") {

    // Prevent duplicate tickets
    if (client.activeTickets.has(interaction.user.id)) {
      return interaction.reply({
        content: "❌ You already have an open ticket.",
        ephemeral: true
      });
    }

    const subjects = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("sub_math").setLabel("Math").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("sub_english").setLabel("English").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("sub_science").setLabel("Science").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("sub_history").setLabel("History").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("sub_geo").setLabel("Geography").setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      content: "📘 **Choose your subject:**",
      components: [subjects],
      ephemeral: true
    });
  }

  // Subject selected
  if (interaction.isButton() && interaction.customId.startsWith("sub_")) {

    const subject = interaction.customId.replace("sub_", "");

    const types = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`type_${subject}_homework`).setLabel("Homework").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`type_${subject}_project`).setLabel("Project").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`type_${subject}_quiz`).setLabel("Quiz").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`type_${subject}_review`).setLabel("Reviewing").setStyle(ButtonStyle.Success)
    );

    await interaction.reply({
      content: `📚 **What type of work for ${subject}?**`,
      components: [types],
      ephemeral: true
    });
  }

  // Type selected → create ticket
  if (interaction.isButton() && interaction.customId.startsWith("type_")) {

    const parts = interaction.customId.split("_");
    const subject = parts[1];
    const workType = parts[2];

    const guild = interaction.guild;

    // Prevent duplicate tickets
    if (client.activeTickets.has(interaction.user.id)) {
      return interaction.reply({
        content: "❌ You already have an open ticket.",
        ephemeral: true
      });
    }

    // Find or create tickets category
    let category = guild.channels.cache.find(
      c => c.name.toLowerCase() === "tickets" && c.type === 4
    );

    if (!category) {
      category = await guild.channels.create({
        name: "tickets",
        type: 4
      });
    }

    // Create ticket channel
    const ticketChannel = await guild.channels.create({
      name: `study-${interaction.user.username}`,
      type: 0,
      parent: category.id,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        { id: "1517486464441516134", allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        { id: "1517699485701242940", allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
      ]
    });

    // Mark ticket as active AFTER creation
    client.activeTickets.set(interaction.user.id, ticketChannel.id);

    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("confirm_close")
        .setLabel("Close Ticket")
        .setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({
      content: `🎓 **New Study Ticket**  
👤 User: <@${interaction.user.id}>  
📘 Subject: **${subject}**  
📚 Type: **${workType}**  

<@&1517486464441516134> <@&1517699485701242940>`,
      components: [closeRow]
    });

    await interaction.reply({
      content: `✅ Your study ticket has been created: ${ticketChannel}`,
      ephemeral: true
    });
  }

  // Close ticket confirmation
  if (interaction.isButton() && interaction.customId === "confirm_close") {

    const allowedRoles = [
      "1517486464441516134",
      "1517699485701242940"
    ];

    const user = interaction.user;
    const member = interaction.guild.members.cache.get(user.id);

    const isYou = user.id === "1236699374625620002";
    const isOwner = user.id === interaction.guild.ownerId;
    const hasRole = member.roles.cache.some(r => allowedRoles.includes(r.id));

    if (!isYou && !isOwner && !hasRole) {
      return interaction.reply({
        content: "❌ You are not allowed to close this ticket.",
        ephemeral: true
      });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("close_yes").setLabel("Yes, close it").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("close_no").setLabel("No, cancel").setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({
      content: "⚠️ **Are you sure you want to close this ticket?**",
      components: [row],
      ephemeral: true
    });
  }

  // YES closes ticket
  if (interaction.isButton() && interaction.customId === "close_yes") {

    // Remove active ticket lock
    client.activeTickets.delete(interaction.user.id);

    await interaction.channel.delete();
  }

  // NO cancels
  if (interaction.isButton() && interaction.customId === "close_no") {
    return interaction.reply({
      content: "❌ Ticket close cancelled.",
      ephemeral: true
    });
  }
});

client.login(process.env.TOKEN);
