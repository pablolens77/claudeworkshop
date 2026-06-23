-- Enable RLS on all tables.
-- Prisma connects via the postgres role which bypasses RLS, so the app
-- continues to work. The anon/authenticated Supabase roles get zero access
-- by default (no policies = deny all), protecting against direct API abuse.

ALTER TABLE public."Couple"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."User"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."oauth_accounts"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."sessions"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."verification_tokens"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."InviteCode"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Account"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AccountUser"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Category"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Transaction"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Budget"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Goal"                 ENABLE ROW LEVEL SECURITY;
