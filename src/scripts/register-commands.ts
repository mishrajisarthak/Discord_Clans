const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');
require('dotenv').config({ path: '.env.local' });

const commands = [
  {
    name: 'setup-community',
    description: 'Initial setup: Assigns the Platform Owner role.',
    options: [
      {
        name: 'user',
        description: 'The user who will be the Platform Owner',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
    ],
    default_member_permissions: '8', // ADMINISTRATOR
  },
  {
    name: 'owner',
    description: 'Manage Platform Owners',
    options: [
      {
        name: 'add',
        description: 'Add a Platform Owner',
        type: ApplicationCommandOptionType.Subcommand,
        options: [{ name: 'user', description: 'The user to add', type: ApplicationCommandOptionType.User, required: true }],
      },
      {
        name: 'remove',
        description: 'Remove a Platform Owner',
        type: ApplicationCommandOptionType.Subcommand,
        options: [{ name: 'user', description: 'The user to remove', type: ApplicationCommandOptionType.User, required: true }],
      },
    ],
  },
  {
    name: 'admin',
    description: 'Manage Platform Admins',
    options: [
      {
        name: 'add',
        description: 'Add a Platform Admin',
        type: ApplicationCommandOptionType.Subcommand,
        options: [{ name: 'user', description: 'The user to add', type: ApplicationCommandOptionType.User, required: true }],
      },
      {
        name: 'remove',
        description: 'Remove a Platform Admin',
        type: ApplicationCommandOptionType.Subcommand,
        options: [{ name: 'user', description: 'The user to remove', type: ApplicationCommandOptionType.User, required: true }],
      },
    ],
  },
  {
    name: 'staff',
    description: 'Manage Platform Staff',
    options: [
      {
        name: 'add',
        description: 'Add Platform Staff',
        type: ApplicationCommandOptionType.Subcommand,
        options: [{ name: 'user', description: 'The user to add', type: ApplicationCommandOptionType.User, required: true }],
      },
      {
        name: 'remove',
        description: 'Remove Platform Staff',
        type: ApplicationCommandOptionType.Subcommand,
        options: [{ name: 'user', description: 'The user to remove', type: ApplicationCommandOptionType.User, required: true }],
      },
    ],
  },
  {
    name: 'clan',
    description: 'Manage Clan Roles',
    options: [
      {
        name: 'leader',
        description: 'Manage Clan Leaders',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'set',
            description: 'Set a clan leader',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              { name: 'user', description: 'The user to assign', type: ApplicationCommandOptionType.User, required: true },
              { name: 'clan_name', description: 'The exact name of the clan', type: ApplicationCommandOptionType.String, required: true },
            ],
          },
        ],
      },
      {
        name: 'coleader',
        description: 'Manage Clan Co-Leaders',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'set',
            description: 'Set a clan co-leader',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              { name: 'user', description: 'The user to assign', type: ApplicationCommandOptionType.User, required: true },
              { name: 'clan_name', description: 'The exact name of the clan', type: ApplicationCommandOptionType.String, required: true },
            ],
          },
        ],
      },
    ],
  },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    
    // Make sure DISCORD_CLIENT_ID is in your .env.local
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId) {
      throw new Error('DISCORD_CLIENT_ID is missing from .env.local');
    }

    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
