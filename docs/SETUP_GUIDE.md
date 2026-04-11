# Sisense + AI App: Complete Setup Guide
## From zero to AI-powered analytics in your app

This guide walks you through connecting Sisense analytics to any app using the Sisense MCP Server and Claude Desktop. It's based on a real project — English Buddy, an AI English tutor for kids — but the steps apply to any product with a PostgreSQL database.

---

## What You'll End Up With

- Your app's data queryable through natural language in Claude Desktop
- Visual charts built by asking questions like "Show me user retention by cohort"
- AI-generated insights about your data
- No dashboard building, no SQL, no manual chart configuration

---

## Prerequisites

| Tool | How to install |
|------|---------------|
| **Node.js** (18+) | https://nodejs.org |
| **bun** | `npm install -g bun` |
| **Claude Desktop** | https://claude.ai/download |
| **A Sisense account** | Free trial at https://sisense.com or request an environment |
| **A PostgreSQL database** | We used [Neon](https://neon.tech) (free tier) |

---

## Step 1: Clone the Sisense MCP Server

The MCP (Model Context Protocol) Server is an open-source bridge between Sisense and AI tools like Claude.

```bash
git clone https://github.com/sisense/sisense-mcp-server.git
cd sisense-mcp-server
npm install
npm run build
```

The `npm run build` step is important — it compiles the chart renderer (`view.html`) that Claude Desktop uses to display visual charts inline.

---

## Step 2: Get Your Sisense API Token

1. Open your Sisense instance in a browser (e.g., `https://your-instance.sisense.com`)
2. On the left sidebar, scroll to the bottom and click **REST API**
3. Expand the **authentication** section
4. Click **GET /authentication/tokens/api**
5. Click **Try it out** → **Execute**
6. Copy the `token` value from the response — it's a long string starting with `eyJ...`

**Keep the token in your clipboard — you'll paste it in Step 3.**

> Tokens expire after 7 days. When yours expires, repeat this step to get a new one.

---

## Step 3: Configure Claude Desktop

1. Open **Claude Desktop**
2. Go to **Settings** → **Developer** → **Edit Config**
3. Add the Sisense MCP server to the `mcpServers` section:

```json
{
  "mcpServers": {
    "sisense": {
      "command": "bun",
      "args": ["run", "src/sse-server.ts"],
      "cwd": "YOUR_PATH_TO/sisense-mcp-server",
      "env": {
        "SISENSE_URL": "https://your-instance.sisense.com",
        "SISENSE_TOKEN": "eyJ...your-token-here..."
      }
    }
  }
}
```

Replace:
- `YOUR_PATH_TO/sisense-mcp-server` — the full path where you cloned the repo (e.g., `C:\\Projects\\sisense-mcp-server`)
- `SISENSE_URL` — your Sisense instance URL
- `SISENSE_TOKEN` — the token from Step 2

**Important:** The token must be on ONE line — no line breaks.

4. Save the file
5. **Fully quit Claude Desktop** (system tray → Quit, not just close window)
6. Reopen Claude Desktop
7. Check **Settings → Developer** — "sisense" should show as connected

---

## Step 4: Connect Your Database to Sisense

This gives Sisense access to your app's actual data.

1. In your Sisense dashboard, go to **Data**
2. Click **+ Live** (top right) to create a new Live Model
3. Name it (e.g., "MyAppData")
4. Click **+ Add Data** → **Create New Connection** → **PostgreSQL**
5. Fill in your database connection details:

| Field | Value |
|-------|-------|
| Location | `your-db-host:port` |
| User Name | your database username |
| Password | your database password |
| Default Database | your database name |
| Use SSL | ✅ checked |
| SSL Mode | require |

6. Select the tables you want to analyze
7. Click **Done** → **Publish**

> We used [Neon](https://neon.tech) for our PostgreSQL — it's free, takes 2 minutes to set up, and works seamlessly with Sisense's Live Connect.

---

## Step 5: Talk to Your Data

1. Open Claude Desktop
2. Start a new chat
3. Tell Claude about your data model:

> "You have access to the Sisense MCP. I have a data source called [YourModelName] with tables: [list your tables]. Help me explore my data."

4. Then ask questions:

- "List my Sisense data sources"
- "What fields are in the [table name]?"
- "Show me [metric] by [dimension] as a [chart type]"
- "Compare [A] vs [B]"
- "What trends do you see in my data?"

Claude will build visual charts directly in the chat with AI-generated insights.

---

## How It Works — Architecture

```
Your App → writes data to → PostgreSQL (Neon/Railway/Supabase)
                                  ↓
Sisense Live Connect → reads from PostgreSQL in real-time
                                  ↓
Sisense MCP Server → exposes data to Claude via 3 tools:
  • getDataSources — list available datasets
  • getDataSourceFields — explore table columns
  • buildChart — create visual charts from natural language
                                  ↓
Claude Desktop → user asks questions → gets charts + AI insights
```

No ETL pipelines. No data warehouses. No dashboard builders. Just your database → Sisense → Claude → answers.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "sisense: FAILED" in Claude Desktop settings | Make sure `bun` is installed (`bun --version`). Make sure the `cwd` path is correct. |
| "Module not found" error | Run `npm run build` in the MCP server directory |
| "view.html not found" when building charts | Run `npm run build` — this compiles the chart renderer |
| "Connection failed: Authentication" in Sisense | Check SSL mode is set to "require". Verify username/password. Try a different database host. |
| Token expired | Get a new token from Sisense REST API (Step 2) |
| Charts don't render visually | Only works in Claude Desktop app, not in claude.ai web or Claude Code CLI |
| Port conflict | If you see "port 3001 in use", kill the process using that port before restarting |

---

## Tech Stack Used in This Demo

| Component | Technology | Purpose |
|-----------|-----------|---------|
| App | Next.js + Tailwind CSS | English tutor UI |
| AI Chat | Claude API (Anthropic) | Conversation engine |
| Voice | OpenAI TTS + Web Speech API | Text-to-speech + speech-to-text |
| Database | PostgreSQL on Neon | User data, sessions, conversations |
| Analytics | Sisense (Live Connect + MCP Server) | Charts, insights, natural language queries |
| AI Analytics | Claude Desktop + Sisense MCP | Ask questions about data in natural language |
| Hosting | Vercel | App deployment |

---

## Links

- [Sisense MCP Server (GitHub)](https://github.com/sisense/sisense-mcp-server)
- [Sisense Developer Portal](https://developer.sisense.com)
- [Neon PostgreSQL (free)](https://neon.tech)
- [Claude Desktop](https://claude.ai/download)
- [English Buddy (this project)](https://github.com/eladayzen/EnglishBuddy)
