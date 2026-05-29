import { spawn } from 'child_process';

const script = `
export const meta = {
  name: 'hello-workflow',
  description: 'Smoke test',
  phases: [{ title: 'Greet' }],
}

phase('Greet')
const r = await agent(
  'Return a one-sentence message, 2+2, and a boolean.',
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
return r
`;

console.log('Workflow script:');
console.log(script);
console.log('\n请在 Claude Code 中执行上述脚本');
