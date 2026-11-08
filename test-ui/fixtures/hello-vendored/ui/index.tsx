/*
 * A vendoring fixture, used only by test-ui/extension-vendoring.test.ts: the
 * tests commit this directory to a throwaway git repository and vendor it the
 * way `npm run ext:add` vendors an extension from someone else's repository.
 * It is never compiled into a build of this repository.
 *
 * The imports are written for where a vendored copy sits
 * (extensions-vendor/<name>/ui/), not for where this file is.
 */
import type { StudioExtension } from '../../../src/ui/extension-api.ts';
import { greeting } from './greeting.ts';
import './hello-vendored.css';

export const extension: StudioExtension = {
  name: 'hello-vendored',
  label: 'Hello vendored',
  description: 'A test fixture for ext:add.',
  entryByline: ({ context }) => <span className="hello-vendored">{greeting(context.entry.kind)}</span>,
};
