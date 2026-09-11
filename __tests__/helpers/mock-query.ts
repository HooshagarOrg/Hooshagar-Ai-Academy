type QueryResult = { data: unknown; error: unknown; count?: number | null }

export function mockQuery(result: QueryResult) {
  const builder: Record<string, unknown> = {}
  const passthrough = () => builder
  const terminal = async () => result

  builder.select = passthrough
  builder.insert = passthrough
  builder.update = passthrough
  builder.upsert = terminal
  builder.delete = passthrough
  builder.eq = passthrough
  builder.neq = passthrough
  builder.in = passthrough
  builder.gte = passthrough
  builder.lte = passthrough
  builder.order = passthrough
  builder.range = passthrough
  builder.limit = passthrough
  builder.or = passthrough
  builder.maybeSingle = terminal
  builder.single = terminal
  builder.then = (resolve: (value: QueryResult) => unknown) => resolve(result)

  return builder
}

export function mockSupabase(options: {
  user?: { id: string; email?: string } | null
  fromResults?: Record<string, QueryResult>
  rpcResults?: Record<string, QueryResult>
}) {
  const fromResults = options.fromResults ?? {}
  return {
    auth: {
      getUser: async () => ({
        data: { user: options.user ?? null },
        error: options.user ? null : { message: 'not authenticated' },
      }),
    },
    from: (table: string) => mockQuery(fromResults[table] ?? { data: null, error: null }),
    rpc: async (name: string) =>
      options.rpcResults?.[name] ?? { data: null, error: null },
  }
}
