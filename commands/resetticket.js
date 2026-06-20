const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("resetticket")
    .setDescription("Force reset a user's ticket lock")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("The user to reset")
        .setRequired(true)
    ),

  async execute(interaction) {

    // Only YOU can use this command
    if (interaction.user.id !== "1236699374625620002") {
      return interaction.reply({
        content: "❌ Only the bot owner can use this command.",
        ephemeral: true
      });
    }

    const user = interaction.options.getUser("user");

    // Remove their ticket lock
    interaction.client.activeTickets.delete(user.id);

    return interaction.reply({
      content: `✅ Ticket lock reset for **${user.username}**.`,
      ephemeral: true
    });
  }
};
