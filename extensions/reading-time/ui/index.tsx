/*
 * reading-time: an estimate at the end of each reading entry's byline.
 * Browser only, one slot. Ships compiled into releases (extensions.json) as a
 * default way to exercise the mechanism; it starts off like every extension.
 */
import type { StudioExtension } from '../../../src/ui/extension-api.ts';
import { formatMinutes, readingTime } from './count.ts';

export const extension: StudioExtension = {
  name: 'reading-time',
  label: 'Reading time',
  description: 'Shows an estimated reading time and word count at the end of each reading entry’s byline.',
  entryByline: ({ context }) => {
    const { words, cjk, minutes } = readingTime(context.entry.contentHtml);
    const label = formatMinutes(minutes);
    if (!label) return null;
    const count = [words ? `${words} words` : '', cjk ? `${cjk} characters` : ''].filter(Boolean).join(', ');
    return (
      <span data-extension="reading-time" title={count}>
        · {label}
      </span>
    );
  },
};
