* {
  box-sizing: border-box;
}

html {
  background: #070b13;
  color: #eef2ff;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background:
    radial-gradient(circle at top left, rgba(168, 85, 247, 0.18), transparent 24%),
    radial-gradient(circle at bottom right, rgba(59, 130, 246, 0.12), transparent 26%),
    linear-gradient(180deg, #060b12 0%, #111827 100%);
}

button,
input,
textarea,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

.page-shell {
  min-height: 100vh;
  padding: 32px 20px 60px;
}

.container {
  max-width: 1440px;
  margin: 0 auto;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}

.eyebrow {
  margin: 0;
  color: #d8b4fe;
  font-weight: 700;
  letter-spacing: 0.18em;
  font-size: 12px;
}

.topbar h1 {
  margin: 6px 0 0;
  font-size: clamp(32px, 4vw, 52px);
  line-height: 1.05;
}

.header-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.primary-button,
.secondary-button {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: 0.2s ease;
}

.primary-button {
  width: 100%;
  background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
  color: white;
  font-weight: 700;
  padding: 15px 18px;
  border: none;
}

.primary-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.primary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secondary-button {
  background: rgba(255, 255, 255, 0.04);
  color: #eef2ff;
  padding: 10px 12px;
}

.secondary-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
}

.workspace-grid {
  display: grid;
  grid-template-columns: 380px minmax(0, 1fr);
  gap: 22px;
}

.panel {
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 22px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.18);
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #dfe7ff;
}

.text-input,
.select-box,
.idea-textarea,
.long-textarea,
.shot-textarea {
  width: 100%;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 12px;
  color: #f8fafc;
  padding: 12px 14px;
  outline: none;
}

.text-input:focus,
.select-box:focus,
.idea-textarea:focus,
.long-textarea:focus,
.shot-textarea:focus {
  border-color: rgba(216, 180, 254, 0.8);
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.15);
}

.idea-textarea,
.long-textarea,
.shot-textarea {
  resize: vertical;
}

.idea-textarea {
  min-height: 180px;
}

.two-column-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.range-input {
  width: 100%;
}

.range-meta {
  color: #cbd5e1;
  font-size: 12px;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #cbd5e1;
  font-size: 12px;
  margin-top: 2px;
}

.error-box {
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.12);
  color: #fecaca;
  border: 1px solid rgba(248, 113, 113, 0.35);
  font-size: 14px;
}

.right-panel {
  min-height: 720px;
}

.steps {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
}

.step-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  padding: 8px 12px;
  color: #cbd5e1;
  font-size: 12px;
}

.step-pill.active {
  background: rgba(168, 85, 247, 0.14);
  border-color: rgba(216, 180, 254, 0.35);
  color: #f5d0fe;
}

.empty-state,
.loading-state {
  min-height: 540px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #cbd5e1;
  line-height: 1.8;
  padding: 40px;
}

.empty-icon {
  font-size: 42px;
  margin-bottom: 10px;
}

.result-container {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.result-header h2 {
  margin: 8px 0 10px;
  font-size: clamp(28px, 3.5vw, 42px);
}

.result-kicker {
  margin: 0;
  color: #d8b4fe;
  letter-spacing: 0.15em;
  font-size: 12px;
  text-transform: uppercase;
}

.logline {
  margin: 0;
  color: #dbeafe;
  line-height: 1.7;
}

.section-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-block h3 {
  margin: 0;
  font-size: 20px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.mini-card {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 14px;
  padding: 16px;
}

.card-title {
  color: #f5d0fe;
  font-weight: 700;
  margin-bottom: 10px;
}

.mini-card p {
  margin: 0;
  color: #dbeafe;
  line-height: 1.7;
}

.storyboard-list {
  display: grid;
  gap: 16px;
}

.storyboard-item {
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.storyboard-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #e9d5ff;
  font-weight: 600;
}

.shot-textarea {
  min-height: 92px;
}

.shot-textarea.small {
  min-height: 120px;
}

.long-textarea {
  min-height: 150px;
}

@media (max-width: 980px) {
  .workspace-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .two-column-grid {
    grid-template-columns: 1fr;
  }

  .topbar {
    flex-direction: column;
    align-items: flex-start;
  }
}
