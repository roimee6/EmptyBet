// noinspection JSUnusedGlobalSymbols

import {CommandInteraction, EmbedBuilder, SlashCommandBuilder} from "discord.js";
import {randomColor} from "../util/functions";

export default {
    name: "pay",
    builder: new SlashCommandBuilder()
        .setName("pay")
        .setDescription("Donne sa monnaie")
        .addUserOption(option => option.setName("target").setDescription("User à qui donner").setRequired(true))
        .addIntegerOption(option => option.setName("amount").setMinValue(0).setDescription("Montant à donner").setRequired(true)),
    run: async function (interaction: CommandInteraction) {
        await interaction.deferReply();

        if (!interaction.inGuild() || !interaction.isChatInputCommand()) {
            return;
        }

        const target = interaction.options.getUser("target", true);
        const amount = interaction.options.getInteger("amount", true);

        const userBalance = db.getBalance(interaction.user.id, interaction.guildId);
        const targetBalance = db.getBalance(target.id, interaction.guildId);

        if (userBalance.money < amount) {
            return;
        }

        userBalance.money -= amount;
        targetBalance.money += amount;

        db.setBalance(userBalance);
        db.setBalance(targetBalance);

        const embed = new EmbedBuilder()
            .setColor(randomColor())
            .setDescription("Vous venez de donner **" + amount + "$** à <@" + target.id + ">")
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