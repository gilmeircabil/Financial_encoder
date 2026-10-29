import { useEffect, useState } from 'react'
import { AppLogo } from '../../components/ui/AppLogo'
import { Icon } from '../../components/ui/Icon'
import { api } from '../../services/api'
import type { AppInfo, DatabaseStatus } from '../../../electron/types/ipc'

function SettingsAbout(): React.JSX.Element {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null)
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null)

  useEffect(() => {
    let active = true

    api.app
      .getInfo()
      .then((info) => {
        if (active) setAppInfo(info)
      })
      .catch(() => {
        // Fallback gracefully in headless/mock test runs
      })

    api.db
      .getStatus()
      .then((status) => {
        if (active) setDbStatus(status)
      })
      .catch(() => {
        // Fallback gracefully
      })

    return () => {
      active = false
    }
  }, [])

  const version = appInfo?.version || '1.0.13'
  const schemaVer = dbStatus?.schemaVersion ?? 1
  const platform = appInfo?.platform || 'Desktop'
  const electronVer = appInfo?.electron ? `v${appInfo.electron.split('.')[0]}` : 'v44'

  return (
    <div className="about-page-layout">
      {/* 1. Hero Passport Card */}
      <section className="about-hero" aria-label="Application Identity">
        <div className="about-hero__logo">
          <AppLogo size={64} withBackground />
        </div>

        <div className="about-hero__header">
          <h2 className="about-hero__title">Acorn</h2>
          <div className="about-hero__badge" title="Local offline vault active">
            <span className="about-hero__badge-dot" />
            <span>v{version}</span>
          </div>
        </div>

        <p className="about-hero__tagline">
          Offline Financial Operating System &amp; Sovereign Local Vault Ledger
        </p>

        <div className="about-hero__chips">
          <span className="about-hero__chip">
            <Icon name="shield" size={14} />
            100% Offline Vault
          </span>
          <span className="about-hero__chip">
            <Icon name="archive" size={14} />
            Embedded SQLite Engine
          </span>
          <span className="about-hero__chip">
            <Icon name="sparkles" size={14} />
            Zero Cloud Telemetry
          </span>
        </div>
      </section>

      {/* 2. Architecture & System Specs Bento Grid */}
      <section className="about-specs-grid" aria-label="System Specifications">
        <div className="about-spec-card">
          <div className="about-spec-card__head">
            <span className="about-spec-card__label">Creator &amp; Lead</span>
            <span className="about-spec-card__icon">
              <Icon name="sparkles" size={14} />
            </span>
          </div>
          <p className="about-spec-card__value">GilmierDev</p>
          <p className="about-spec-card__detail">Software &amp; AI Developer</p>
        </div>

        <div className="about-spec-card">
          <div className="about-spec-card__head">
            <span className="about-spec-card__label">Data Storage</span>
            <span className="about-spec-card__icon">
              <Icon name="archive" size={14} />
            </span>
          </div>
          <p className="about-spec-card__value">SQLite 3 (WAL)</p>
          <p className="about-spec-card__detail">Schema v{schemaVer} &middot; Local Ledger</p>
        </div>

        <div className="about-spec-card">
          <div className="about-spec-card__head">
            <span className="about-spec-card__label">Runtime Platform</span>
            <span className="about-spec-card__icon">
              <Icon name="monitor" size={14} />
            </span>
          </div>
          <p className="about-spec-card__value">Electron {electronVer}</p>
          <p className="about-spec-card__detail">{platform} &middot; Sandboxed</p>
        </div>

        <div className="about-spec-card">
          <div className="about-spec-card__head">
            <span className="about-spec-card__label">Security Architecture</span>
            <span className="about-spec-card__icon">
              <Icon name="shield" size={14} />
            </span>
          </div>
          <p className="about-spec-card__value">Air-Gapped Vault</p>
          <p className="about-spec-card__detail">Zero Inbound / Outbound Sockets</p>
        </div>
      </section>

      {/* 3. Dual Trust & Compliance Cards */}
      <section className="about-notices-grid" aria-label="Privacy and Legal Notices">
        <div className="about-notice-card">
          <div>
            <div className="about-notice-card__header">
              <div className="about-notice-card__icon-box about-notice-card__icon-box--shield">
                <Icon name="shield" size={18} />
              </div>
              <h3 className="about-notice-card__title">100% Offline Vault Guarantee</h3>
            </div>
            <p className="about-notice-card__body">
              Acorn operates strictly on your local device. No transactions, income figures, receipts,
              or telemetry are ever transmitted or synced to external servers or cloud services.
              Your financial database, document caches, and backups reside exclusively within your
              local workstation storage.
            </p>
          </div>
          <div className="about-notice-card__footer-pill">
            <Icon name="check" size={13} />
            Air-Gapped &middot; Sovereign Storage
          </div>
        </div>

        <div className="about-notice-card">
          <div>
            <div className="about-notice-card__header">
              <div className="about-notice-card__icon-box">
                <Icon name="info" size={18} />
              </div>
              <h3 className="about-notice-card__title">Statutory &amp; Financial Notice</h3>
            </div>
            <p className="about-notice-card__body">
              Acorn is an offline bookkeeping and operational productivity tool for personal and business
              management. It does not provide certified financial, accounting, tax, or legal advice.
              All calculations, margins, and financial reports are generated automatically from user records.
              Users are solely responsible for independent validation for regulatory or tax compliance.
            </p>
          </div>
          <div className="about-notice-card__footer-pill">
            <Icon name="info" size={13} />
            Deterministic Math &middot; User Verified
          </div>
        </div>
      </section>

      {/* 4. Elegant Institutional Footer */}
      <footer className="about-footer">
        <div className="about-footer__brand">
          Acorn &middot; <span>Local Vault Edition</span>
        </div>
        <p className="about-footer__copyright">
          &copy; 2026 GilmierDev. All Rights Reserved.
        </p>
        <p className="about-footer__tagline">
          Designed for sovereign financial privacy, precision, and absolute local data ownership.
        </p>
        <div className="about-footer__meta">
          Release v{version} &middot; Offline Build &middot; Electron {electronVer}
        </div>
      </footer>
    </div>
  )
}

export default SettingsAbout
