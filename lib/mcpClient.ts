export interface MCPTool {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
}

export class MCPClient {
  private ws: WebSocket | null = null;
  private url: string = "";
  private messageId = 0;
  private pendingRequests = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

  async connect(url: string): Promise<void> {
    this.url = url;
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);
        const timeout = setTimeout(() => reject(new Error("MCP connection timeout")), 5000);
        this.ws.onopen = () => { clearTimeout(timeout); resolve(); };
        this.ws.onerror = () => { clearTimeout(timeout); reject(new Error(`Cannot connect to MCP server: ${url}`)); };
        this.ws.onmessage = (e) => this.handleMessage(e);
      } catch (err) {
        reject(err);
      }
    });
  }

  private handleMessage(event: MessageEvent) {
    try {
      const msg = JSON.parse(event.data as string);
      if (msg.id !== undefined && this.pendingRequests.has(msg.id)) {
        const { resolve, reject } = this.pendingRequests.get(msg.id)!;
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
        this.pendingRequests.delete(msg.id);
      }
    } catch { /* ignore parse errors */ }
  }

  private send(method: string, params?: unknown): Promise<unknown> {
    const id = ++this.messageId;
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("MCP not connected"));
        return;
      }
      this.pendingRequests.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ jsonrpc: "2.0", id, method, params }));
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error("MCP request timeout"));
        }
      }, 10000);
    });
  }

  async listTools(): Promise<MCPTool[]> {
    try {
      const result = await this.send("tools/list") as { tools?: MCPTool[] };
      return result?.tools ?? [];
    } catch {
      return [];
    }
  }

  async callTool(name: string, params: Record<string, unknown>): Promise<unknown> {
    return this.send("tools/call", { name, arguments: params });
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this.pendingRequests.clear();
  }
}
