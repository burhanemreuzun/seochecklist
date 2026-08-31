-- SEO Checklist veritabani semasi (MySQL 8+)
-- Karakter seti: Turkce icerik icin utf8mb4 zorunlu.

CREATE TABLE IF NOT EXISTS categories (
  `key`   VARCHAR(32)  NOT NULL PRIMARY KEY,
  label   VARCHAR(128) NOT NULL,
  icon    VARCHAR(16)  NULL,
  sort    INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS checklist_items (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  code         VARCHAR(16)  NOT NULL UNIQUE,
  category_key VARCHAR(32)  NOT NULL,
  label        VARCHAR(255) NOT NULL,
  why          TEXT         NULL,
  how          TEXT         NULL,
  severity     ENUM('critical','high','medium') NOT NULL DEFAULT 'medium',
  weight       INT          NOT NULL DEFAULT 1,
  mode         ENUM('rule','ai','manual')       NOT NULL DEFAULT 'manual',
  sort         INT          NOT NULL DEFAULT 0,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  CONSTRAINT fk_item_category FOREIGN KEY (category_key)
    REFERENCES categories(`key`) ON UPDATE CASCADE ON DELETE RESTRICT,
  INDEX idx_item_category (category_key, sort)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Denetlenen her yazi bir "post" kaydidir.
CREATE TABLE IF NOT EXISTS posts (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  url           VARCHAR(768) NULL,
  focus_keyword VARCHAR(160) NULL,
  editor        VARCHAR(120) NULL,
  status        ENUM('draft','review','published') NOT NULL DEFAULT 'draft',
  notes         TEXT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_post_status (status, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Editorun elle isaretledigi kutucuklar.
CREATE TABLE IF NOT EXISTS post_checks (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  post_id    INT NOT NULL,
  item_code  VARCHAR(16) NOT NULL,
  is_checked TINYINT(1) NOT NULL DEFAULT 0,
  note       TEXT NULL,
  checked_by VARCHAR(120) NULL,
  checked_at DATETIME NULL,
  UNIQUE KEY uq_post_item (post_id, item_code),
  CONSTRAINT fk_check_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_check_item FOREIGN KEY (item_code) REFERENCES checklist_items(code)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- "Kontrol et" calistirildiginda uretilen denetim kaydi.
CREATE TABLE IF NOT EXISTS audits (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  post_id      INT NULL,
  url          VARCHAR(768) NOT NULL,
  focus_keyword VARCHAR(160) NULL,
  score        INT NOT NULL DEFAULT 0,
  pass_count   INT NOT NULL DEFAULT 0,
  warn_count   INT NOT NULL DEFAULT 0,
  fail_count   INT NOT NULL DEFAULT 0,
  ai_used      TINYINT(1) NOT NULL DEFAULT 0,
  duration_ms  INT NULL,
  error        TEXT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE SET NULL,
  INDEX idx_audit_post (post_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Denetimin madde bazindaki sonuclari.
CREATE TABLE IF NOT EXISTS audit_findings (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  audit_id   INT NOT NULL,
  item_code  VARCHAR(16) NOT NULL,
  status     ENUM('pass','warn','fail','skip') NOT NULL,
  source     ENUM('rule','ai') NOT NULL,
  message    TEXT NULL,
  evidence   TEXT NULL,
  CONSTRAINT fk_finding_audit FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE,
  INDEX idx_finding_audit (audit_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
