-- Run against `mdbs` if you already initialized the DB before beneficiaries existed.
USE mdbs;

CREATE TABLE IF NOT EXISTS beneficiaries (
  id                       VARCHAR(36)  NOT NULL,
  owner_user_id            VARCHAR(36)  NOT NULL,
  beneficiary_account_id VARCHAR(36)  NOT NULL,
  nickname                 VARCHAR(100) NOT NULL,
  created_at               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_beneficiary_owner_account (owner_user_id, beneficiary_account_id),
  INDEX idx_beneficiary_owner (owner_user_id),
  CONSTRAINT fk_beneficiary_owner   FOREIGN KEY (owner_user_id)            REFERENCES users(id),
  CONSTRAINT fk_beneficiary_account FOREIGN KEY (beneficiary_account_id)    REFERENCES accounts(id)
) ENGINE=InnoDB;
