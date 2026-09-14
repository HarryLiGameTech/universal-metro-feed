interface ModelContextTool {
  name: string;
  title?: string;
  description: string;
  inputSchema: object;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute(input: unknown): unknown | Promise<unknown>;
}

interface ModelContext {
  registerTool(tool: ModelContextTool, options?: { signal?: AbortSignal }): void | Promise<void>;
}

interface Document {
  readonly modelContext?: ModelContext;
}
