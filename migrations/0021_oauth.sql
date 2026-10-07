-- Better Auth 1.7.7: SQL from its native migration API.
create table "user" ("id" text not null primary key, "name" text not null, "email" text not null unique, "emailVerified" integer not null, "image" text, "createdAt" date not null, "updatedAt" date not null);

create table "session" ("id" text not null primary key, "expiresAt" date not null, "token" text not null unique, "createdAt" date not null, "updatedAt" date not null, "ipAddress" text, "userAgent" text, "userId" text not null references "user" ("id") on delete cascade);

create table "account" ("id" text not null primary key, "accountId" text not null, "providerId" text not null, "userId" text not null references "user" ("id") on delete cascade, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" date, "refreshTokenExpiresAt" date, "scope" text, "password" text, "createdAt" date not null, "updatedAt" date not null);

create table "verification" ("id" text not null primary key, "identifier" text not null, "value" text not null, "expiresAt" date not null, "createdAt" date not null, "updatedAt" date not null);

create table "jwks" ("id" text not null primary key, "publicKey" text not null, "privateKey" text not null, "createdAt" date not null, "expiresAt" date, "alg" text, "crv" text);

create table "oauthClient" ("id" text not null primary key, "clientId" text not null unique, "clientSecret" text, "clientDiscoveryId" text, "disabled" integer, "skipConsent" integer, "enableEndSession" integer, "subjectType" text, "scopes" text, "clientCredentialsScopes" text, "userId" text references "user" ("id") on delete cascade, "createdAt" date, "updatedAt" date, "name" text, "uri" text, "icon" text, "contacts" text, "tos" text, "policy" text, "softwareId" text, "softwareVersion" text, "softwareStatement" text, "redirectUris" text not null, "postLogoutRedirectUris" text, "backchannelLogoutUri" text, "backchannelLogoutSessionRequired" integer, "tokenEndpointAuthMethod" text, "applicationType" text, "jwks" text, "jwksUri" text, "grantTypes" text, "responseTypes" text, "requirePKCE" integer, "dpopBoundAccessTokens" integer, "referenceId" text, "metadata" text);

create table "oauthResource" ("id" text not null primary key, "identifier" text not null unique, "name" text not null, "accessTokenTtl" integer, "refreshTokenTtl" integer, "signingAlgorithm" text, "signingKeyId" text, "allowedScopes" text, "customClaims" text, "dpopBoundAccessTokensRequired" integer, "disabled" integer, "createdAt" date, "updatedAt" date, "policyVersion" integer, "metadata" text);

create table "oauthClientResource" ("id" text not null primary key, "clientId" text not null references "oauthClient" ("clientId") on delete cascade, "resourceId" text not null references "oauthResource" ("identifier") on delete cascade, "metadata" text, "createdAt" date);

create table "oauthRefreshToken" ("id" text not null primary key, "token" text not null unique, "clientId" text not null references "oauthClient" ("clientId") on delete cascade, "sessionId" text references "session" ("id") on delete set null, "userId" text not null references "user" ("id") on delete cascade, "referenceId" text, "authorizationCodeId" text, "resources" text, "requestedUserInfoClaims" text, "expiresAt" date not null, "createdAt" date not null, "revoked" date, "rotatedAt" date, "rotationReplayResponse" text, "rotationReplayExpiresAt" date, "authTime" date, "confirmation" text, "scopes" text not null);

create table "oauthAccessToken" ("id" text not null primary key, "token" text not null unique, "clientId" text not null references "oauthClient" ("clientId") on delete cascade, "sessionId" text references "session" ("id") on delete set null, "userId" text references "user" ("id") on delete cascade, "referenceId" text, "authorizationCodeId" text, "resources" text, "requestedUserInfoClaims" text, "refreshId" text references "oauthRefreshToken" ("id") on delete cascade, "expiresAt" date not null, "createdAt" date not null, "revoked" date, "confirmation" text, "scopes" text not null);

create table "oauthConsent" ("id" text not null primary key, "clientId" text not null references "oauthClient" ("clientId") on delete cascade, "userId" text references "user" ("id") on delete cascade, "referenceId" text, "resources" text, "requestedUserInfoClaims" text, "scopes" text not null, "createdAt" date not null, "updatedAt" date not null);

create table "oauthClientAssertion" ("id" text not null primary key, "expiresAt" date not null);

create index "session_userId_idx" on "session" ("userId");

create index "account_userId_idx" on "account" ("userId");

create index "verification_identifier_idx" on "verification" ("identifier");

create index "oauthClient_userId_idx" on "oauthClient" ("userId");

create index "oauthClientResource_clientId_idx" on "oauthClientResource" ("clientId");

create index "oauthClientResource_resourceId_idx" on "oauthClientResource" ("resourceId");

create index "oauthRefreshToken_clientId_idx" on "oauthRefreshToken" ("clientId");

create index "oauthRefreshToken_sessionId_idx" on "oauthRefreshToken" ("sessionId");

create index "oauthRefreshToken_userId_idx" on "oauthRefreshToken" ("userId");

create index "oauthRefreshToken_authorizationCodeId_idx" on "oauthRefreshToken" ("authorizationCodeId");

create index "oauthAccessToken_clientId_idx" on "oauthAccessToken" ("clientId");

create index "oauthAccessToken_sessionId_idx" on "oauthAccessToken" ("sessionId");

create index "oauthAccessToken_userId_idx" on "oauthAccessToken" ("userId");

create index "oauthAccessToken_authorizationCodeId_idx" on "oauthAccessToken" ("authorizationCodeId");

create index "oauthAccessToken_refreshId_idx" on "oauthAccessToken" ("refreshId");

create index "oauthConsent_clientId_idx" on "oauthConsent" ("clientId");

create index "oauthConsent_userId_idx" on "oauthConsent" ("userId");

create unique index "oauthClientResource_clientId_resourceId_uidx" on "oauthClientResource" ("clientId", "resourceId");
-- Owner grant generation, immediate revocation, and bounded consent records.
CREATE TABLE oauth_records (key TEXT PRIMARY KEY,value TEXT NOT NULL,expires INTEGER);
CREATE INDEX oauth_records_expiry ON oauth_records(expires) WHERE expires IS NOT NULL;
CREATE TABLE oauth_revocations (grant_id TEXT PRIMARY KEY);
CREATE TABLE oauth_state (id INTEGER PRIMARY KEY CHECK(id=1),epoch INTEGER NOT NULL,secret_version TEXT);
INSERT INTO oauth_state(id,epoch) VALUES(1,0);
CREATE TABLE oauth_authorizations (grant_id TEXT PRIMARY KEY,client_id TEXT NOT NULL,name TEXT NOT NULL,manual INTEGER NOT NULL,resource TEXT NOT NULL,scopes TEXT NOT NULL,created INTEGER NOT NULL,expires INTEGER NOT NULL,version TEXT NOT NULL);
CREATE INDEX oauth_authorizations_version ON oauth_authorizations(version);
-- Native Better Auth database rate limiting. Unique creation and guarded
-- increments share a request budget across Worker isolates.
CREATE TABLE "rateLimit" ("id" TEXT NOT NULL PRIMARY KEY, "key" TEXT NOT NULL UNIQUE, "count" INTEGER NOT NULL, "lastRequest" BIGINT NOT NULL);

CREATE INDEX oauth_authorizations_client ON oauth_authorizations(client_id);
