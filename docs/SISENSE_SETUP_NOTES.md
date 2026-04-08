# Sisense MCP Setup Notes — What We Learned

## What Works
- Sisense MCP Server cloned at C:\Tests\sisense-mcp-server
- Server runs with `bun run dev` (needs SISENSE_URL + SISENSE_TOKEN env vars)
- Server exposes 3 tools: getDataSources, getDataSourceFields, buildChart
- Calling via curl works perfectly — listed data sources, explored fields, built charts, got AI insights
- Token obtained via REST API swagger: /api/v1/authentication/tokens/api (click Try it out → Execute)

## What Doesn't Work (Yet)
- Claude Desktop can't connect to the MCP server
- Tried: direct bun command in config, npx mcp-remote, full path mcp-remote.cmd
- All fail with "Could not attach to MCP server sisense"
- Root cause likely: Streamable HTTP transport not fully supported by Claude Desktop's MCP client

## Connection Details (Trial Account - elad@supersky.games)
- URL: https://signup-5j5t91f3.sisense.com
- Token: [stored in env, expires Tue Apr 14 2026]
- Data sources available: Sample ECommerce, Sample Healthcare, Sample Lead Generation, Sample Retail, TryingCSV

## For New Account
- Need: Sisense URL + API token
- Get token: Profile → REST API swagger → /authentication/tokens/api → Try it out → Execute
- Update env vars and Claude Desktop config with new values
- The MCP server code at C:\Tests\sisense-mcp-server works — just needs correct credentials

## Claude Desktop Config Location
- C:\Users\USER\AppData\Local\Packages\Claude_pzs8sxrjxfjjc\LocalCache\Roaming\Claude\claude_desktop_config.json
