--------------------------- MODULE StudioQuery ---------------------------
EXTENDS Naturals, TLC
CONSTANTS MaxRevision, CacheLatest, CacheFailure, ReuseAnyCache
Views == {1, 2}
VARIABLES source, label, cached, published, present, attempts, checks, loads, badHit
vars == <<source, label, cached, published, present, attempts, checks, loads, badHit>>
Blank == [phase |-> "idle", target |-> 0, loaded |-> 0, success |-> FALSE]
Bump(n) == IF n < 3 THEN n + 1 ELSE n
Init == /\ source = 0 /\ label = [v \in Views |-> 0]
        /\ cached = [v \in Views |-> 0] /\ published = [v \in Views |-> 0]
        /\ present = [v \in Views |-> FALSE]
        /\ attempts = [v \in Views |-> Blank]
        /\ checks = 0 /\ loads = 0 /\ badHit = FALSE
Mutate == /\ source < MaxRevision /\ source' = source + 1
          /\ UNCHANGED <<label, cached, published, present, attempts, checks, loads, badHit>>
Query(v) == /\ attempts[v].phase = "idle"
            /\ LET hit == present[v] /\ (ReuseAnyCache \/ label[v] = source)
               IN /\ attempts' = [attempts EXCEPT ![v].target = source,
                            ![v].phase = IF hit THEN "idle" ELSE "load",
                            ![v].success = FALSE]
                  /\ badHit' = (badHit \/ (hit /\ cached[v] # source))
            /\ checks' = Bump(checks)
            /\ UNCHANGED <<source, label, cached, published, present, loads>>
Load(v) == /\ attempts[v].phase = "load"
           /\ \E r \in attempts[v].target..source :
                 attempts' = [attempts EXCEPT ![v].loaded = r,
                      ![v].phase = "accept", ![v].success = TRUE]
           /\ loads' = Bump(loads)
           /\ UNCHANGED <<source, label, cached, published, present, checks, badHit>>
Fail(v) == /\ attempts[v].phase = "load"
           /\ attempts' = [attempts EXCEPT ![v].phase = "accept", ![v].success = FALSE]
           /\ loads' = Bump(loads)
           /\ UNCHANGED <<source, label, cached, published, present, checks, badHit>>
Accept(v) == /\ attempts[v].phase = "accept"
             /\ LET x == attempts[v]
                IN /\ cached' = IF x.success THEN [cached EXCEPT ![v] = x.loaded] ELSE cached
                   /\ label' = IF x.success \/ CacheFailure THEN
                        [label EXCEPT ![v] = IF CacheLatest THEN source ELSE x.target]
                        ELSE label
                   /\ present' = IF x.success \/ CacheFailure THEN [present EXCEPT ![v] = TRUE] ELSE present
             /\ attempts' = [attempts EXCEPT ![v].phase = "idle"]
             /\ UNCHANGED <<source, published, checks, loads, badHit>>
Cancel(v) == /\ attempts[v].phase # "idle"
             /\ attempts' = [attempts EXCEPT ![v].phase = "idle"]
             /\ UNCHANGED <<source, label, cached, published, present, checks, loads, badHit>>
Publish(v) == /\ present[v] /\ published[v] < cached[v]
              /\ published' = [published EXCEPT ![v] = cached[v]]
              /\ UNCHANGED <<source, label, cached, present, attempts, checks, loads, badHit>>
Next == Mutate \/ (\E v \in Views : Query(v) \/ Load(v) \/ Fail(v) \/ Accept(v) \/ Cancel(v) \/ Publish(v))
Spec == Init /\ [][Next]_vars
CacheLabelSound == \A v \in Views : present[v] => label[v] <= cached[v]
CachedIsSource == \A v \in Views : cached[v] <= source
PublishedMayLagCache == \A v \in Views : published[v] <= cached[v]
NoStaleHit == ~badHit
=============================================================================
