----------------------------- MODULE Studio -----------------------------
EXTENDS Naturals, TLC
CONSTANTS MaxRevision, AcknowledgeLatest, AcknowledgeFailure
Views == {1, 2}
VARIABLES source, applied, installed, attempts, checks, loads
vars == <<source, applied, installed, attempts, checks, loads>>
Blank == [phase |-> "idle", target |-> 0, loaded |-> 0, success |-> FALSE]
Bump(n) == IF n < 3 THEN n + 1 ELSE n
Init == /\ source = 0 /\ applied = [v \in Views |-> 0]
        /\ installed = [v \in Views |-> 0]
        /\ attempts = [v \in Views |-> Blank] /\ checks = 0 /\ loads = 0
Mutate == /\ source < MaxRevision /\ source' = source + 1
          /\ UNCHANGED <<applied, installed, attempts, checks, loads>>
Poll(v) == /\ attempts[v].phase = "idle"
           /\ attempts' = [attempts EXCEPT ![v].target = source,
                   ![v].phase = IF applied[v] < source THEN "load" ELSE "idle",
                   ![v].success = FALSE]
           /\ checks' = Bump(checks)
           /\ UNCHANGED <<source, applied, installed, loads>>
Load(v) == /\ attempts[v].phase = "load"
           /\ \E r \in attempts[v].target..source :
                 attempts' = [attempts EXCEPT ![v].loaded = r,
                      ![v].phase = "ack", ![v].success = TRUE]
           /\ loads' = Bump(loads)
           /\ UNCHANGED <<source, applied, installed, checks>>
Fail(v) == /\ attempts[v].phase = "load"
           /\ attempts' = [attempts EXCEPT ![v].phase = "ack", ![v].success = FALSE]
           /\ loads' = Bump(loads)
           /\ UNCHANGED <<source, applied, installed, checks>>
Ack(v) == /\ attempts[v].phase = "ack"
          /\ LET x == attempts[v]
             IN /\ installed' = IF x.success THEN [installed EXCEPT ![v] = x.loaded] ELSE installed
                /\ applied' = IF x.success \/ AcknowledgeFailure THEN
                     [applied EXCEPT ![v] = IF AcknowledgeLatest THEN source ELSE x.target]
                     ELSE applied
          /\ attempts' = [attempts EXCEPT ![v].phase = "idle"]
          /\ UNCHANGED <<source, checks, loads>>
Next == Mutate \/ (\E v \in Views : Poll(v) \/ Load(v) \/ Fail(v) \/ Ack(v))
Spec == Init /\ [][Next]_vars
AppliedIsInstalled == \A v \in Views : applied[v] <= installed[v]
InstalledIsSource == \A v \in Views : installed[v] <= source
=============================================================================
