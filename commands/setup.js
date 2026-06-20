const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Setup the study ticket system"),

  async execute(interaction) {

    // Only YOU can use /setup
    if (interaction.user.id !== "1236699374625620002") {
      return interaction.reply({
        content: "❌ You are not allowed to use this command.",
        ephemeral: true
      });
    }

    const guild = interaction.guild;

    // Create tickets category if missing
    let category = guild.channels.cache.find(
      c => c.name.toLowerCase() === "tickets" && c.type === 4
    );

    if (!category) {
      category = await guild.channels.create({
        name: "tickets",
        type: 4
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("🎓 Study Support")
      .setDescription("Click the button below to start a study ticket.")
      .setColor("Blue");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("start_study_ticket")
        .setLabel("Open Study Ticket")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({
      content: "✅ Setup complete! Ticket panel created.",
      ephemeral: true
    });

    await interaction.channel.send({ embeds: [embed], components: [row] });
  }
};
