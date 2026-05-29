export const meta = {
  name: 'hello-workflow',
  description: 'Smoke test: test workflow runtime',
  phases: [{ title: 'Greet', detail: 'Confirm runtime' }],
}

phase('Greet')
const r = await agent(
  'You are a smoke test. Return: 1) a one-sentence message, 2) the integer 2+2, 3) a boolean true.',
  {
    label: 'smoke',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        sum: { type: 'number' },
        runtimeConfirmed: { type: 'boolean' },
      },
      required: ['message', 'sum', 'runtimeConfirmed'],
    },
  }
)
log('smoke result: ' + JSON.stringify(r))
return r
