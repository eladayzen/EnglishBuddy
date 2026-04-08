# How to Connect Sisense MCP to Claude Desktop App
## 4 steps — takes about 10 minutes

---

## What You Need

- A Sisense account (trial or invited environment)
- bun installed on your computer (if not: open a terminal, run `npm install -g bun`)
- Claude Desktop app installed

---

## STEP 1: Get the Sisense MCP Server Code

Open any terminal and run:

```
cd C:\Tests
git clone https://github.com/sisense/sisense-mcp-server.git
cd sisense-mcp-server
npm install
```

Wait for `npm install` to finish. That's it — you won't need this terminal anymore.

**If you already did this before, skip this step.** The folder is already at `C:\Tests\sisense-mcp-server`.

---

## STEP 2: Get Your Sisense API Token

1. Open your Sisense instance in a browser (e.g., `https://signup-xxxxx.sisense.com`)
2. On the left sidebar, scroll down and click **REST API**
3. You'll see a big list of API categories. Find **authentication** and click it to expand
4. Find the green row that says **GET /authentication/tokens/api** — click it
5. Click the **Try it out** button (top right of that section)
6. Click the **Execute** button
7. In the response below, you'll see something like:
   ```
   {
     "token": "eyJhbG...(very long string)...",
     "notification": "Your token expires on ..."
   }
   ```
8. Copy the entire token value (everything between the quotes after `"token":`). **Keep it in your clipboard — you're about to paste it in the next step.**

**The token is one long line — don't let it wrap or break across lines.**

---

## STEP 3: Tell Claude Desktop About Sisense

This is the key step. You're editing a config file that tells Claude Desktop how to connect to Sisense. You'll paste the token you just copied.

1. Open the **Claude Desktop app**
2. Go to **Settings** (gear icon)
3. Click **Developer**
4. Click **Edit Config** — this opens a JSON file in your text editor

The file looks something like this:

```json
{
  "mcpServers": {},
  "preferences": {
    ...some settings...
  }
}
```

Replace the empty `"mcpServers": {}` with the sisense config below. Your final file should look like this:

```json
{
  "mcpServers": {
    "sisense": {
      "command": "bun",
      "args": ["run", "src/sse-server.ts"],
      "cwd": "C:\\Tests\\sisense-mcp-server",
      "env": {
        "SISENSE_URL": "PASTE_YOUR_SISENSE_URL_HERE",
        "SISENSE_TOKEN": "PASTE_YOUR_TOKEN_HERE"
      }
    }
  },
  "preferences": {
    ...keep whatever was already here...
  }
}
```

**What to replace:**
- `PASTE_YOUR_SISENSE_URL_HERE` → your Sisense URL from your browser address bar (e.g., `https://signup-x9gpyj2i.sisense.com`)
- `PASTE_YOUR_TOKEN_HERE` → the token you just copied in Step 2

**CRITICAL: The token must be on ONE line. No line breaks inside the token string.**

Save the file and close the editor.

---

## STEP 4: Restart Claude Desktop and Talk to Your Data

1. **Fully quit Claude Desktop** — don't just close the window. Right-click the Claude icon in the system tray (bottom right of your screen) and click **Quit**. Or use Task Manager to end it.
2. **Reopen Claude Desktop**
3. Go to **Settings → Developer** — you should see **sisense** listed. It should say connected (or show a green indicator).
4. Start a **new chat**
5. Type:

> List my Sisense data sources

Claude will call the Sisense MCP server, connect to your Sisense instance, and return a list of your available datasets.

6. Then try:

> Show me total revenue by category from the Sample ECommerce dataset as a bar chart

**You should see a visual chart appear right in the chat.** Claude builds it using Sisense's AI and renders it inline.

---

## How It Works (Behind the Scenes)

When you restart Claude Desktop, it reads the config file and sees the `sisense` MCP server. It automatically:
1. Launches `bun run src/sse-server.ts` in the background
2. Passes your Sisense URL and token as environment variables
3. The MCP server connects to your Sisense instance
4. Claude Desktop now has 3 new tools: `getDataSources`, `getDataSourceFields`, `buildChart`

You don't need to keep any terminal open. Claude Desktop manages everything.

---

## Troubleshooting

**Settings shows "sisense: FAILED"**
- Make sure bun is installed. Open a terminal, type `bun --version`. If it says "not found", run `npm install -g bun` first.
- Make sure `C:\Tests\sisense-mcp-server` exists and has a `node_modules` folder inside it.
- Make sure your token is on ONE line in the config — no line breaks.
- Make sure you fully quit Claude Desktop (tray → Quit) before reopening.

**"Could not attach to MCP server"**
- Same as above. Most common cause: bun not installed or path wrong.

**Token expired**
- Tokens expire after 7 days. Go back to Step 2, get a new token, paste it in the config, restart Claude Desktop.

**Charts don't render visually**
- Make sure you're in the Claude Desktop app (not web browser claude.ai or Claude Code CLI)
- The buildChart tool renders interactive charts ONLY inside Claude Desktop's chat window

---

## What You Can Ask Once Connected

**Explore your data:**
- "What data sources do I have?"
- "What fields are in the Sample ECommerce dataset?"

**Build charts:**
- "Show me revenue by category as a bar chart"
- "Monthly revenue trend as a line chart"
- "Compare revenue by gender across age ranges"
- "Top 5 brands by total sales"

**Get AI insights:**
- Every chart comes with AI-generated insights explaining what the data shows
- "What's interesting about my revenue data?"

---

## Quick Reference

| What | Where |
|------|-------|
| Config file | Claude Desktop → Settings → Developer → Edit Config |
| MCP server code | `C:\Tests\sisense-mcp-server` |
| Get new token | Sisense → REST API → authentication → /tokens/api → Try it out → Execute |
| Token expires | 7 days from creation |

Claude API key
OpenAI API key
Deploy to vercel

 cd C:\Tests\sisense-mcp-server                                                              $env:SISENSE_URL="https://signup-x9gpyj2i.sisense.com"
  $env:SISENSE_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjlkM2Q1ZWE3NGI4YzVjM  WE5M2QzMDBhIiwiYXBpU2VjcmV0IjoiZDMzZWNiZTctYzQ5OS03MWU0LWU3OTUtOTczOTIwZWM1ZmE0IiwiYWxsb3d
  lZFRlbmFudHMiOlsiNjlkM2M0YTJkYjZkMmJkMDAzMTFhMTMzIl0sInRlbmFudElkIjoiNjlkM2M0YTJkYjZkMmJkM
  DAzMTFhMTMzIiwiZXhwIjoxNzc2MjI1MTUzfQ.KK5s9N1AfIpoGRGj-6AC7nWuscVFWAU7bwgtpKSgY6w"
  bun run dev

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjlkM2Q1ZWE3NGI4YzVjMWE5M2QzMDBhIiwiYXBpU2VjcmV0IjoiZDMzZWNiZTctYzQ5OS03MWU0LWU3OTUtOTczOTIwZWM1ZmE0IiwiYWxsb3dlZFRlbmFudHMiOlsiNjlkM2M0YTJkYjZkMmJkMDAzMTFhMTMzIl0sInRlbmFudElkIjoiNjlkM2M0YTJkYjZkMmJkMDAzMTFhMTMzIiwiZXhwIjoxNzc2MjI1MTUzfQ.KK5s9N1AfIpoGRGj-6AC7nWuscVFWAU7bwgtpKSgY6w

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjlkM2Q1ZWE3NGI4YzVjMWE5M2QzMDBhIiwiYXBpU2VjcmV0IjoiZDMzZWNiZTctYzQ5OS03MWU0LWU3OTUtOTczOTIwZWM1ZmE0IiwiYWxsb3dlZFRlbmFudHMiOlsiNjlkM2M0YTJkYjZkMmJkMDAzMTFhMTMzIl0sInRlbmFudElkIjoiNjlkM2M0YTJkYjZkMmJkMDAzMTFhMTMzIiwiZXhwIjoxNzc2MjIzNzkyfQ.mCgPU3BxXFHrIT55dPGMwiSsy3B9QUK-TySvGIJdih8