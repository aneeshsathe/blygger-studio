// "Resync all feeds" (0.29): every subscription that is not paused is polled
// now, degraded ones included, whatever their backoff says.
import { env } from "cloudflare:test";
import { expect, it } from "vitest";
import { pollAll } from "../../src/importer/schedule.ts";
import { createSubscription, getSubscription, setSubscriptionStatus } from "../../src/importer/store.ts";
import { makeFixtureFetch } from "./fixtures.ts";

const feed = (n: string) => `https://pollall-${n}.example/rss.xml`;
const rss = `<?xml version="1.0"?><rss version="2.0"><channel><title>t</title><link>https://x.example/</link><description>d</description></channel></rss>`;

it("polls active and degraded subscriptions now, and leaves paused ones alone", async () => {
  await env.DB.prepare("DELETE FROM subscriptions").run();
  const active = await createSubscription(env.DB, { kind: "rss", origin: feed("a"), feedUrl: feed("a"), title: "a" });
  const degraded = await createSubscription(env.DB, { kind: "rss", origin: feed("d"), feedUrl: feed("d"), title: "d" });
  const paused = await createSubscription(env.DB, { kind: "rss", origin: feed("p"), feedUrl: feed("p"), title: "p" });
  // Degraded a moment ago: the cron's backoff would not poll it for hours.
  await env.DB.prepare("UPDATE subscriptions SET status = 'degraded', fail_count = 7, last_poll_at = ? WHERE id = ?").bind(new Date().toISOString(), degraded.id).run();
  await setSubscriptionStatus(env.DB, paused.id, "paused");
  const { fetch, calls } = makeFixtureFetch({ [feed("a")]: { body: rss }, [feed("d")]: { body: rss }, [feed("p")]: { body: rss } });
  expect(await pollAll(env.DB, fetch)).toBe(2);
  expect(calls.sort()).toEqual([feed("a"), feed("d")]);
  // A clean poll is what recovers a degraded subscription.
  expect(await getSubscription(env.DB, degraded.id)).toMatchObject({ status: "active", fail_count: 0 });
  expect((await getSubscription(env.DB, active.id))!.last_poll_at).not.toBeNull();
});
