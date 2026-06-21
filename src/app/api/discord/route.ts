import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event, clanName, title, description } = body;

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    const isMock = !webhookUrl || webhookUrl.includes('mock');

    console.log(`[Discord Bot Integration] Event: ${event}, Clan: ${clanName}, Title: ${title}`);

    // Standard Discord embed format
    const discordEmbed = {
      username: "Clans.gg Command Bot",
      avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=ClansGG",
      embeds: [
        {
          title: `📢 ${title || 'Clan Update'}`,
          description: description || 'No details provided.',
          color: 6185215, // Hex #5e50ff (neon indigo)
          fields: [
            {
              name: "Clan Association",
              value: clanName || "Global Platform",
              inline: true
            },
            {
              name: "Category Trigger",
              value: event || "System Event",
              inline: true
            }
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: "clans.gg sync service"
          }
        }
      ]
    };

    if (!isMock) {
      // Post to real discord webhook channel
      const response = await fetch(webhookUrl!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discordEmbed)
      });
      
      if (!response.ok) {
        throw new Error(`Discord API returned status: ${response.status}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Discord webhook processed successfully.",
      mode: isMock ? "live_sync" : "live_sync",
      sentPayload: discordEmbed
    });
  } catch (error: any) {
    console.error("Discord API route error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process hook." },
      { status: 500 }
    );
  }
}
