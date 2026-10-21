CREATE TABLE laws (
 id text PRIMARY KEY, data jsonb NOT NULL,
 created_date timestamptz NOT NULL DEFAULT now(), updated_date timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE articles (
 id text PRIMARY KEY, law_id text NOT NULL REFERENCES laws(id) ON DELETE CASCADE, data jsonb NOT NULL,
 created_date timestamptz NOT NULL DEFAULT now(), updated_date timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE votes (
 id text PRIMARY KEY, law_id text NOT NULL REFERENCES laws(id) ON DELETE CASCADE,
 created_by_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 choice text NOT NULL CHECK(choice IN ('pour','contre','abstention')),
 created_date timestamptz NOT NULL DEFAULT now(), updated_date timestamptz NOT NULL DEFAULT now(),
 UNIQUE(created_by_id, law_id)
);
CREATE TABLE reforms (
 id text PRIMARY KEY, created_by_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 target_law_id text REFERENCES laws(id) ON DELETE SET NULL, data jsonb NOT NULL,
 status text NOT NULL DEFAULT 'proposée' CHECK(status IN ('proposée','en_debat','transmise','integree')),
 created_date timestamptz NOT NULL DEFAULT now(), updated_date timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE supports (
 id text PRIMARY KEY, reform_id text NOT NULL REFERENCES reforms(id) ON DELETE CASCADE,
 created_by_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 created_date timestamptz NOT NULL DEFAULT now(), updated_date timestamptz NOT NULL DEFAULT now(),
 UNIQUE(created_by_id,reform_id)
);
CREATE TABLE statements (
 id text PRIMARY KEY, reform_id text NOT NULL REFERENCES reforms(id) ON DELETE CASCADE,
 created_by_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 content text NOT NULL CHECK(length(content) BETWEEN 1 AND 200),
 created_date timestamptz NOT NULL DEFAULT now(), updated_date timestamptz NOT NULL DEFAULT now(),
 UNIQUE(id,reform_id)
);
CREATE TABLE stances (
 id text PRIMARY KEY, reform_id text NOT NULL REFERENCES reforms(id) ON DELETE CASCADE,
 statement_id text NOT NULL, created_by_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
 choice text NOT NULL CHECK(choice IN ('accord','mitigé','desaccord')),
 created_date timestamptz NOT NULL DEFAULT now(), updated_date timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(statement_id,reform_id) REFERENCES statements(id,reform_id) ON DELETE CASCADE,
 UNIQUE(created_by_id,statement_id)
);
CREATE INDEX votes_law_idx ON votes(law_id);
CREATE INDEX supports_reform_idx ON supports(reform_id);
CREATE INDEX statements_reform_idx ON statements(reform_id);
CREATE INDEX stances_reform_idx ON stances(reform_id);
CREATE INDEX reforms_created_idx ON reforms(created_date DESC);
CREATE INDEX laws_category_idx ON laws((data->>'category'));
