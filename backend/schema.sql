-- ============================================================
-- MDBS — PostgreSQL Database Schema (Neon)
-- ============================================================

-- Function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Enums ────────────────────────────────────────────────────
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('CUSTOMER', 'ADMIN', 'BANK_TELLER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE account_type AS ENUM ('SAVINGS', 'CURRENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE account_status AS ENUM ('ACTIVE', 'FROZEN', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'TRANSFER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ── users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID          NOT NULL,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(255)  NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  role          user_role     NOT NULL DEFAULT 'CUSTOMER',
  phone         VARCHAR(20)   NULL,
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- ── accounts ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
  id             UUID             NOT NULL,
  user_id        UUID             NOT NULL,
  account_number VARCHAR(12)      NOT NULL,
  account_type   account_type     NOT NULL,
  balance        NUMERIC(15,2)    NOT NULL DEFAULT 0.00,
  status         account_status   NOT NULL DEFAULT 'ACTIVE',
  created_at     TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_accounts_number UNIQUE (account_number),
  CONSTRAINT fk_accounts_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts (user_id);

CREATE TRIGGER set_timestamp_accounts
BEFORE UPDATE ON accounts
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- ── transactions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id              UUID         NOT NULL,
  reference_id    UUID         NOT NULL,
  from_account_id UUID         NULL,
  to_account_id   UUID         NULL,
  type            transaction_type NOT NULL,
  amount          NUMERIC(15,2) NOT NULL,
  status          transaction_status NOT NULL DEFAULT 'PENDING',
  description     VARCHAR(500) NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_transactions_reference UNIQUE (reference_id),
  CONSTRAINT fk_transactions_from FOREIGN KEY (from_account_id) REFERENCES accounts(id),
  CONSTRAINT fk_transactions_to   FOREIGN KEY (to_account_id)   REFERENCES accounts(id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_from_account ON transactions (from_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_account ON transactions (to_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions (created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions (status);

CREATE TRIGGER set_timestamp_transactions
BEFORE UPDATE ON transactions
FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- ── audit_logs ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID         NOT NULL,
  user_id     UUID         NULL,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50)  NOT NULL,
  entity_id   UUID         NOT NULL,
  ip_address  VARCHAR(45)  NULL,
  meta        JSONB        NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs (created_at);

-- ── beneficiaries ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS beneficiaries (
  id                       UUID         NOT NULL,
  owner_user_id            UUID         NOT NULL,
  beneficiary_account_id UUID         NOT NULL,
  nickname                 VARCHAR(100) NOT NULL,
  created_at               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uq_beneficiary_owner_account UNIQUE (owner_user_id, beneficiary_account_id),
  CONSTRAINT fk_beneficiary_owner   FOREIGN KEY (owner_user_id)            REFERENCES users(id),
  CONSTRAINT fk_beneficiary_account FOREIGN KEY (beneficiary_account_id)    REFERENCES accounts(id)
);

CREATE INDEX IF NOT EXISTS idx_beneficiary_owner ON beneficiaries (owner_user_id);
