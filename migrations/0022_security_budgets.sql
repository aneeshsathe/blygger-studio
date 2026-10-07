-- Shared admission counters and transient anonymous-registration reservations.
CREATE TABLE security_budgets (
  key TEXT PRIMARY KEY,
  window INTEGER NOT NULL,
  used INTEGER NOT NULL
);
CREATE TABLE security_registrations (
  id TEXT PRIMARY KEY,
  expires INTEGER NOT NULL
);
CREATE INDEX security_registrations_expires ON security_registrations(expires);
