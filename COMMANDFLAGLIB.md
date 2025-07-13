# Command Flag Library

Eine Sammlung aller verwendeten Commands mit Flags zur Dokumentations-Reorganisation und Projekt-Optimierung.

## 📚 README Enhancement

### 1. Professionelle README-Erstellung
```bash
/analyze --code . --architecture --deps --metrics --uc && /document --readme --enhance "README.md" --sections "hero,quickstart,features,architecture,usage,development,contributing,license" --badges "status,coverage,go-version,license" --visual --examples --persona-mentor --think-hard --uc
```
**Beschreibung**: Analysiert das gesamte Projekt und erstellt eine umfassende, professionelle README mit Hero-Section, Badges, visuellen Diagrammen, Code-Beispielen und allen wichtigen Sections.

## 🚀 Projekt-Initialisierung

### 2. Git Repository initialisieren und dokumentieren
```bash
/git --init --message "Initialize SuperCode project repository" && /git --commit "Complete documentation reorganization" --validate && /document --git --create ".gitignore" --template "go,node,macos" --uc
```
**Beschreibung**: Initialisiert Git-Repo, committet die Reorganisation und erstellt passende .gitignore für Go/Node/macOS.

### 3. SuperCode als Submodule hinzufügen
```bash
/git --submodule add "https://github.com/Kirchlive/SuperCode.git" SuperCode && /git --commit "Add SuperCode as submodule" --validate && /bash "cd SuperCode && make setup"
```
**Beschreibung**: Fügt SuperCode als Git-Submodule hinzu, committet die Änderung und führt Setup im Submodule aus.

## 📁 Dokumentations-Organisation

### 4. Verzeichnis-Erstellung und Datei-Migration
```bash
/git --checkpoint "before-docs-creation" && /migrate --files "COMMANDS.md CHANGELOG.md DIAGRAM.md.mermaid" --target "docs/" --create-dir --validate && /document --reference --create "docs/FEATURES.md" --source "STATUS.md PLANNING.md" --consolidate --uc
```
**Beschreibung**: Erstellt docs/ Verzeichnis, verschiebt Referenz-Dokumentation und generiert FEATURES.md aus bestehenden Quellen.

### 5. Umfassende Dokumentations-Reorganisation
```bash
/spawn --task "doc-reorganization" --parallel --specialized --uc
```
**Beschreibung**: Spawnt spezialisierte Agenten für parallele Dokumentations-Reorganisation mit Token-Optimierung.

### 6. Cross-Repository Duplikat-Scanner
```bash
/analyze --code "SuperCode/*.md" --deps --forensic --persona-analyzer --seq --evidence --think-hard && /spawn --task "compare-docs" --parallel --specialized --uc
```
**Beschreibung**: Forensische Analyse aller .md Dateien im SuperCode Repo mit Abhängigkeiten, Evidence-basierter Vergleich und parallelen Agenten.

## 📊 Analyse & Konsolidierung

### 7. Strukturelle Konsolidierungs-Analyse
```bash
/load --scope full --focus documentation --think-hard --uc && /improve --quality "*.md" --consolidate --threshold 60% --plan --uc
```
**Beschreibung**: Lädt gesamten Dokumentations-Kontext und plant Konsolidierung mit 60% Qualitätsschwelle.

### 8. Intelligente Merge-Validierung
```bash
/load --scope full --patterns "**/*.md" --relationships --ultrathink --uc && /improve --quality "TESTING*.md" --refactor --merge --threshold 80% --persona-refactorer --validate --dry-run
```
**Beschreibung**: Analysiert alle Dokumentations-Beziehungen und simuliert Merge von TESTING-Dateien mit 80% Qualitätsschwelle.

### 9. Hierarchische Reorganisation mit Validierung
```bash
/task:create "Reorganize all documentation with validation" && /analyze --architecture . --deep --all-mcp --introspect && /document --maintain --structure --visual --interactive --validate
```
**Beschreibung**: Erstellt Task für komplette Reorganisation mit allen MCP-Servern, visueller Darstellung und interaktiver Validierung.

## 🛠️ Migrations-Commands

### 10. Dokumentations-Migration mit Backup
```bash
/spawn --task "doc-reorganization" --parallel --specialized && /migrate --code "SuperCode/*.md" --config "archive/" --backup --validate --dry-run && /improve --quality "TESTING*.md PERFORMANCE.md" --merge --refactor --threshold 90% --persona-refactorer --uc && /git --checkpoint "before-doc-consolidation" --validate
```
**Beschreibung**: Vollständige Migrations-Pipeline mit Backup, Dry-Run, Merge-Operationen und Git-Checkpoint.

## 🔍 Spezial-Analyse

### 11. Projekt-Kontext Laden (aus COMMANDS.md)
```bash
/load --scope full --focus documentation --think-hard --uc
```
**Beschreibung**: Lädt vollständigen Projekt-Kontext mit Fokus auf Dokumentation und tiefgehender Analyse.

### 12. Code-Analyse mit Evidence
```bash
/analyze --code --deps --forensic --persona-analyzer --seq --evidence --think-hard --uc
```
**Beschreibung**: Forensische Code-Analyse mit Abhängigkeiten, Sequential Reasoning und Evidence-basierten Empfehlungen.

## 📝 Utility Commands

### 13. Git Checkpoint Creation
```bash
/git --checkpoint "before-doc-consolidation" --validate
```
**Beschreibung**: Erstellt Git-Checkpoint mit Validierung für sicheres Rollback.

### 14. Bash-Commands für Datei-Operationen
```bash
mkdir -p docs
mv COMMANDS.md docs/ && mv CHANGELOG.md docs/ && mv DIAGRAM.md.mermaid docs/
rm -rf SuperCode/cmd/supercode/merge-workspace && rm -rf SuperCode/merge-workspace
```
**Beschreibung**: Direkte Bash-Commands für Verzeichnis-Erstellung, Datei-Verschiebung und Cleanup.

## 🏗️ Projekt-Gesundheit

### 15. Projekt-Gesundheits-Check durchführen
```bash
/analyze --architecture . --health --metrics --persona-architect --uc && /scan --quality --validate --coverage && /improve --quality "SuperCode/" --threshold 85% --plan
```
**Beschreibung**: Analysiert Projekt-Architektur, scannt Code-Qualität und plant Verbesserungen für 85% Qualitätsziel.

### 16. SuperCode Binary bauen und testen
```bash
/build --go "SuperCode/" --test --coverage --validate && /test --unit --integration --coverage --parallel && /document --api --generate "SuperCode/API.md"
```
**Beschreibung**: Baut SuperCode, führt alle Tests aus und generiert API-Dokumentation.

### 17. Finale Bereinigung und Optimierung
```bash
/cleanup --code --deps --conservative --dry-run && /analyze --deps "SuperCode/" --unused --circular && /optimize --size --performance --uc
```
**Beschreibung**: Plant konservative Bereinigung, analysiert Dependencies und optimiert für Größe/Performance.

## 🎯 Best Practices

1. **Immer mit Checkpoint beginnen**: `/git --checkpoint` vor größeren Änderungen
2. **Token-Optimierung nutzen**: `--uc` Flag für große Dokumentations-Operationen
3. **Validierung einbauen**: `--validate` oder `--dry-run` für sichere Ausführung
4. **Parallele Agenten**: `/spawn --parallel` für unabhängige Aufgaben
5. **Threshold setzen**: `--threshold X%` für Qualitätssicherung bei Merges

## 📊 Flag-Übersicht

| Flag | Beschreibung | Verwendung |
|------|-------------|------------|
| `--uc` | UltraCompressed Mode | Token-Reduktion um 70% |
| `--validate` | Validierung | Prüft Erfolg der Operation |
| `--dry-run` | Simulation | Zeigt Änderungen ohne Ausführung |
| `--parallel` | Parallel-Ausführung | Mehrere Agenten gleichzeitig |
| `--threshold X%` | Qualitätsschwelle | Minimum-Qualität für Operationen |
| `--forensic` | Forensische Analyse | Tiefgehende Untersuchung |
| `--evidence` | Evidence-basiert | Belege für Empfehlungen |
| `--think-hard` | Erweiterte Analyse | 10K Token Kontext |
| `--checkpoint` | Git-Sicherungspunkt | Rollback-Möglichkeit |
| `--health` | Gesundheits-Check | Projekt-Zustand analysieren |
| `--metrics` | Metriken-Erfassung | Messbare Ergebnisse |
| `--enhance` | Verbesserung | Erweitert bestehende Dateien |
| `--sections` | Abschnitte | Definiert Dokument-Struktur |
| `--badges` | Badges | Fügt Status-Badges hinzu |
| `--visual` | Visuell | Erstellt Diagramme |

---
*Erstellt während der SuperCode Dokumentations-Reorganisation*