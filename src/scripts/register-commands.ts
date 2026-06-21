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
    name: 'setup',
    description: 'Configure Control Center channels for the bot (Owner only).',
    options: [
      { name: 'command_channel', description: 'Channel for command responses', type: ApplicationCommandOptionType.Channel, required: false },
      { name: 'join_request_channel', description: 'Channel for clan join requests', type: ApplicationCommandOptionType.Channel, required: false },
      { name: 'clan_logs_channel', description: 'Channel for clan updates/promotions', type: ApplicationCommandOptionType.Channel, required: false },
      { name: 'event_logs_channel', description: 'Channel for event results', type: ApplicationCommandOptionType.Channel, required: false },
      { name: 'leaderboard_channel', description: 'Channel for leaderboard updates', type: ApplicationCommandOptionType.Channel, required: false },
    ],
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
  // --- New Control Center Commands ---
  {
    name: 'create-clan',
    description: 'Create a new clan. (Admin/Owner)',
    options: [
      { name: 'name', description: 'Name of the clan', type: ApplicationCommandOptionType.String, required: true },
      { name: 'description', description: 'Description', type: ApplicationCommandOptionType.String, required: true },
      { name: 'leader_role', description: 'Leader Role (Leave empty to auto-create)', type: ApplicationCommandOptionType.Role, required: false },
      { name: 'coleader_role', description: 'Co-Leader Role (Leave empty to auto-create)', type: ApplicationCommandOptionType.Role, required: false },
      { name: 'member_role', description: 'Member Role (Leave empty to auto-create)', type: ApplicationCommandOptionType.Role, required: false },
    ],
  },
  {
    name: 'delete-clan',
    description: 'Delete a clan. (Admin/Owner)',
    options: [
      { name: 'name', description: 'Name of the clan to delete', type: ApplicationCommandOptionType.String, required: true },
    ],
  },
  {
    name: 'promote-leader',
    description: 'Promote a member to Leader. (Admin/Owner)',
    options: [
      { name: 'user', description: 'User to promote', type: ApplicationCommandOptionType.User, required: true },
      { name: 'clan_name', description: 'Name of the clan', type: ApplicationCommandOptionType.String, required: true },
    ],
  },
  {
    name: 'promote-coleader',
    description: 'Promote a member to Co-Leader. (Admin/Owner)',
    options: [
      { name: 'user', description: 'User to promote', type: ApplicationCommandOptionType.User, required: true },
      { name: 'clan_name', description: 'Name of the clan', type: ApplicationCommandOptionType.String, required: true },
    ],
  },
  {
    name: 'remove-member',
    description: 'Remove a member from a clan. (Admin/Owner)',
    options: [
      { name: 'user', description: 'User to remove', type: ApplicationCommandOptionType.User, required: true },
    ],
  },
  {
    name: 'create-event',
    description: 'Create a new community event. (Staff+)',
    options: [
      { name: 'name', description: 'Event name', type: ApplicationCommandOptionType.String, required: true },
      { name: 'info', description: 'Event info/description', type: ApplicationCommandOptionType.String, required: true },
    ],
  },
  {
    name: 'publish-results',
    description: 'Publish results for an event. (Staff+)',
    options: [
      { name: 'event_id', description: 'ID of the event', type: ApplicationCommandOptionType.String, required: true },
      { name: 'winner_clan', description: 'Name of winning clan', type: ApplicationCommandOptionType.String, required: true },
    ],
  },
  {
    name: 'award-points',
    description: 'Award points to a user. (Staff+)',
    options: [
      { name: 'user', description: 'User to award points to', type: ApplicationCommandOptionType.User, required: true },
      { name: 'points', description: 'Amount of points', type: ApplicationCommandOptionType.Integer, required: true },
    ],
  },
  {
    name: 'add-admin',
    description: 'Promote a user to Admin. (Owner only)',
    options: [{ name: 'user', description: 'User to promote', type: ApplicationCommandOptionType.User, required: true }],
  },
  {
    name: 'remove-admin',
    description: 'Demote an Admin. (Owner only)',
    options: [{ name: 'user', description: 'User to demote', type: ApplicationCommandOptionType.User, required: true }],
  },
  {
    name: 'add-staff',
    description: 'Promote a user to Staff. (Admin/Owner)',
    options: [{ name: 'user', description: 'User to promote', type: ApplicationCommandOptionType.User, required: true }],
  },
  {
    name: 'remove-staff',
    description: 'Demote a Staff member. (Admin/Owner)',
    options: [{ name: 'user', description: 'User to demote', type: ApplicationCommandOptionType.User, required: true }],
  },
  {
    name: 'start-season',
    description: 'Start a new season. (Admin/Owner)',
    options: [{ name: 'name', description: 'Season name', type: ApplicationCommandOptionType.String, required: true }],
  },
  {
    name: 'end-season',
    description: 'End the current season. (Admin/Owner)',
  },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');
    
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
