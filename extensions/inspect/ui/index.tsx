/*
 * inspect: an "inspect" row in each reading entry's ⋯ sheet, opening a sheet
 * with the record this Studio holds for that entry — ids, versions,
 * references, hashes — and its JSON. For people building clients and
 * debugging mentions and imports. Browser only: it reads through the existing
 * contract and fetches nothing from the item's origin. Ships compiled into
 * releases (extensions.json); it starts off like every extension.
 */
import { useEffect, useState } from 'react';
import { BlyggerApi, Button, Sheet, toast, unwrap } from '../../../src/ui/extension-api.ts';
import type { EntryContext, StudioExtension } from '../../../src/ui/extension-api.ts';
import { shapeRecord, summary } from './shape.ts';
import './inspect.css';

function InspectSheet({ context, close }: { context: EntryContext; close: () => void }) {
  const [record, setRecord] = useState<Record<string, unknown>>();
  const [error, setError] = useState<string>();
  useEffect(() => {
    const { client, imported, id } = context;
    const load = imported
      ? unwrap(BlyggerApi.getImportedItem({ client, path: { sub: imported.subscriptionId, id: imported.remoteId } }))
      : unwrap(BlyggerApi.getItem({ client, path: { id } }));
    load.then(
      (r) => setRecord(r as unknown as Record<string, unknown>),
      (e: unknown) => setError(e instanceof Error ? e.message : String(e)),
    );
  }, []);
  const json = record ? JSON.stringify(shapeRecord(record), null, 2) : '';
  return (
    <Sheet open onClose={close} title="inspect" description={context.imported ? 'The copy this Studio imported.' : 'Your item, as this Studio stores it.'}>
      <div className="inspect" data-extension-sheet="inspect">
        {error ? <p className="inspect-error">Could not load: {error}</p> : null}
        {!record && !error ? <p>…</p> : null}
        {record ? (
          <>
            <dl className="inspect-summary">
              {summary(record).map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <pre className="inspect-json">{json}</pre>
            <Button
              className="btn btn-ghost btn-mini"
              onClick={() =>
                void navigator.clipboard.writeText(json).then(
                  () => toast('JSON copied'),
                  () => toast('Could not copy'),
                )
              }
            >
              copy JSON
            </Button>
          </>
        ) : null}
      </div>
    </Sheet>
  );
}

export const extension: StudioExtension = {
  name: 'inspect',
  label: 'Inspect',
  description: 'Adds “inspect” to each reading entry’s ⋯ sheet: the record this Studio holds for it — ids, versions, references, hashes — and its JSON.',
  entryActions: (context) => [
    {
      icon: '{ }',
      label: 'inspect',
      description: 'ids, versions, references, JSON',
      onSelect: () => context.openSheet((close) => <InspectSheet context={context} close={close} />),
    },
  ],
};
