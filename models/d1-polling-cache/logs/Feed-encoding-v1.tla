------------------------------ MODULE Feed ------------------------------
EXTENDS Naturals, TLC
CONSTANTS MaxRevision, GuardPublish, StableRender, GenerationToken,
          RevisionGuard, CompleteTrigger, ConditionalChecks
Clients == {1, 2}
Payload(r) == r % 2
Token(r, p) == IF GenerationToken THEN r ELSE p
VARIABLES source, revision, artifact, attempts, regressed, missedCheck,
          checks, renders, triggerWrites, services
vars == <<source, revision, artifact, attempts, regressed, missedCheck,
          checks, renders, triggerWrites, services>>
Blank == [phase |-> "idle", before |-> 0, commit |-> 0, expected |-> 0,
          a |-> 0, b |-> 0, tries |-> 0, conditional |-> FALSE]
Bump(n) == IF n < 3 THEN n + 1 ELSE n
Init == /\ source = 0 /\ revision = 0
        /\ artifact = [rev |-> 0, commit |-> 0, a |-> 0, b |-> 0, token |-> 0]
        /\ attempts = [c \in Clients |-> Blank]
        /\ regressed = FALSE /\ missedCheck = FALSE
        /\ checks = 0 /\ renders = 0 /\ triggerWrites = 0 /\ services = 0
Mutate == /\ source < MaxRevision /\ source' = source + 1
          /\ revision' = IF CompleteTrigger THEN revision + 1 ELSE revision
          /\ triggerWrites' = IF CompleteTrigger THEN Bump(triggerWrites) ELSE triggerWrites
          /\ UNCHANGED <<artifact, attempts, regressed, missedCheck, checks, renders, services>>
Request(c, conditional) ==
    /\ attempts[c].phase = "idle"
    /\ attempts' = [attempts EXCEPT ![c].phase =
          IF conditional /\ ~ConditionalChecks THEN "done" ELSE "check",
          ![c].conditional = conditional]
    /\ missedCheck' = missedCheck \/ (conditional /\ ~ConditionalChecks)
    /\ services' = Bump(services)
    /\ UNCHANGED <<source, revision, artifact, regressed, checks, renders, triggerWrites>>
Check(c) ==
    /\ attempts[c].phase = "check"
    /\ attempts' = [attempts EXCEPT
          ![c].phase = IF revision = artifact.rev THEN "done" ELSE "readA",
          ![c].before = revision, ![c].commit = source,
          ![c].expected = artifact.token, ![c].tries = @ + 1]
    /\ checks' = Bump(checks)
    /\ renders' = IF revision = artifact.rev THEN renders ELSE Bump(renders)
    /\ UNCHANGED <<source, revision, artifact, regressed, missedCheck, triggerWrites, services>>
ReadA(c) == /\ attempts[c].phase = "readA"
            /\ attempts' = [attempts EXCEPT ![c].a = Payload(source), ![c].phase = "readB"]
            /\ UNCHANGED <<source, revision, artifact, regressed, missedCheck, checks, renders, triggerWrites, services>>
ReadB(c) == /\ attempts[c].phase = "readB"
            /\ attempts' = [attempts EXCEPT ![c].b = Payload(source), ![c].phase = "validate"]
            /\ UNCHANGED <<source, revision, artifact, regressed, missedCheck, checks, renders, triggerWrites, services>>
Validate(c) ==
    /\ attempts[c].phase = "validate"
    /\ attempts' = [attempts EXCEPT ![c].phase =
          IF ~StableRender \/ revision = attempts[c].before THEN "publish" ELSE "failed"]
    /\ UNCHANGED <<source, revision, artifact, regressed, missedCheck, checks, renders, triggerWrites, services>>
Publish(c) ==
    /\ attempts[c].phase = "publish"
    /\ LET x == attempts[c]
           ok == (~GuardPublish \/ x.expected = artifact.token)
                 /\ (~RevisionGuard \/ x.before >= artifact.rev)
       IN /\ artifact' = IF ok THEN
                 [rev |-> x.before, commit |-> x.commit, a |-> x.a, b |-> x.b,
                  token |-> Token(x.before, x.a)] ELSE artifact
          /\ regressed' = regressed \/ (ok /\ x.before < artifact.rev)
          /\ attempts' = [attempts EXCEPT ![c].phase = IF ok THEN "done" ELSE "failed"]
    /\ UNCHANGED <<source, revision, missedCheck, checks, renders, triggerWrites, services>>
Fail(c) == /\ attempts[c].phase \in {"readA", "readB", "validate", "publish"}
           /\ attempts' = [attempts EXCEPT ![c].phase = "failed"]
           /\ UNCHANGED <<source, revision, artifact, regressed, missedCheck, checks, renders, triggerWrites, services>>
Retry(c) == /\ attempts[c].phase = "failed" /\ attempts[c].tries < 2
            /\ attempts' = [attempts EXCEPT ![c].phase = "check"]
            /\ UNCHANGED <<source, revision, artifact, regressed, missedCheck, checks, renders, triggerWrites, services>>
Next == Mutate \/ (\E c \in Clients :
        (\E b \in BOOLEAN : Request(c, b)) \/ Check(c) \/ ReadA(c) \/ ReadB(c)
        \/ Validate(c) \/ Publish(c) \/ Fail(c) \/ Retry(c))
Spec == Init /\ [][Next]_vars
LegalArtifact == artifact.a = Payload(artifact.commit) /\ artifact.b = Payload(artifact.commit)
NoRegression == ~regressed
Triggered == revision = source
ConditionalRevalidation == ~missedCheck
StoredRevisionSound == artifact.rev = artifact.commit
=============================================================================
