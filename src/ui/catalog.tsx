import { previewFromHtml } from '../preview.ts';
import { scoped } from './scoped.ts';
import { useMemo, useState } from 'react';
import { useLiveQuery, createCollection } from '@tanstack/react-db';
import { queryCollectionOptions } from '@tanstack/query-db-collection';
import { Link, useNavigate } from '@tanstack/react-router';
import type { Mention, MentionOutRow } from '../../sdk/dist/browser.js';
import { BlyggerApi, unwrap } from '../../sdk/dist/browser.js';
import {
  client,
  subscriptions,
  hoppers,
  queryClient,
  items,
  changed,
  hopperDetail,
  hopperPreview,
} from './data.ts';
import {
  Button,
  Failure,
  Html,
  usePoll,
  mount,
  useChrome,
  useSettings,
  SourceLink,
} from './components.tsx';
import { sourceTitleAndUrl } from '../importer/util.ts';
import { confirm } from './sheets.tsx';
import { formatDateIn } from '../dates.ts';
import './reading.css';
function useAction() {
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  return {
    error,
    busy,
    run: async (fn: () => Promise<unknown>) => {
      if (busy) return;
      setBusy(true);
      setError(undefined);
      try {
        await fn();
      } catch (error) {
        setError(error);
      } finally {
        setBusy(false);
      }
    },
  };
}
/** Subscribe to a blyg or a feed: the body of reading's ＋ sheet. */
export function AddFeedForm({ onSubscribed }: { onSubscribed?: () => void }) {
  const action = useAction();
  const [url, setUrl] = useState('');
  const [confirmation, setConfirmation] = useState<{
    title: string;
    siteMismatch?: {
      asserted: string;
      actual: string;
    };
  }>();
  const add = async (confirm = false) => {
    const result = await unwrap(
      BlyggerApi.createSubscription({ client, body: { url, confirm } }),
    );
    if ('needsConfirm' in result) setConfirmation(result);
    else {
      setConfirmation(undefined);
      setUrl('');
      // The backfill runs on the server after this reply; polling brings its
      // items in, so the sheet need not wait on the refetch.
      void changed('subscriptions', 'reading');
      onSubscribed?.();
    }
  };
  return (
    <>
      <Failure error={action.error} />
      <form
        id="add-sub-form"
        onSubmit={(event) => {
          event.preventDefault();
          void action.run(() => add());
        }}
      >
        <input
          id="add-sub-url"
          type="url"
          inputMode="url"
          aria-label="feed or blyg URL"
          placeholder="https://example.com/"
          required
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setConfirmation(undefined);
          }}
        />
        {confirmation ? null : (
          <div className="sheet-actions">
            <Button
              className="btn btn-primary"
              disabled={action.busy}
              type="submit"
            >
              {action.busy ? 'checking…' : 'subscribe'}
            </Button>
          </div>
        )}
      </form>
      {confirmation ? (
        <div id="add-sub-confirm" className="add-sub-confirm">
          <p>
            <strong>Subscribe to {confirmation.title}?</strong>
          </p>
          {confirmation.siteMismatch ? (
            <p className="mismatch">
              Site mismatch: {confirmation.siteMismatch.asserted} /{' '}
              {confirmation.siteMismatch.actual}
            </p>
          ) : null}
          <div className="sheet-actions">
            <Button
              className="btn btn-primary"
              disabled={action.busy}
              onClick={() => void action.run(() => add(true))}
            >
              {action.busy ? 'subscribing…' : 'confirm subscribe'}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
export function HoppersPage() {
  useChrome({ framed: false });
  const rows =
    useLiveQuery({
      query: (q) => q.from({ hopper: hoppers }),
    }).data ?? [];
  usePoll('hoppers', hoppers.utils.refetch);
  const action = useAction();
  const [name, setName] = useState('');
  const create = async () => {
    const hopper = await unwrap(
      BlyggerApi.createHopper({ client, body: { name } }),
    );
    hoppers.utils.writeUpsert(hopper);
    setName('');
  };
  return (
    <>
      <h2 className="view-h">hoppers</h2>
      <Failure error={action.error} />
      <form
        className="card hopper-create"
        onSubmit={(event) => {
          event.preventDefault();
          void action.run(create);
        }}
      >
        <div className="row">
          <input
            type="text"
            aria-label="hopper name"
            placeholder="hopper name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            className="btn btn-primary"
            type="submit"
            disabled={action.busy}
          >
            create hopper
          </Button>
        </div>
      </form>
      {rows.map((hopper) => (
        <HopperCard key={hopper.id} id={hopper.id} name={hopper.name} />
      ))}
    </>
  );
}
function HopperCard({ id, name }: { id: string; name: string }) {
  const collection = useMemo(() => hopperPreview(id), [id]);
  usePoll(`hopper-preview:${id}`, collection.utils.refetch);
  const row = useLiveQuery({ query: (q) => q.from({ hopper: collection }) })
    .data?.[0];
  const sources =
    useLiveQuery({ query: (q) => q.from({ source: subscriptions }) }).data ??
    [];
  return (
    <div className="card hopper-row">
      <h3 className="card-h">
        <Link to="/hoppers/$id" params={{ id }}>
          {name}
        </Link>
        <span className="chev" aria-hidden="true">
          ›
        </span>
      </h3>
      {row ? (
        <>
          <p className="muted small hopper-meta">
            {row.total} items · {row.source_count} sources ·{' '}
            {row.hopper.public ? 'public' : 'private'}
          </p>
          {row.items.map((item) => {
            const preview = previewFromHtml(item.content_html);
            const source = sources.find(
              (source) => source.id === item.subscription_id,
            );
            return (
              <p
                className="hopper-prev hopper-preview"
                key={JSON.stringify([item.subscription_id, item.remote_id])}
              >
                {preview.title ? <strong>{preview.title} · </strong> : null}
                {preview.body}
                {source ? (
                  <small> · {source.title || source.origin}</small>
                ) : null}
              </p>
            );
          })}
          {row.total > 3 ? (
            <p className="tiny muted hopper-more">+{row.total - 3} more</p>
          ) : null}
        </>
      ) : (
        <p className="muted small">Loading preview…</p>
      )}
    </div>
  );
}
export function HopperPage({ id }: { id: string }) {
  useChrome({ framed: false });
  const collection = useMemo(() => hopperDetail(id), [id]);
  const row = useLiveQuery({
    query: (q) => q.from({ hopper: collection }),
  }).data?.[0];
  usePoll(`hopper:${id}`, collection.utils.refetch);
  const action = useAction();
  const navigate = useNavigate();
  const settings = useSettings();
  const [name, setName] = useState<string>();
  const [description, setDescription] = useState<string>();
  const sources =
    useLiveQuery({ query: (q) => q.from({ source: subscriptions }) }).data ??
    [];
  if (!row) return <p className="view-sub">Loading hopper…</p>;
  const update = async (body: { name?: string; public?: boolean; description?: string }) => {
    await unwrap(BlyggerApi.updateHopper({ client, path: { id }, body }));
    await changed('hoppers', 'hopper', 'hopper-preview');
  };
  const remove = async () => {
    await unwrap(BlyggerApi.deleteHopper({ client, path: { id } }));
    await changed('hoppers');
    await navigate({ to: '/hoppers' });
  };
  const added = (iso: string) => {
    const time = Date.parse(iso);
    return Number.isNaN(time)
      ? iso
      : formatDateIn(iso, settings?.timezone || 'UTC');
  };
  return (
    <>
      <Link className="back-link" to="/hoppers">
        ← hoppers
      </Link>
      <h2 className="view-h">{row.hopper.name}</h2>
      <Failure error={action.error} />
      <div className="card hopper-settings">
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            void action.run(() => update({ name: name ?? row.hopper.name }));
          }}
        >
          <input
            type="text"
            name="name"
            aria-label="name"
            value={name ?? row.hopper.name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button className="btn btn-ghost" type="submit">
            rename
          </Button>
        </form>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            void action.run(() =>
              update({ description: description ?? row.hopper.description ?? '' }),
            );
          }}
        >
          <input
            type="text"
            name="description"
            aria-label="description"
            placeholder="one-line description (shown on the public page)"
            maxLength={280}
            value={description ?? row.hopper.description ?? ''}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button className="btn btn-ghost" type="submit">
            save
          </Button>
        </form>
        <label className="check">
          <input
            type="checkbox"
            checked={row.hopper.public}
            disabled={action.busy}
            onChange={(e) => {
              const checked = e.target.checked;
              void action.run(() => update({ public: checked }));
            }}
          />
          <span>public</span>
        </label>
        {row.hopper.public && row.hopper.slug ? (
          <p className="hint">
            Public URL:{' '}
            <a
              href={`${mount}/h/${row.hopper.slug}/`}
              target="_blank"
              rel="noreferrer"
            >
              {location.origin}
              {mount}/h/{row.hopper.slug}/
            </a>
          </p>
        ) : null}
        {row.hopper.slug_frozen ? (
          <p className="hint">
            The public URL stays fixed when you rename this hopper.
          </p>
        ) : null}
        <p className="hint">
          A public hopper gets its own page and is listed under Collections on
          your homepage and archive. It never appears in your feed.
        </p>
      </div>
      <div className="section-h">
        <span>
          {row.total} items from {row.source_count} sources
        </span>
      </div>
      {row.memberships.map((member) => {
        const key = JSON.stringify([member.subscription_id, member.remote_id]);
        const item = row.items.find(
          (item) =>
            item.subscription_id === member.subscription_id &&
            item.remote_id === member.remote_id,
        );
        const source = sources.find(
          (source) => source.id === member.subscription_id,
        );
        return (
          <article className="entry reading-entry" key={key}>
            <div className="entry-in">
              <p className="byline">
                {item ? <span className="badge">{item.kind}</span> : null}
                {source ? (
                  <a
                    className="src"
                    href={source.origin}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {source.title || source.origin}
                  </a>
                ) : (
                  <span className="src">{member.subscription_id}</span>
                )}
                <span>· added {added(member.added_at)}</span>
              </p>
              {item?.state === 'tombstone' ? (
                <p className="tomb">
                  withdrawn by origin
                  {item.pinned_version_retained != null
                    ? ` · retained pinned v${item.pinned_version_retained}`
                    : ''}
                </p>
              ) : null}
              <div className="entry-body content">
                <Html html={item?.content_html || ''} />
              </div>
              <SourceLink
                url={
                  item && source
                    ? sourceTitleAndUrl({ ...item, l0: item.l0 ? 1 : 0 }, source.origin).url
                    : undefined
                }
              />
            </div>
            <div className="entry-bar">
              <span className="spacer" />
              {item ? (
                <Button
                  className="btn btn-ghost btn-mini"
                  data-action="stub"
                  onClick={() =>
                    void action.run(async () => {
                      const draft = await unwrap(
                        BlyggerApi.createItem({
                          client,
                          body: {
                            mode: 'response',
                            source: {
                              subscription_id: member.subscription_id,
                              remote_id: member.remote_id,
                            },
                          },
                        }),
                      );
                      await changed('items');
                      await navigate({
                        to: '/edit/$id',
                        params: { id: draft.id },
                      });
                    })
                  }
                >
                  stub ↗
                </Button>
              ) : null}
              <Button
                className="btn btn-ghost btn-mini"
                onClick={() =>
                  void action.run(async () => {
                    await unwrap(
                      BlyggerApi.removeHopperItem({
                        client,
                        path: {
                          id,
                          sub: member.subscription_id,
                          remoteId: member.remote_id,
                        },
                      }),
                    );
                    await changed('hopper', 'hoppers', 'hopper-preview');
                  })
                }
              >
                remove
              </Button>
            </div>
          </article>
        );
      })}
      <p>
        <Button
          className="btn btn-danger"
          onClick={async () => {
            if (
              await confirm({
                title: 'Delete this hopper?',
                ok: 'delete hopper',
                danger: true,
              })
            )
              void action.run(remove);
          }}
        >
          delete hopper
        </Button>
      </p>
    </>
  );
}
async function mentions(
  direction: 'inbound' | 'outbound',
  signal: AbortSignal,
) {
  const rows: (Mention | MentionOutRow)[] = [];
  for (let offset = 0; ; offset += 100) {
    const page = await unwrap(
      BlyggerApi.listMentions({
        client,
        query: { direction, offset, limit: 100 },
        signal,
      }),
    );
    rows.push(...page.items);
    if (offset + page.items.length >= page.total) return rows;
    if (!page.items.length)
      throw new Error('Mentions ended before their total');
  }
}
export const inbound = createCollection(
  queryCollectionOptions({
    id: 'mentions-in',
    queryKey: ['mentions-in'],
    queryClient,
    getKey: (row: Mention) => row.id,
    queryFn: async ({ signal }) =>
      (await mentions('inbound', signal)).filter(
        (row): row is Mention => 'hidden' in row,
      ),
  }),
);
export const outbound = createCollection(
  queryCollectionOptions({
    id: 'mentions-out',
    queryKey: ['mentions-out'],
    queryClient,
    getKey: (row: MentionOutRow) => row.id,
    queryFn: async ({ signal }) =>
      (await mentions('outbound', signal)).filter(
        (row): row is MentionOutRow => 'next_attempt_at' in row,
      ),
  }),
);
function MentionRow({ mention }: { mention: Mention }) {
  const action = useAction(),
    navigate = useNavigate();
  const collection = useMemo(() => mentionSource(mention.id), [mention.id]);
  const source = useLiveQuery({ query: (q) => q.from({ source: collection }) })
    .data?.[0];
  usePoll(`mention-source:${mention.id}`, collection.utils.refetch);
  let author = mention.source_origin || mention.source;
  try {
    const name = JSON.parse(mention.source_author_json || '{}')?.name;
    if (typeof name === 'string' && name) author = name;
  } catch {
    /* Old stored metadata can be invalid. */
  }
  const gone = mention.status === 'gone';
  return (
    <div
      className={`mention-row ${mention.hidden ? 'hidden-row' : ''} ${gone ? 'gone' : ''}`}
    >
      <span className="rel">{mention.relation || 'mention'}</span> ·{' '}
      <a
        className="who"
        href={mention.source_page || mention.source}
        target="_blank"
        rel="noreferrer"
      >
        {author}
      </a>{' '}
      <span className="muted">
        · v{mention.source_version ?? '?'} · first seen {mention.first_seen}
        {gone ? ' · no longer verifies' : ''}
      </span>
      {gone ? null : (
        <div className="actions">
          <Button
            className="btn btn-ghost btn-mini"
            onClick={() =>
              void action.run(async () => {
                await unwrap(
                  BlyggerApi.updateMention({
                    client,
                    path: { id: mention.id },
                    body: { hidden: !mention.hidden },
                  }),
                );
                await changed('mentions-in');
              })
            }
          >
            {mention.hidden ? 'show on page' : 'hide from page'}
          </Button>
          {mention.source_id && source?.holder ? (
            <Button
              className="btn btn-ghost btn-mini"
              onClick={() =>
                void action.run(async () => {
                  const draft = await unwrap(
                    BlyggerApi.createItem({
                      client,
                      body: {
                        mode: 'response',
                        source: {
                          subscription_id: source.holder!,
                          remote_id: mention.source_id!,
                        },
                      },
                    }),
                  );
                  await changed('items');
                  await navigate({ to: '/edit/$id', params: { id: draft.id } });
                })
              }
            >
              stub back ↗
            </Button>
          ) : mention.source_id ? (
            source?.subscription ? (
              // Subscribed: its inspector (ⓘ on the timeline) has resync.
              <Link
                className="btn btn-ghost btn-mini subscribe-first"
                to="/reading"
                search={{ sub: source.subscription.id, offset: 0 }}
              >
                resync this source to stub back
              </Link>
            ) : (
              // Not subscribed: the sources list, whose ＋ subscribes.
              <Link
                className="btn btn-ghost btn-mini subscribe-first"
                to="/reading"
                search={{}}
              >
                subscribe to {mention.source_origin} to stub back
              </Link>
            )
          ) : null}
        </div>
      )}
      <Failure error={action.error} />
    </div>
  );
}
const mentionSource = scoped((id) =>
  createCollection(
    queryCollectionOptions({
      id: `mention-source:${id}`,
      queryKey: ['mention-source', id],
      queryClient,
      getKey: (
        row: import('../../sdk/dist/browser.js').GetMentionSourceResponses[200] & {
          key: string;
        },
      ) => row.key,
      queryFn: async ({ signal }) => [
        {
          ...(await unwrap(
            BlyggerApi.getMentionSource({ client, path: { id }, signal }),
          )),
          key: id,
        },
      ],
    }),
  ),
);
export function MentionsPage() {
  useChrome({ framed: false });
  const incoming =
    useLiveQuery({ query: (q) => q.from({ mention: inbound }) }).data ?? [];
  const outgoing =
    useLiveQuery({ query: (q) => q.from({ mention: outbound }) }).data ?? [];
  const owned =
    useLiveQuery({ query: (q) => q.from({ item: items }) }).data ?? [];
  const settings = useSettings(),
    action = useAction();
  const [direction, setDirection] = useState<'inbound' | 'outbound'>(
    'inbound',
  );
  usePoll('mentions-in', inbound.utils.refetch);
  usePoll('mentions-out', outbound.utils.refetch);
  usePoll('items', items.utils.refetch);
  const groups = new Map<string, Mention[]>();
  for (const mention of incoming) {
    const rows = groups.get(mention.target_item_id) || [];
    rows.push(mention);
    groups.set(mention.target_item_id, rows);
  }
  return (
    <>
      <h2 className="view-h">mentions</h2>
      <p className="view-sub mentions-note">
        Verified responses from other blygs.
      </p>
      <Failure error={action.error} />
      <div className="segmented" role="group" aria-label="direction">
        {(['inbound', 'outbound'] as const).map((value) => (
          <Button
            key={value}
            className={direction === value ? 'seg is-active' : 'seg'}
            aria-pressed={direction === value}
            onClick={() => setDirection(value)}
          >
            {value}
            <span className="n">
              {value === 'inbound' ? incoming.length : outgoing.length}
            </span>
          </Button>
        ))}
      </div>
      {direction === 'inbound' ? (
        <>
          {[...groups].map(([id, rows]) => {
            const item = owned.find((item) => item.id === id),
              mode = item?.responses || 'default';
            const showing =
              mode === 'show' ||
              (mode === 'default' && settings?.show_responses_default);
            const visible = rows.filter(
              (row) => row.status === 'verified' && !row.hidden,
            ).length;
            return (
              <section className="card mention-group" key={id}>
                <h3 className="card-h">
                  <Link to="/edit/$id" params={{ id }}>
                    {item?.content_md.slice(0, 60) || id.slice(0, 8)}
                  </Link>
                </h3>
                <p className="muted small group-meta">
                  {rows.length} responses · {showing ? visible : 0} on the page
                  now
                </p>
                <div className="field">
                  <span id={`responses-${id}`}>
                    Responses on this item's public page:
                  </span>
                  <div
                    className="segmented"
                    role="group"
                    aria-labelledby={`responses-${id}`}
                  >
                    {(
                      [
                        [
                          'default',
                          `default (${settings?.show_responses_default ? 'showing' : 'hidden'})`,
                        ],
                        ['show', 'show'],
                        ['hide', 'hide'],
                      ] as const
                    ).map(([value, label]) => (
                      <Button
                        key={value}
                        className={mode === value ? 'seg is-active' : 'seg'}
                        aria-pressed={mode === value}
                        disabled={!item || action.busy}
                        onClick={() =>
                          void action.run(async () => {
                            if (mode === value) return;
                            await items.update(id, (row) => {
                              row.responses = value;
                            }).isPersisted.promise;
                          })
                        }
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
                {rows.map((mention) => (
                  <MentionRow key={mention.id} mention={mention} />
                ))}
              </section>
            );
          })}
          {!incoming.length ? (
            <div className="empty">
              <span className="em" aria-hidden="true">
                ↩
              </span>
              No verified mentions.
            </div>
          ) : null}
        </>
      ) : (
        <>
          {!settings?.site_url ? (
            <div className="banner banner-warn mentions-note" role="note">
              <span className="mark" aria-hidden="true">
                !
              </span>
              <div className="body">
                No site URL is set. Set it in{' '}
                <Link to="/settings">settings</Link> before relying on outbound
                delivery.
              </div>
            </div>
          ) : null}
          {outgoing.length ? (
            <div className="card">
              {outgoing.map((mention) => (
                <div className="out-row" key={mention.id}>
                  <span
                    className={`badge ${
                      mention.status === 'sent'
                        ? 'badge-ok'
                        : mention.status === 'pending'
                          ? 'badge-warn'
                          : ''
                    }`}
                  >
                    {mention.status.replaceAll('_', ' ')}
                  </span>{' '}
                  <Link to="/edit/$id" params={{ id: mention.item_id }}>
                    v{mention.version} of {mention.item_id.slice(0, 8)}…
                  </Link>
                  <div className="small muted">
                    →{' '}
                    <a className="target" href={mention.target}>
                      {mention.target}
                    </a>{' '}
                    · {mention.attempts} attempts
                    {mention.next_attempt_at && mention.status === 'pending'
                      ? ` · retrying after ${mention.next_attempt_at}`
                      : ''}
                  </div>
                  {mention.last_error ? (
                    <div className="small err">{mention.last_error}</div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
export function ForkPage({
  id,
  options,
}: {
  id: string;
  options: Awaited<ReturnType<typeof loadForkOptions>>;
}) {
  useChrome({ framed: false });
  const action = useAction();
  const navigate = useNavigate();
  return (
    <>
      <h2 className="view-h">
        fork <small className="mono">{id}</small>
      </h2>
      <Failure error={action.error || options.error} />
      {options.versions.length ? (
        <div className="card">
          {options.versions.map((version) => (
            <div className="kv" key={version.version}>
              <span className="vnum">v{version.version}</span>
              <span className="muted">{version.at}</span>
              <span>{version.note}</span>
              <span className="spacer" />
              <Button
                className="btn btn-primary btn-mini"
                data-action="fork"
                disabled={action.busy}
                onClick={() =>
                  void action.run(async () => {
                    const draft = await unwrap(
                      BlyggerApi.createItem({
                        client,
                        body: {
                          mode: 'fork',
                          source: {
                            origin: options.origin,
                            id,
                            version: version.version,
                          },
                        },
                      }),
                    );
                    items.utils.writeUpsert(draft);
                    await navigate({
                      to: '/edit/$id',
                      params: { id: draft.id },
                    });
                  })
                }
              >
                fork v{version.version}
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
export function loadForkOptions(id: string, sub?: string, origin?: string) {
  return queryClient.fetchQuery({
    staleTime: 0,
    queryKey: ['fork-options', id, sub ?? '', origin ?? ''],
    queryFn: ({ signal }) =>
      unwrap(
        BlyggerApi.getForkOptions({
          client,
          query: { id, sub, origin },
          signal,
        }),
      ),
  });
}
