/*
 * Reading — NetNewsWire on a phone (PWA redesign, phase 2B).
 *
 *   /reading                 the sources list: all, my blyg, hoppers, subscriptions
 *   /reading?sub=X&offset=N  one source's timeline (the pre-redesign search params)
 *   /reading?hopper=H        a hopper's members as a timeline
 *
 * Each subscription has an inspector sheet (ⓘ, or swipe its row left), which
 * replaced the /subs page as the place a feed is managed. Every action an
 * entry had before the redesign is still here — the bar holds the ones used
 * most, the ⋯ sheet the rest — and the swipes and the select-to-quote pill
 * are second ways to the same handlers, never the only way.
 */
import { readingPage } from '../paging.ts';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from '@tanstack/react-db';
import { Link, useNavigate } from '@tanstack/react-router';
import type {
  CreateItemData,
  Hopper,
  ImportedItem,
  SignalRow,
  ListReadingResponses,
  Subscription,
} from '../../sdk/dist/browser.js';
import { BlyggerApi, unwrap } from '../../sdk/dist/browser.js';
import type { Lens, Reading } from './data.ts';
import { LENSES, lensKind, readingKey } from './data.ts';
import {
  readingView,
  subscriptions,
  hoppers,
  signals,
  client,
  changed,
  queryClient,
  refreshReading,
  hopperDetail,
  hopperPreview,
} from './data.ts';
import {
  Button,
  Failure,
  mount,
  useChrome,
  usePoll,
  useSettings,
} from './components.tsx';
import { Sheet, confirm, menu, prompt, toast } from './sheets.tsx';
import { displayUrl, sourceTitleAndUrl } from '../importer/util.ts';
import { formatDateIn } from '../dates.ts';
import { AddFeedForm } from './catalog.tsx';
import { diffText, type DiffOp } from '../word-diff.ts';
import { useSwipe } from './swipe.ts';
import type { ActionKey, Handlers } from './lineage.tsx';
import { Coach, LineageGlyph, LineageSheet, glyphCounts, glyphLabel, usedAction, useTip } from './lineage.tsx';
import type { Lineage } from '../../sdk/dist/browser.js';
import './reading.css';

const PAGE = 25;

/* ---------------- small helpers ---------------- */

/** The cached page metadata (counts, total) for one reading view. */
function readingMeta(sub: string, offset: number) {
  return queryClient
    .getQueriesData<ListReadingResponses[200]>({ queryKey: ['reading', sub] })
    .map(([, value]) => value)
    .find((value) => value?.offset === offset);
}
/** A poll time, to the minute, in the owner's timezone. */
function pollTime(iso: string, timeZone: string) {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  };
  try {
    return new Date(iso).toLocaleString('en-US', {
      ...options,
      timeZone: timeZone || 'UTC',
    });
  } catch {
    return new Date(iso).toLocaleString('en-US', { ...options, timeZone: 'UTC' });
  }
}
function sourceName(source: Subscription) {
  return source.title || source.origin;
}
function sourceLetter(source: Subscription) {
  const name = source.title || source.origin.replace(/^https?:\/\/(www\.)?/, '');
  return [...name.trim()][0] ?? '?';
}
/** The subscription row's one-line status, in the alert colour when failing. */
function sourceStatus(source: Subscription, timeZone: string) {
  const polled = source.last_poll_at
    ? `last polled ${pollTime(source.last_poll_at, timeZone)}`
    : 'never polled';
  if (source.status === 'paused') return { text: 'paused', bad: false };
  if (source.fail_count > 0)
    return { text: `${source.fail_count} failures · ${polled}`, bad: true };
  return {
    text: `${source.kind === 'rss' ? 'legacy rss · ' : ''}${polled}`,
    bad: false,
  };
}
async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast('copied');
    return;
  } catch {
    /* fall through: older browsers and denied permissions */
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.append(area);
  area.select();
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }
  area.remove();
  if (copied) toast('copied');
  else await prompt({ title: 'copy text', defaultValue: text, ok: 'done' });
}
async function share(title: string, text: string, url: string) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
    } catch {
      /* dismissed */
    }
    return;
  }
  await copy(`${text}\n\n${url}`);
  toast('no share sheet here — copied text + link instead');
}
function entryTitle(html: string) {
  const first = new DOMParser().parseFromString(html, 'text/html').body
    .firstElementChild;
  return first && /^H[1-6]$/.test(first.tagName)
    ? (first.textContent ?? '').trim()
    : '';
}
function plainExcerpt(html: string) {
  const text =
    new DOMParser().parseFromString(html, 'text/html').body.textContent ?? '';
  return text.replace(/\s+/g, ' ').trim().slice(0, 280);
}

/** Errors and draft creation shared by every reading screen. */
function useReadingActions() {
  const [error, setError] = useState<unknown>();
  const navigate = useNavigate();
  const run = async (action: () => Promise<unknown>) => {
    setError(undefined);
    try {
      await action();
    } catch (failure) {
      setError(failure);
    }
  };
  const openDraft = async (body: CreateItemData['body']) => {
    const created = await unwrap(BlyggerApi.createItem({ client, body }));
    await changed('items');
    await navigate({ to: '/edit/$id', params: { id: created.id } });
  };
  return { error, setError, run, openDraft, navigate };
}
type Actions = ReturnType<typeof useReadingActions>;

/* ---------------- entry body ---------------- */

function Body({ html, url, l0 }: { html: string; url?: string; l0: boolean }) {
  const [expanded, setExpanded] = useState(false),
    [overflow, setOverflow] = useState(false);
  const body = useRef<HTMLDivElement>(null);
  const content = useMemo(() => {
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    const first = parsed.body.firstElementChild;
    let title: string | undefined;
    if (
      first &&
      (/^H[1-6]$/.test(first.tagName) ||
        (l0 &&
          first.tagName === 'P' &&
          first.children.length === 1 &&
          first.firstElementChild?.tagName === 'A'))
    ) {
      title = first.textContent || undefined;
      first.remove();
    }
    return { title, html: parsed.body.innerHTML };
  }, [html, l0]);
  useEffect(() => {
    const element = body.current;
    if (!element) return;
    const measure = () =>
      setOverflow(element.scrollHeight > element.clientHeight + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    return () => observer.disconnect();
  }, [content.html]);
  return (
    <>
      {content.title ? (
        <h3 className="entry-title">
          {url ? (
            <a href={url} target="_blank" rel="noreferrer">
              {content.title}
            </a>
          ) : (
            content.title
          )}
        </h3>
      ) : null}
      <div
        ref={body}
        className={`content entry-body ${expanded ? '' : 'clamped'} ${overflow && !expanded ? 'overflowing' : ''}`}
        dangerouslySetInnerHTML={{ __html: content.html }}
      />
      {overflow && !expanded ? (
        <Button className="more expand-btn" onClick={() => setExpanded(true)}>
          more
        </Button>
      ) : null}
    </>
  );
}
function canLink(entry: Reading) {
  return (
    !entry.l0 &&
    (entry.own
      ? !entry.withdrawn
      : !entry.withdrawn || entry.imported?.pinnedVersionRetained != null)
  );
}
/** Imported, blyg-native and linkable: the entries a passage can be quoted from. */
function canQuote(entry: Reading) {
  return !!entry.imported && !entry.l0 && canLink(entry);
}
function selectedTextInEntry(key: string) {
  const selected = window.getSelection();
  const start = selected?.anchorNode?.parentElement?.closest('.content');
  const end = selected?.focusNode?.parentElement?.closest('.content');
  if (
    !selected?.toString().trim() ||
    start !== end ||
    start?.closest('[data-key]')?.getAttribute('data-key') !== key
  ) {
    throw new Error('Select text in this entry to quote first.');
  }
  return selected.toString();
}
function entryParts(entry: Reading) {
  const imported = entry.imported;
  const id = entry.own?.id || imported!.remoteId;
  const url = entry.own
    ? !entry.withdrawn
      ? `${location.origin}${mount}/${entry.kind === 'thread' ? 't' : 'f'}/${id}/`
      : undefined
    : imported?.sourceUrl || undefined;
  const source = imported
    ? { subscription_id: imported.subscriptionId, remote_id: imported.remoteId }
    : undefined;
  return { imported, id, url, source };
}

/**
 * What the lineage view's actions do for a node it was re-centred on: only
 * what holding that node here allows. The opening entry has its own set.
 */
function nodeHandlers(node: Lineage['node'], actions: Actions): Handlers {
  const { run, openDraft, navigate } = actions;
  const open = node.url
    ? { run: () => void window.open(node.url!, '_blank', 'noreferrer') }
    : { unavailable: 'No public page is known for it.' };
  const id = node.id;
  if (node.held === 'imported' && node.sub && id) {
    const source = { subscription_id: node.sub, remote_id: id };
    return {
      stub: { run: () => void run(() => openDraft({ mode: 'response', source })) },
      quote: { unavailable: 'To quote a passage, find this post in its timeline and select the text there.' },
      fork: { run: () => void navigate({ to: '/fork', search: { id, sub: node.sub! } }) },
      link: { run: () => void run(() => openDraft({ content_md: `[[${id}]]\n\n`, kind: 'fragment' })) },
      history: { unavailable: "Its history opens from the post's own ⋯ sheet in the timeline." },
      open,
    };
  }
  if (node.held === 'own' && id) {
    const yours = { unavailable: 'This is your own post — edit it rather than respond to it.' };
    return {
      stub: yours,
      quote: yours,
      fork: yours,
      link: { run: () => void run(() => openDraft({ content_md: `[[${id}]]\n\n`, kind: 'fragment' })) },
      history: { unavailable: 'Your own versions are in the editor.' },
      open,
    };
  }
  const notHeld = { unavailable: 'Not held here — subscribe to its blyg to respond to, quote, fork or link it.' };
  return { stub: notHeld, quote: notHeld, fork: notHeld, link: notHeld, history: notHeld, open };
}

/* ---------------- one entry ---------------- */

function Entry({
  entry,
  actions,
  votes,
  buckets,
}: {
  entry: Reading;
  actions: Actions;
  votes: SignalRow[];
  buckets: Hopper[];
}) {
  const { run, openDraft, navigate } = actions;
  const settings = useSettings();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [lineageOpen, setLineageOpen] = useState(false);
  const [lineageSelection, setLineageSelection] = useState<string>();
  // The action being pointed at in the bar: drawn as a ghost on the glyph,
  // with a coach line while its tip lasts (option C).
  const [pointing, setPointing] = useState<ActionKey | null>(null);
  const tip = useTip();
  // A tip on a ⋯ row is shown, not announced: the row keeps its name.
  const menuTip = (key: ActionKey) => {
    const text = tip(key);
    return text ? <span className="lg-tip" aria-hidden="true">{text} </span> : null;
  };
  const { imported, id, url, source } = entryParts(entry);
  const signal = votes.find(
    (vote) =>
      vote.subscription_id === imported?.subscriptionId &&
      vote.remote_id === imported.remoteId,
  );
  const date = formatDateIn(entry.displayAt, settings?.timezone || 'UTC');
  const vote = (thumb: 1 | -1) =>
    run(async () => {
      if (!imported) return;
      const path = { sub: imported.subscriptionId, remoteId: id };
      if (signal?.thumb === thumb)
        await unwrap(BlyggerApi.deleteSignal({ client, path }));
      else
        await unwrap(BlyggerApi.setSignal({ client, path, body: { thumb } }));
      await changed('signals');
    });
  const stub = () =>
    source
      ? run(() => {
          usedAction('stub');
          return openDraft({ mode: 'response', source });
        })
      : undefined;
  const linkPost = () =>
    run(() => {
      usedAction('link');
      return openDraft({ content_md: `[[${id}]]\n\n`, kind: 'fragment' });
    });
  const fork = () => {
    if (!imported) return;
    usedAction('fork');
    void navigate({ to: '/fork', search: { id, sub: imported.subscriptionId } });
  };
  const toggleHistory = () => {
    if (!historyOpen) usedAction('history');
    setHistoryOpen((open) => !open);
  };
  const openPage = () => {
    usedAction('open');
    window.open(url, '_blank', 'noreferrer');
  };
  const quote = (selection: string) =>
    source
      ? run(() => {
          usedAction('quote');
          return openDraft({ mode: 'response', source, selection });
        })
      : undefined;
  const openLineage = () => {
    // As with ⋯: read the selection now, before the sheet takes focus.
    let selection: string | undefined;
    if (canQuote(entry))
      try {
        selection = selectedTextInEntry(entry.key);
      } catch {
        selection = undefined;
      }
    setLineageSelection(selection);
    setLineageOpen(true);
  };
  // The lineage sheet counts uses itself; these run the same handlers as the bar and ⋯.
  const handlersFor = (node: Lineage['node'], isStart: boolean): Handlers => {
    if (!isStart) return nodeHandlers(node, actions);
    const yours = entry.own ? 'This is your own post — edit it rather than respond to it.' : undefined;
    return {
      stub: imported && source ? { run: () => void run(() => openDraft({ mode: 'response', source })) } : { unavailable: yours ?? 'This post cannot be responded to.' },
      quote:
        canQuote(entry) && source
          ? lineageSelection
            ? { run: () => void run(() => openDraft({ mode: 'response', source, selection: lineageSelection })) }
            : { unavailable: 'Select the passage in the post first, then open the lineage again — or use the ❝ quote selection pill.' }
          : { unavailable: yours ?? 'Only a blyg post you follow can be quoted.' },
      fork: canQuote(entry) && imported ? { run: () => void navigate({ to: '/fork', search: { id, sub: imported.subscriptionId } }) } : { unavailable: yours ?? 'This post cannot be forked.' },
      link: canLink(entry) ? { run: () => void run(() => openDraft({ content_md: `[[${id}]]\n\n`, kind: 'fragment' })) } : { unavailable: 'A link to this post would not resolve.' },
      history: imported && !entry.l0 ? { run: () => setHistoryOpen(true) } : { unavailable: 'Your own versions are in the editor.' },
      open: url ? { run: () => void window.open(url, '_blank', 'noreferrer') } : { unavailable: 'It has no public page.' },
    };
  };
  const addToHopper = () =>
    run(async () => {
      if (!imported) return;
      const chosen = await menu({
        title: '+ add to hopper…',
        rows: [
          ...buckets.map((bucket) => ({
            key: `hopper:${bucket.id}`,
            icon: '▤',
            label: bucket.name,
          })),
          { key: 'new', icon: '＋', label: 'new hopper…' },
        ],
      });
      if (!chosen) return;
      let hopperId = chosen.slice('hopper:'.length);
      let name = buckets.find((bucket) => bucket.id === hopperId)?.name;
      if (chosen === 'new') {
        const typed = await prompt({ title: 'Name the new hopper:' });
        if (!typed?.trim()) return;
        const hopper = await unwrap(
          BlyggerApi.createHopper({ client, body: { name: typed } }),
        );
        hopperId = hopper.id;
        name = hopper.name;
      }
      await unwrap(
        BlyggerApi.addHopperItem({
          client,
          path: { id: hopperId, sub: imported.subscriptionId, remoteId: id },
        }),
      );
      await changed('hoppers', 'hopper', 'hopper-preview');
      toast(`added to ${name}`);
    });
  const openMenu = async () => {
    // Read the selection now: the sheet takes focus, and "quote selection"
    // quotes what was selected when ⋯ was pressed.
    let selection: string | undefined;
    let selectionError: unknown;
    if (canQuote(entry))
      try {
        selection = selectedTextInEntry(entry.key);
      } catch (failure) {
        selectionError = failure;
      }
    await menu({
      rows: [
        canQuote(entry) &&
          source && {
            icon: '❝',
            label: 'quote selection',
            description: (
              <>
                {menuTip('quote')}
                select text in the entry first — a quote selection button appears
              </>
            ),
            onSelect: () =>
              void run(async () => {
                if (selection === undefined) throw selectionError;
                await quote(selection);
              }),
          },
        canLink(entry) && {
          icon: '⇢',
          label: 'link post ↗',
          description: menuTip('link'),
          onSelect: () => void linkPost(),
        },
        canQuote(entry) &&
          imported && {
            icon: '⑂',
            label: 'fork',
            description: menuTip('fork'),
            onSelect: fork,
          },
        canLink(entry) && {
          icon: '⟦',
          label: 'copy [[id]]',
          onSelect: () => void copy(`[[${id}]]`),
        },
        !!url && {
          icon: '⧉',
          label: 'copy url',
          onSelect: () => void copy(url!),
        },
        !!url && {
          icon: '⇪',
          label: 'share…',
          onSelect: () =>
            void share(
              entryTitle(entry.contentHtml),
              plainExcerpt(entry.contentHtml),
              url!,
            ),
        },
        !!url && {
          key: 'open',
          icon: '↗',
          label: `${displayUrl(url!)} ↗`,
          description: (
            <>
              {menuTip('open')}
              {url}
            </>
          ),
          onSelect: openPage,
        },
        !!imported &&
          !entry.l0 && {
            key: 'history',
            icon: '⟲',
            label: historyOpen ? 'hide history' : 'history',
            description: historyOpen ? undefined : menuTip('history'),
            onSelect: toggleHistory,
          },
      ],
    });
  };
  const swipe = useSwipe<HTMLDivElement>(
    imported
      ? {
          onRight: () => void vote(1),
          onLeft: () => void stub(),
          mouseFrom: '.byline, .entry-bar',
          mover: '.entry',
        }
      : {},
  );
  return (
    <div
      ref={swipe}
      className="swipe"
      data-swipe={imported ? 'entry' : undefined}
    >
      {imported ? (
        <div className="swipe-bg" aria-hidden="true">
          <span className="sl">
            👍 {signal?.thumb === 1 ? 'clear' : 'thumb up'}
          </span>
          <span className="sr">stub ↗</span>
        </div>
      ) : null}
      <article className="entry reading-entry" data-key={entry.key}>
        <div className="entry-in">
          <p className="byline">
            <span className="badge">{entry.kind}</span>
            {entry.l0 ? (
              <span className="badge badge-line">legacy rss</span>
            ) : null}
            <span className="src">{imported?.subscriptionTitle || 'you'}</span>
            <span>· {date}</span>
            {entry.lineage ? (
              <button
                type="button"
                className="glyph-btn"
                data-action="lineage"
                aria-label={glyphLabel(entry.lineage)}
                title="where this came from, what came from it, and what each action does"
                // Keep a text selection alive, for quote selection in the sheet.
                onMouseDown={(event) => event.preventDefault()}
                onClick={openLineage}
              >
                <LineageGlyph summary={entry.lineage} ghost={pointing} />
                <span>{glyphCounts(entry.lineage)}</span>
              </button>
            ) : null}
          </p>
          {entry.withdrawn ? (
            <p className="tomb">
              withdrawn
              {imported?.pinnedVersionRetained != null
                ? ` · retained pinned v${imported.pinnedVersionRetained}`
                : ''}
            </p>
          ) : null}
          <Body html={entry.contentHtml} url={url} l0={entry.l0} />
        </div>
        {imported && !entry.l0 && historyOpen ? (
          <History sub={imported.subscriptionId} id={id} />
        ) : null}
        <div className="entry-bar">
          {imported
            ? ([1, -1] as const).map((thumb) => (
                <Button
                  key={thumb}
                  className="icon-btn"
                  aria-label={thumb === 1 ? 'thumbs up' : 'thumbs down'}
                  aria-pressed={signal?.thumb === thumb}
                  onClick={() => void vote(thumb)}
                >
                  {thumb === 1 ? '👍' : '👎'}
                </Button>
              ))
            : null}
          <span className="spacer" />
          {entry.own ? (
            <Link
              className="btn btn-ghost btn-mini"
              to="/edit/$id"
              params={{ id }}
            >
              edit
            </Link>
          ) : null}
          {imported ? (
            <>
              <Button
                className="btn btn-ghost btn-mini"
                data-action="stub"
                data-sub={imported.subscriptionId}
                data-remote={imported.remoteId}
                onClick={() => void stub()}
                onMouseEnter={() => setPointing('stub')}
                onMouseLeave={() => setPointing(null)}
                onFocus={() => setPointing('stub')}
                onBlur={() => setPointing(null)}
              >
                stub ↗
              </Button>
              <Button
                className="btn btn-ghost btn-mini"
                aria-label="add to hopper"
                onClick={() => void addToHopper()}
              >
                + add to hopper…
              </Button>
            </>
          ) : null}
          <Button
            className="icon-btn more-btn"
            aria-label="more actions"
            // Keep a text selection alive through the press.
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => void openMenu()}
          >
            ⋯
          </Button>
        </div>
        <Coach action={pointing} tip={tip} />
        {entry.lineage && lineageOpen ? (
          <LineageSheet
            open={lineageOpen}
            onClose={() => setLineageOpen(false)}
            start={imported ? { id, sub: imported.subscriptionId } : { id }}
            handlersFor={handlersFor}
          />
        ) : null}
      </article>
    </div>
  );
}

/** "❝ quote selection" while text is selected inside one quotable entry. */
function QuotePill({
  quotable,
  onQuote,
}: {
  quotable: (key: string) => boolean;
  onQuote: (key: string) => void;
}) {
  const [key, setKey] = useState<string | null>(null);
  const latest = useRef({ quotable, onQuote });
  latest.current = { quotable, onQuote };
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const contentOf = (node: Node | null | undefined) =>
      (node?.nodeType === Node.ELEMENT_NODE
        ? (node as Element)
        : node?.parentElement
      )?.closest('.content');
    const check = () => {
      const selection = window.getSelection();
      const start = contentOf(selection?.anchorNode);
      const found =
        selection &&
        !selection.isCollapsed &&
        selection.toString().trim() &&
        start &&
        start === contentOf(selection.focusNode)
          ? start.closest('[data-key]')?.getAttribute('data-key')
          : null;
      setKey(found && latest.current.quotable(found) ? found : null);
    };
    document.addEventListener('selectionchange', check);
    return () => document.removeEventListener('selectionchange', check);
  }, []);
  useEffect(() => {
    const element = button.current;
    if (!element || !key) return;
    // Pressing the pill must not collapse the selection it quotes. React's
    // touch listeners are passive, so these are native.
    const touch = (event: TouchEvent) => {
      event.preventDefault();
      latest.current.onQuote(key);
    };
    const mouse = (event: MouseEvent) => event.preventDefault();
    element.addEventListener('touchstart', touch, { passive: false });
    element.addEventListener('mousedown', mouse);
    return () => {
      element.removeEventListener('touchstart', touch);
      element.removeEventListener('mousedown', mouse);
    };
  }, [key]);
  return key ? (
    <button
      ref={button}
      type="button"
      className="quote-pill"
      data-action="quote-pill"
      onClick={() => latest.current.onQuote(key)}
    >
      ❝ quote selection
    </button>
  ) : null;
}

/** Entries, the select-to-quote pill, and the error line above them. */
function EntryList({
  entries,
  actions,
}: {
  entries: Reading[];
  actions: Actions;
}) {
  const votes =
    useLiveQuery({ query: (q) => q.from({ signal: signals }) }).data ?? [];
  const buckets =
    useLiveQuery({ query: (q) => q.from({ hopper: hoppers }) }).data ?? [];
  const byKey = new Map(entries.map((entry) => [entry.key, entry]));
  return (
    <>
      {entries.map((entry) => (
        <Entry
          key={entry.key}
          entry={entry}
          actions={actions}
          votes={votes}
          buckets={buckets}
        />
      ))}
      <QuotePill
        quotable={(key) => {
          const entry = byKey.get(key);
          return !!entry && canQuote(entry);
        }}
        onQuote={(key) => {
          const entry = byKey.get(key);
          const { source } = entry ? entryParts(entry) : {};
          if (!source) return;
          usedAction('quote');
          void actions.run(async () =>
            actions.openDraft({
              mode: 'response',
              source,
              selection: selectedTextInEntry(key),
            }),
          );
        }}
      />
    </>
  );
}
function Pager({
  offset,
  total,
  go,
}: {
  offset: number;
  total: number | undefined;
  go: (offset: number) => void;
}) {
  return (
    <div className="pager reading-pager">
      <Button
        className="btn btn-ghost btn-mini"
        disabled={offset === 0}
        onClick={() => go(offset - PAGE)}
      >
        newer
      </Button>
      <span className="pager-info">
        page {offset / PAGE + 1} of{' '}
        {readingPage(String(offset / PAGE + 1), total ?? 0).pages}
      </span>
      <Button
        className="btn btn-ghost btn-mini"
        disabled={total === undefined || offset + PAGE >= total}
        onClick={() => go(offset + PAGE)}
      >
        older
      </Button>
    </div>
  );
}

/* ---------------- the inspector and subscribe sheets ---------------- */

function useSubscriptionActions(actions: Actions) {
  const toggle = (source: Subscription) =>
    actions.run(async () => {
      const paused = source.status === 'paused';
      await subscriptions.update(source.id, (row) => {
        row.status = paused ? 'active' : 'paused';
      }).isPersisted.promise;
      toast(paused ? 'resumed' : 'paused');
    });
  return { toggle };
}
function Inspector({
  source,
  count,
  onClose,
  actions,
  onDeleted,
}: {
  source: Subscription | undefined;
  count: number | undefined;
  onClose: () => void;
  actions: Actions;
  onDeleted?: () => void;
}) {
  const settings = useSettings();
  const [error, setError] = useState<unknown>();
  const { toggle } = useSubscriptionActions(actions);
  // Keep the last source so the sheet can animate shut after a delete.
  const last = useRef(source);
  if (source) last.current = source;
  const shown = source ?? last.current;
  useEffect(() => setError(undefined), [source?.id]);
  if (!shown) return null;
  const timeZone = settings?.timezone || 'UTC';
  const flags = shown.flags
    .map((flag) => `${flag.type}: ${flag.detail || ''}`)
    .join(' · ');
  return (
    <Sheet
      open={!!source}
      onClose={onClose}
      title={sourceName(shown)}
      className="inspector"
    >
      <dl>
        <dt>origin</dt>
        <dd>
          <a href={shown.origin} target="_blank" rel="noreferrer">
            {shown.origin}
          </a>
        </dd>
        <dt>type</dt>
        <dd>
          {shown.kind === 'rss' ? 'legacy rss' : shown.kind}
          {flags ? ` · ${flags}` : ''}
        </dd>
        <dt>polled</dt>
        <dd>
          {shown.status === 'paused' ? 'paused · ' : ''}
          {shown.last_poll_at
            ? `last polled ${pollTime(shown.last_poll_at, timeZone)}`
            : 'never polled'}
        </dd>
        <dt>failures</dt>
        <dd className={shown.fail_count ? 'bad' : undefined}>
          {shown.fail_count}
        </dd>
        <dt>items</dt>
        <dd>{count ?? '…'}</dd>
      </dl>
      <label className="check">
        <input
          type="checkbox"
          checked={shown.in_blogroll}
          onChange={(event) => {
            const checked = event.target.checked;
            setError(undefined);
            subscriptions
              .update(shown.id, (row) => {
                row.in_blogroll = checked;
              })
              .isPersisted.promise.then(
                () =>
                  toast(
                    checked ? 'added to blogroll' : 'removed from blogroll',
                  ),
                setError,
              );
          }}
        />
        <span>
          in blogroll
          <span className="hint">
            Listed in your public <code>blogroll.opml</code>.
          </span>
        </span>
      </label>
      <Failure error={error} />
      <ul className="menu-list">
        <li>
          <Button
            onClick={() => {
              onClose();
              void toggle(shown);
            }}
          >
            <span className="mi" aria-hidden="true">
              {shown.status === 'paused' ? '▶' : '‖'}
            </span>
            <span className="ml">
              {shown.status === 'paused' ? 'resume' : 'pause'}
            </span>
          </Button>
        </li>
        {shown.kind === 'blyg' ? (
          <li>
            <Button
              onClick={() => {
                onClose();
                void actions.run(async () => {
                  const result = await unwrap(
                    BlyggerApi.resyncSubscription({
                      client,
                      path: { id: shown.id },
                    }),
                  );
                  await changed('subscriptions', 'reading');
                  toast(`resynced · ${result.changed} changed`);
                });
              }}
            >
              <span className="mi" aria-hidden="true">
                ⟲
              </span>
              <span className="ml">resync</span>
            </Button>
          </li>
        ) : null}
        <li>
          <Button
            className="danger"
            onClick={async () => {
              onClose();
              if (
                await confirm({
                  title:
                    'Delete this subscription and its local imports, hopper memberships, and signals?',
                  ok: 'delete',
                  danger: true,
                })
              )
                void actions.run(async () => {
                  await subscriptions.delete(shown.id).isPersisted.promise;
                  await changed('hoppers', 'signals', 'reading');
                  toast('deleted');
                  onDeleted?.();
                });
            }}
          >
            <span className="mi" aria-hidden="true">
              ✕
            </span>
            <span className="ml">delete</span>
          </Button>
        </li>
      </ul>
    </Sheet>
  );
}
function SubscribeSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="subscribe">
      <AddFeedForm
        onSubscribed={() => {
          onClose();
          toast('subscribed');
        }}
      />
    </Sheet>
  );
}

/* ---------------- lenses (0.25.0) ---------------- */

const LensContext = createContext<Lens>('all');
/** The current lens as search params, for links that should keep it. */
function useLensSearch(): { lens?: Lens } {
  const lens = useContext(LensContext);
  return lens === 'all' ? {} : { lens };
}
const LENS_LABELS: Record<Lens, string> = {
  all: 'All',
  threads: 'Threads',
  fragments: 'Fragments',
  background: 'Background',
  smart: 'Smart Feed',
};
/**
 * The lens bar at the top of every reading screen. All, Threads and Fragments
 * filter whatever is open (the sources list's counts too); Background and
 * Smart Feed are placeholders that telegraph where reading is going.
 */
function LensBar({ sub, hopper }: { sub?: string; hopper?: string }) {
  const lens = useContext(LensContext);
  const navigate = useNavigate();
  const bar = useRef<HTMLDivElement>(null);
  // On a phone the bar scrolls sideways; keep the chosen lens in view.
  useEffect(() => {
    const el = bar.current?.querySelector<HTMLElement>('[aria-pressed=true]');
    const box = bar.current;
    if (!el || !box) return;
    // Scroll only the bar, never the page.
    if (el.offsetLeft + el.offsetWidth > box.scrollLeft + box.clientWidth) box.scrollLeft = el.offsetLeft + el.offsetWidth - box.clientWidth;
    else if (el.offsetLeft < box.scrollLeft) box.scrollLeft = el.offsetLeft;
  }, [lens]);
  const place = hopper ? { hopper, offset: 0 } : sub ? { sub, offset: 0 } : {};
  // Buttons, not router Links: a Link to /reading counts as "current" under
  // every lens, which would mark All active alongside the real choice.
  return (
    <div ref={bar} className="segmented lens-bar" role="group" aria-label="reading lens">
      {LENSES.map((value) => (
        <Button
          key={value}
          className={`seg${lens === value ? ' is-active' : ''}${value === 'background' || value === 'smart' ? ' seg-dashed' : ''}`}
          aria-pressed={lens === value}
          onClick={() =>
            void navigate({ to: '/reading', search: { ...place, ...(value === 'all' ? {} : { lens: value }) } })
          }
        >
          {LENS_LABELS[value]}
        </Button>
      ))}
    </div>
  );
}
export const BACKGROUND_NOTE =
  'Procedural version updates for managing staleness, with ignyr in the changelog, will appear here once the feature is designed and incorporated into the protocol.';
export const SMART_FEED_NOTE = 'Feed sorted and filtered by your AI agent. Set a prompt in Settings.';
function LensPlaceholder({ lens }: { lens: 'background' | 'smart' }) {
  return (
    <div className="empty lens-placeholder">
      <span className="em" aria-hidden="true">
        {lens === 'smart' ? '✦' : '↻'}
      </span>
      {lens === 'smart' ? (
        <>
          Feed sorted and filtered by your AI agent. Set a prompt in{' '}
          <Link to="/settings">Settings</Link>.
        </>
      ) : (
        BACKGROUND_NOTE
      )}
    </div>
  );
}

/* ---------------- the sources list ---------------- */

function SubscriptionRow({
  source,
  count,
  onInspect,
  onToggle,
}: {
  source: Subscription;
  count: number | undefined;
  onInspect: () => void;
  onToggle: () => void;
}) {
  const lensSearch = useLensSearch();
  const settings = useSettings();
  const swipe = useSwipe<HTMLLIElement>({
    onLeft: onInspect,
    onRight: onToggle,
  });
  const paused = source.status === 'paused';
  const status = sourceStatus(source, settings?.timezone || 'UTC');
  return (
    <li
      ref={swipe}
      className={paused ? 'feed paused' : 'feed'}
      data-swipe="feed"
      data-id={source.id}
    >
      <div className="swipe-bg" aria-hidden="true">
        <span className="sl">{paused ? '▶ resume' : '‖ pause'}</span>
        <span className="sr">ⓘ info</span>
      </div>
      <div className="feed-in">
        <Link
          to="/reading"
          search={{ sub: source.id, offset: 0, ...lensSearch }}
          draggable={false}
        >
          <span className="fi" aria-hidden="true">
            {sourceLetter(source)}
          </span>
          <span className="fm">
            <span className="ft">{sourceName(source)}</span>
            <span className={status.bad ? 'fs bad' : 'fs'}>{status.text}</span>
          </span>
          <span className="fn">{count ?? ''}</span>
          <span className="chev" aria-hidden="true">
            ›
          </span>
        </Link>
        <Button
          className="info"
          aria-label={`about ${sourceName(source)}`}
          onClick={onInspect}
        >
          ⓘ
        </Button>
      </div>
    </li>
  );
}
function HopperSource({ id, name }: { id: string; name: string }) {
  const lensSearch = useLensSearch();
  const collection = useMemo(() => hopperPreview(id), [id]);
  usePoll(`hopper-preview:${id}`, collection.utils.refetch);
  const row = useLiveQuery({ query: (q) => q.from({ hopper: collection }) })
    .data?.[0];
  return (
    <li className="feed">
      <div className="feed-in">
        <Link to="/reading" search={{ hopper: id, offset: 0, ...lensSearch }}>
          <span className="fi" aria-hidden="true">
            ▤
          </span>
          <span className="fm">
            <span className="ft">{name}</span>
            {row ? (
              <span className="fs">
                {row.source_count} source{row.source_count === 1 ? '' : 's'} ·{' '}
                {row.hopper.public ? 'public' : 'private'}
              </span>
            ) : null}
          </span>
          <span className="fn">{row?.total ?? ''}</span>
          <span className="chev" aria-hidden="true">
            ›
          </span>
        </Link>
      </div>
    </li>
  );
}
function SmartSource({
  sub,
  icon,
  title,
  count,
}: {
  sub: 'all' | 'own';
  icon: string;
  title: string;
  count: number | undefined;
}) {
  const lensSearch = useLensSearch();
  return (
    <li className="feed">
      <div className="feed-in">
        <Link to="/reading" search={{ sub, offset: 0, ...lensSearch }}>
          <span className="fi smart" aria-hidden="true">
            {icon}
          </span>
          <span className="fm">
            <span className="ft">{title}</span>
          </span>
          <span className="fn">{count ?? ''}</span>
          <span className="chev" aria-hidden="true">
            ›
          </span>
        </Link>
      </div>
    </li>
  );
}
function Sources() {
  useChrome({ framed: false, wide: false });
  const actions = useReadingActions();
  const { toggle } = useSubscriptionActions(actions);
  const [inspect, setInspect] = useState<string>();
  const [adding, setAdding] = useState(false);
  // The first page of "all" carries the counts for every source; it is also
  // what tapping "all" shows, so it is warm when that happens.
  const lens = useContext(LensContext);
  const allKey = readingKey('all', lens);
  useLiveQuery(readingView(allKey, 0));
  const refresh = useMemo(() => () => refreshReading(allKey, 0), [allKey]);
  usePoll(`reading:${allKey}:0`, refresh);
  usePoll('subscriptions', subscriptions.utils.refetch);
  usePoll('hoppers', hoppers.utils.refetch);
  const sources =
    useLiveQuery({ query: (q) => q.from({ source: subscriptions }) }).data ??
    [];
  const buckets =
    useLiveQuery({ query: (q) => q.from({ hopper: hoppers }) }).data ?? [];
  const counts = readingMeta(allKey, 0)?.counts;
  const inspected = sources.find((source) => source.id === inspect);
  return (
    <>
      <div className="view-head">
        <h2 className="view-h">reading</h2>
        <Button
          className="icon-btn"
          aria-label="subscribe"
          title="subscribe"
          onClick={() => setAdding(true)}
        >
          ＋
        </Button>
      </div>
      <LensBar />
      <Failure error={actions.error} />
      <div className="list-h">
        <span>sources</span>
      </div>
      <ul className="feeds" aria-label="sources">
        <SmartSource sub="all" icon="◫" title="all" count={counts?.all} />
        <SmartSource sub="own" icon="❝" title="my blyg" count={counts?.own} />
      </ul>
      <div className="list-h">
        <span>hoppers · {buckets.length}</span>
        <Link to="/hoppers">manage</Link>
      </div>
      {buckets.length ? (
        <ul className="feeds" aria-label="hoppers">
          {buckets.map((bucket) => (
            <HopperSource key={bucket.id} id={bucket.id} name={bucket.name} />
          ))}
        </ul>
      ) : null}
      <div className="list-h">
        <span>subscriptions · {sources.length}</span>
        <span>
          {sources.filter((source) => source.in_blogroll).length} in blogroll
        </span>
      </div>
      {sources.length ? (
        <>
          <ul className="feeds" aria-label="subscriptions">
            {sources.map((source) => (
              <SubscriptionRow
                key={source.id}
                source={source}
                count={counts?.subscriptions[source.id]}
                onInspect={() => setInspect(source.id)}
                onToggle={() => void toggle(source)}
              />
            ))}
          </ul>
          <p className="hint sources-hint">
            Swipe a source ← for its info, → to pause or resume. Or tap ⓘ.
          </p>
        </>
      ) : (
        <div className="empty">
          <span className="em" aria-hidden="true">
            ◫
          </span>
          No subscriptions yet — tap ＋ to subscribe to a blyg or a feed.
        </div>
      )}
      <Inspector
        source={inspected}
        count={inspected ? counts?.subscriptions[inspected.id] : undefined}
        onClose={() => setInspect(undefined)}
        actions={actions}
      />
      <SubscribeSheet open={adding} onClose={() => setAdding(false)} />
    </>
  );
}

/* ---------------- timelines ---------------- */

function TimelineHead({
  title,
  count,
  children,
}: {
  title: string;
  count: number | undefined;
  children?: ReactNode;
}) {
  const lensSearch = useLensSearch();
  return (
    <>
      <Link className="back-link" to="/reading" search={{ ...lensSearch }}>
        ← sources
      </Link>
      <div className="view-head">
        <h2 className="view-h">
          {title}
          {count !== undefined ? <small>{count} items</small> : null}
        </h2>
        {children}
      </div>
    </>
  );
}
function Timeline({ sub, offset }: { sub: string; offset: number }) {
  const lensSearch = useLensSearch();
  useChrome({ framed: false, wide: false });
  const actions = useReadingActions();
  const [inspecting, setInspecting] = useState(false);
  const key = readingKey(sub, useContext(LensContext));
  const entries = useLiveQuery(readingView(key, offset));
  const sources =
    useLiveQuery({ query: (q) => q.from({ source: subscriptions }) }).data ??
    [];
  const refresh = useMemo(
    () => () => refreshReading(key, offset),
    [key, offset],
  );
  usePoll(`reading:${key}:${offset}`, refresh);
  usePoll('subscriptions', subscriptions.utils.refetch);
  usePoll('hoppers', hoppers.utils.refetch);
  usePoll('signals', signals.utils.refetch);
  const metadata = readingMeta(key, offset);
  const selected = sources.find((source) => source.id === sub);
  const title =
    sub === 'all'
      ? 'all'
      : sub === 'own'
        ? 'my blyg'
        : selected
          ? sourceName(selected)
          : 'all';
  return (
    <>
      <TimelineHead title={title} count={metadata?.total}>
        {selected ? (
          <Button
            className="icon-btn"
            aria-label="about this source"
            onClick={() => setInspecting(true)}
          >
            ⓘ
          </Button>
        ) : null}
      </TimelineHead>
      <LensBar sub={sub} />
      <Failure error={actions.error} />
      {selected?.status === 'paused' ? (
        <div className="banner banner-warn" role="note">
          <span className="mark" aria-hidden="true">
            ‖
          </span>
          <div className="body">Paused — not polled until you resume it.</div>
        </div>
      ) : null}
      {entries.isLoading ? <p className="view-sub">Loading reading…</p> : null}
      <EntryList entries={entries.data ?? []} actions={actions} />
      {!entries.isLoading && !entries.data?.length ? (
        <div className="empty">
          <span className="em" aria-hidden="true">
            ◫
          </span>
          No items yet.
        </div>
      ) : null}
      <Pager
        offset={offset}
        total={metadata?.total}
        go={(next) =>
          void actions.navigate({
            to: '/reading',
            search: { sub, offset: next, ...lensSearch },
          })
        }
      />
      <Inspector
        source={inspecting ? selected : undefined}
        count={metadata?.total}
        onClose={() => setInspecting(false)}
        actions={actions}
        onDeleted={() =>
          void actions.navigate({ to: '/reading', search: {} })
        }
      />
    </>
  );
}
/** A hopper member as a reading entry, so it gets every entry action. */
function hopperEntry(
  item: ImportedItem,
  source: Subscription | undefined,
  rank: number,
): Reading {
  const withdrawn = item.state === 'tombstone';
  const displayAt =
    item.updated && Date.parse(item.updated) < Date.parse(item.observed_at)
      ? item.updated
      : item.observed_at;
  return {
    key: `imported:${JSON.stringify([item.subscription_id, item.remote_id])}`,
    source: 'imported',
    kind: item.kind,
    withdrawn,
    l0: item.l0,
    contentHtml: item.content_html,
    displayAt,
    rank,
    imported: {
      subscriptionId: item.subscription_id,
      subscriptionTitle: source ? sourceName(source) : item.subscription_id,
      remoteId: item.remote_id,
      kind: item.kind,
      withdrawn,
      l0: item.l0,
      updated: item.updated,
      observedAt: item.observed_at,
      contentHtml: item.content_html,
      pinnedVersionRetained: item.pinned_version_retained,
      sourceUrl: source
        ? sourceTitleAndUrl({ ...item, l0: item.l0 ? 1 : 0 }, source.origin)
            .url
        : null,
    },
  };
}
function HopperTimeline({ id, offset }: { id: string; offset: number }) {
  const lensSearch = useLensSearch();
  useChrome({ framed: false, wide: false });
  const actions = useReadingActions();
  const collection = useMemo(() => hopperDetail(id), [id]);
  usePoll(`hopper:${id}`, collection.utils.refetch);
  usePoll('signals', signals.utils.refetch);
  usePoll('hoppers', hoppers.utils.refetch);
  const row = useLiveQuery({ query: (q) => q.from({ hopper: collection }) })
    .data?.[0];
  const sources =
    useLiveQuery({ query: (q) => q.from({ source: subscriptions }) }).data ??
    [];
  const kind = lensKind(useContext(LensContext));
  const entries = useMemo(
    () =>
      (row?.items ?? [])
        .filter((item) => !kind || item.kind === kind)
        .map((item, i) =>
          hopperEntry(
            item,
            sources.find((source) => source.id === item.subscription_id),
            i,
          ),
        ),
    [row, sources, kind],
  );
  if (!row) return <p className="view-sub">Loading hopper…</p>;
  const start = offset < entries.length ? offset : 0;
  return (
    <>
      <TimelineHead title={row.hopper.name} count={kind ? entries.length : row.total}>
        <Link
          className="btn btn-ghost btn-mini"
          to="/hoppers/$id"
          params={{ id }}
        >
          manage
        </Link>
      </TimelineHead>
      <LensBar hopper={id} />
      <Failure error={actions.error} />
      <EntryList
        entries={entries.slice(start, start + PAGE)}
        actions={actions}
      />
      {!entries.length ? (
        <div className="empty">
          <span className="em" aria-hidden="true">
            ▤
          </span>
          No items yet.
        </div>
      ) : (
        <Pager
          offset={start}
          total={entries.length}
          go={(next) =>
            void actions.navigate({
              to: '/reading',
              search: { hopper: id, offset: next, ...lensSearch },
            })
          }
        />
      )}
    </>
  );
}

export function ReadingPage({
  sub,
  hopper,
  offset,
  lens = 'all',
}: {
  sub?: string;
  hopper?: string;
  offset?: number;
  lens?: Lens;
}) {
  return (
    <LensContext.Provider value={lens}>
      <ReadingScreen sub={sub} hopper={hopper} offset={offset} lens={lens} />
    </LensContext.Provider>
  );
}
function ReadingScreen({ sub, hopper, offset, lens }: { sub?: string; hopper?: string; offset?: number; lens: Lens }) {
  if (lens === 'background' || lens === 'smart')
    return (
      <>
        <PlaceholderChrome />
        <h2 className="view-h">reading</h2>
        <LensBar sub={sub} hopper={hopper} />
        <LensPlaceholder lens={lens} />
      </>
    );
  if (hopper) return <HopperTimeline id={hopper} offset={offset ?? 0} />;
  if (sub) return <Timeline sub={sub} offset={offset ?? 0} />;
  return <Sources />;
}
function PlaceholderChrome() {
  useChrome({ framed: false, wide: false });
  return null;
}

/* ---------------- imported history (#40) ---------------- */

type ImportedHistory = Awaited<ReturnType<typeof loadHistory>>;
const loadHistory = (sub: string, id: string) =>
  unwrap(BlyggerApi.getImportedHistory({ client, path: { sub, id } }));
const loadVersion = (sub: string, id: string, v: number) =>
  unwrap(BlyggerApi.getImportedVersion({ client, path: { sub, id, v } }));
/**
 * An imported item's history (#40): its notes as a timeline, read from the
 * origin, and "see the change" only between versions the origin serves
 * publicly — adjacent pins, and the last pin against the current version.
 * Unpinned history is withheld at the source; nothing here offers it.
 * Opened and closed from the entry's ⋯ sheet ("history" / "hide history").
 */
function History({ sub, id }: { sub: string; id: string }) {
  const [history, setHistory] = useState<ImportedHistory>();
  const [diff, setDiff] = useState<{ from: number; to: number; ops: DiffOp[] }>();
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const settings = useSettings();
  const when = (iso: string) =>
    iso ? formatDateIn(iso, settings?.timezone || 'UTC') : '';
  useEffect(() => {
    let live = true;
    loadHistory(sub, id).then(
      (loaded) => live && setHistory(loaded),
      (failure) => live && setError(failure),
    );
    return () => {
      live = false;
    };
  }, [sub, id]);
  const compare = async (from: number, to: number) => {
    setBusy(true);
    setError(undefined);
    try {
      const [a, b] = await Promise.all([
        loadVersion(sub, id, from),
        loadVersion(sub, id, to),
      ]);
      setDiff({ from, to, ops: diffText(a.content_md, b.content_md) });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  // The versions whose text is public, in order: every pin, then the current
  // version unless the item is withdrawn.
  const publicVersions = history
    ? [
        ...new Set([
          ...history.changelog.filter((e) => e.pinned).map((e) => e.version),
          ...(history.withdrawn ? [] : [history.current]),
        ]),
      ].sort((a, b) => a - b)
    : [];
  const previousPublic = (v: number) => {
    const i = publicVersions.indexOf(v);
    return i > 0 ? publicVersions[i - 1] : undefined;
  };
  return (
    <div className="entry-history" aria-label="history">
      <Failure error={error} />
      {history ? (
        <ol className="h-list">
          {history.changelog.map((e) => {
            const prev = previousPublic(e.version);
            return (
              <li className="h-row" key={e.version}>
                <span className="vnum">v{e.version}</span>
                <span className="h-hint">{when(e.at)}</span>
                <span>{e.note ?? <span className="h-hint">(no note)</span>}</span>
                {e.generated ? (
                  <span
                    className="badge tc-chip"
                    title="note drafted by the publisher's studio"
                  >
                    generated
                  </span>
                ) : null}
                {e.pinned ? (
                  <span className="badge badge-pencil tc-chip">📌 pinned</span>
                ) : null}
                {prev !== undefined ? (
                  <Button
                    className="more"
                    data-action="see-change"
                    disabled={busy}
                    onClick={() => void compare(prev, e.version)}
                  >
                    see the change v{prev} → v{e.version}
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : !error ? (
        <p className="h-hint">Loading history from the origin…</p>
      ) : null}
      {diff ? (
        <div
          className="entry-diff"
          aria-label={`changes from v${diff.from} to v${diff.to}`}
        >
          <p className="h-hint">
            v{diff.from} → v{diff.to}, as published (markdown source)
          </p>
          <pre>
            {diff.ops.map((op, i) =>
              op.op === 'eq' ? (
                <span key={i}>{op.text}</span>
              ) : op.op === 'del' ? (
                <del key={i}>{op.text}</del>
              ) : (
                <ins key={i}>{op.text}</ins>
              ),
            )}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
