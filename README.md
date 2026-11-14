* {
  box-sizing: border-box;
}

html {
  background: #060b14;
  color: #edf2ff;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background:
    radial-gradient(circle at top left, rgba(168, 85, 247, 0.18), transparent 26%),
    radial-gradient(circle at bottom right, rgba(59, 130, 246, 0.18), transparent 28%),
    linear-gradient(180deg, #070b12 0%, #101827 100%);
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
  padding: 28px 18px 60px;
}

.container {
  max-width: 1500px;
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
  font-size: 12px;
  letter-spacing: 0.18em;
  font-weight: 700;
}

.topbar h1 {
  margin: 6px 0 0;
  font-size: clamp(32px, 3vw, 54px);
}

.header-actions,
.action-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.primary-button,
.secondary-button,
.mini-button {
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

.secondary-button.danger {
  color: #fecaca;
  border-color: rgba(248, 113, 113, 0.26);
}

.mini-button {
  background: rgba(255, 255, 255, 0.06);
  color: white;
  width: 36px;
  height: 36px;
  font-size: 22px;
  line-height: 1;
}

.project-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 22px;
}

.panel {
  background: rgba(15, 23, 42, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 22px 40px rgba(0, 0, 0, 0.18);
}

.sidebar-panel {
  padding: 18px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 20px;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.project-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  width: 100%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px 14px;
  color: white;
  text-align: left;
}

.project-item.selected {
  background: rgba(168, 85, 247, 0.12);
  border-color: rgba(216, 180, 254, 0.4);
}

.project-item strong {
  font-size: 15px;
}

.project-item span {
  color: #cbd5e1;
  font-size: 12px;
}

.editor-panel {
  padding: 20px;
}

.editor-grid {
  display: grid;
  grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
  gap: 20px;
}

.editor-main,
.editor-output {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.field-row {
  display: flex;
  gap: 10px;
}

.field-row.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.field-label {
  color: #dce7ff;
  font-size: 13px;
  font-weight: 600;
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

.range-input {
  width: 100%;
}

.range-meta {
  font-size: 12px;
  color: #cbd5e1;
}

.error-box {
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(248, 113, 113, 0.35);
  color: #fecaca;
  font-size: 14px;
}

.steps {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
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
  background: rgba(168, 85, 247, 0.12);
  border-color: rgba(216, 180, 254, 0.4);
  color: #f5d0fe;
}

.empty-state,
.loading-state,
.empty-landing {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 520px;
  color: #d5def2;
  line-height: 1.8;
}

.empty-landing {
  flex-direction: column;
  gap: 12px;
}

.empty-landing h1 {
  margin: 0;
  font-size: clamp(28px, 4vw, 52px);
}

.empty-landing p {
  margin: 0;
  color: #cbd5e1;
}

.empty-icon {
  font-size: 42px;
  margin-bottom: 10px;
}

.result-stack {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.result-header h2 {
  margin: 10px 0 8px;
  font-size: clamp(28px, 3vw, 42px);
}

.result-kicker {
  margin: 0;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  font-size: 12px;
  color: #d8b4fe;
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
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 12px;
}

.mini-card {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 14px;
  padding: 15px;
}

.card-title {
  color: #f5d0fe;
  font-weight: 700;
  margin-bottom: 8px;
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
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: rgba(15, 23, 42, 0.76);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  padding: 14px;
}

.storyboard-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #e9d5ff;
  font-weight: 600;
}

.shot-textarea {
  min-height: 100px;
}

.shot-textarea.small {
  min-height: 120px;
}

.long-textarea {
  min-height: 150px;
}

@media (max-width: 1100px) {
  .project-layout,
  .editor-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .topbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .field-row.two-col {
    grid-template-columns: 1fr;
  }
}
