// noinspection JSUnusedGlobalSymbols

import {CommandInteraction, EmbedBuilder, SlashCommandBuilder} from "discord.js";
import {randomColor} from "../util/functions";

export default {
    name: "money",
    builder: new SlashCommandBuilder()
        .setName("money")
        .setDescription("Regarde sa monnaie ou celle d'un autre utilisateur")
        .addUserOption(option => option.setName("user").setDescription("User to see balance").setRequired(false)),
    run: async function (interaction: CommandInteraction) {
        await interaction.deferReply();

        if (!interaction.inGuild()) {
            return;
        }

        const user = interaction.options.getUser("user") || interaction.user;
        const start = user === interaction.user ? "Vous possedez" : "<@" + user.id + "> possède";

        const embed = new EmbedBuilder()
            .setColor(randomColor())
            .setDescription(start + " **" + db.getBalance(user.id, interaction.guildId).money + "**$")
            .setAuthor({
                iconURL: interaction.user.avatarURL() || "",
                name: interaction.user.tag
            })
            .setFooter({
                iconURL: client.user?.avatarURL() || "",
                text: "Empty Bet"
            })
            .setTimestamp();

        await interaction.editReply({
            embeds: [embed]
        });
    }
}