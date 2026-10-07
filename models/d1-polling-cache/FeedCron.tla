---------------------------- MODULE FeedCron ----------------------------
EXTENDS Feed, FiniteSets
CONSTANTS MaxTicks, ServeOnTick, CheckOnTick
VARIABLES ticks, missedTimer
cronVars == <<source, revision, artifact, attempts, regressed, missedCheck,
              checks, renders, triggerWrites, services, ticks, missedTimer>>
CronInit == Init /\ ticks = 0 /\ missedTimer = FALSE
\* Internal HEAD ticks use the same SWR work as readers. An idle/completed
\* slot checks again; an active slot is joined without changing its token.
Tick(c) ==
    /\ ticks < MaxTicks
    /\ ticks' = ticks + 1
    /\ attempts' = IF CheckOnTick /\ attempts[c].phase \in {"idle", "done", "failed"}
                    THEN [attempts EXCEPT ![c] = [Blank EXCEPT !.phase = "check"]]
                    ELSE attempts
    /\ missedTimer' = (missedTimer \/ (~CheckOnTick /\ attempts[c].phase \in {"idle", "done", "failed"}))
    /\ services' = IF ServeOnTick THEN Bump(services) ELSE services
    /\ UNCHANGED <<source, revision, artifact, regressed, missedCheck,
                    checks, renders, triggerWrites>>
CronNext == (Next /\ UNCHANGED <<ticks, missedTimer>>) \/ (\E c \in Clients : Tick(c))
CronSpec == CronInit /\ [][CronNext]_cronVars
\* Cron's internal HEAD adds no external HTTP service.
TimerDoesNotServe == services <= Cardinality(Clients)
TimerSchedulesCheck == ~missedTimer
=============================================================================
