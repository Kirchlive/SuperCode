







# Command Flag Library





/git --init --message "Initialize SuperCode project repository" && /git --commit      "Complete documentation reorganization" --validate && /document --git --create ".gitignore" --template "go,node,macos" --uc 
Beschreibung: Initialisiert Git-Repo, committet die Reorganisation und erstellt passende .gitignore für Go/Node/macOS.

  2. Projekt-Gesundheits-Check durchführen

  /analyze --architecture . --health --metrics --persona-architect --uc && /scan --quality --validate --coverage && /improve
  --quality "SuperCode/" --threshold 85% --plan
  Beschreibung: Analysiert Projekt-Architektur, scannt Code-Qualität und plant Verbesserungen für 85% Qualitätsziel.

  📋 Alternative Commands:

  3. SuperCode Binary bauen und testen

  /build --go "SuperCode/" --test --coverage --validate && /test --unit --integration --coverage --parallel && /document --api
  --generate "SuperCode/API.md"
  Beschreibung: Baut SuperCode, führt alle Tests aus und generiert API-Dokumentation.

  4. Finale Bereinigung und Optimierung

  /cleanup --code --deps --conservative --dry-run && /analyze --deps "SuperCode/" --unused --circular && /optimize --size
  --performance --uc
  Beschreibung: Plant konservative Bereinigung, analysiert Dependencies und optimiert für Größe/Performance.

  Welchen Command möchtest du als nächstes ausführen?









Eine Sammlung aller verwendeten Commands mit Flags zur Dokumentations-Reorganisation und Projekt-Optimierung.

## =� Dokumentations-Organisation

### 1. Verzeichnis-Erstellung und Datei-Migration
```bash
/git --checkpoint "before-docs-creation" && /migrate --files "COMMANDS.md CHANGELOG.md DIAGRAM.md.mermaid" --target "docs/" --create-dir --validate && /document --reference --create "docs/FEATURES.md" --source "STATUS.md PLANNING.md" --consolidate --uc
```
**Beschreibung**: Erstellt docs/ Verzeichnis, verschiebt Referenz-Dokumentation und generiert FEATURES.md aus bestehenden Quellen.

### 2. Umfassende Dokumentations-Reorganisation
```bash
/spawn --task "doc-reorganization" --parallel --specialized --uc
```
**Beschreibung**: Spawnt spezialisierte Agenten f�r parallele Dokumentations-Reorganisation mit Token-Optimierung.

### 3. Cross-Repository Duplikat-Scanner
```bash
/analyze --code "SuperCode/*.md" --deps --forensic --persona-analyzer --seq --evidence --think-hard && /spawn --task "compare-docs" --parallel --specialized --uc
```
**Beschreibung**: Forensische Analyse aller .md Dateien im SuperCode Repo mit Abh�ngigkeiten, Evidence-basierter Vergleich und parallelen Agenten.

## =� Analyse & Konsolidierung

### 4. Strukturelle Konsolidierungs-Analyse
```bash
/load --scope full --focus documentation --think-hard --uc && /improve --quality "*.md" --consolidate --threshold 60% --plan --uc
```
**Beschreibung**: L�dt gesamten Dokumentations-Kontext und plant Konsolidierung mit 60% Qualit�tsschwelle.

### 5. Intelligente Merge-Validierung
```bash
/load --scope full --patterns "**/*.md" --relationships --ultrathink --uc && /improve --quality "TESTING*.md" --refactor --merge --threshold 80% --persona-refactorer --validate --dry-run
```
**Beschreibung**: Analysiert alle Dokumentations-Beziehungen und simuliert Merge von TESTING-Dateien mit 80% Qualit�tsschwelle.

### 6. Hierarchische Reorganisation mit Validierung
```bash
/task:create "Reorganize all documentation with validation" && /analyze --architecture . --deep --all-mcp --introspect && /document --maintain --structure --visual --interactive --validate
```
**Beschreibung**: Erstellt Task f�r komplette Reorganisation mit allen MCP-Servern, visueller Darstellung und interaktiver Validierung.

## =� Migrations-Commands

### 7. Dokumentations-Migration mit Backup
```bash
/spawn --task "doc-reorganization" --parallel --specialized && /migrate --code "SuperCode/*.md" --config "archive/" --backup --validate --dry-run && /improve --quality "TESTING*.md PERFORMANCE.md" --merge --refactor --threshold 90% --persona-refactorer --uc && /git --checkpoint "before-doc-consolidation" --validate
```
**Beschreibung**: Vollst�ndige Migrations-Pipeline mit Backup, Dry-Run, Merge-Operationen und Git-Checkpoint.

## =
 Spezial-Analyse

### 8. Projekt-Kontext Laden (aus COMMANDS.md)
```bash
/load --scope full --focus documentation --think-hard --uc
```
**Beschreibung**: L�dt vollst�ndigen Projekt-Kontext mit Fokus auf Dokumentation und tiefgehender Analyse.

### 9. Code-Analyse mit Evidence
```bash
/analyze --code --deps --forensic --persona-analyzer --seq --evidence --think-hard --uc
```
**Beschreibung**: Forensische Code-Analyse mit Abh�ngigkeiten, Sequential Reasoning und Evidence-basierten Empfehlungen.

## =� Utility Commands

### 10. Git Checkpoint Creation
```bash
/git --checkpoint "before-doc-consolidation" --validate
```
**Beschreibung**: Erstellt Git-Checkpoint mit Validierung f�r sicheres Rollback.

### 11. Bash-Commands f�r Datei-Operationen
```bash
mkdir -p docs
mv COMMANDS.md docs/ && mv CHANGELOG.md docs/ && mv DIAGRAM.md.mermaid docs/
rm -rf SuperCode/cmd/supercode/merge-workspace && rm -rf SuperCode/merge-workspace
```
**Beschreibung**: Direkte Bash-Commands f�r Verzeichnis-Erstellung, Datei-Verschiebung und Cleanup.

## <� Best Practices

1. **Immer mit Checkpoint beginnen**: `/git --checkpoint` vor gr��eren �nderungen
2. **Token-Optimierung nutzen**: `--uc` Flag f�r gro�e Dokumentations-Operationen
3. **Validierung einbauen**: `--validate` oder `--dry-run` f�r sichere Ausf�hrung
4. **Parallele Agenten**: `/spawn --parallel` f�r unabh�ngige Aufgaben
5. **Threshold setzen**: `--threshold X%` f�r Qualit�tssicherung bei Merges

## =� Flag-�bersicht

| Flag | Beschreibung | Verwendung |
|------|-------------|------------|
| `--uc` | UltraCompressed Mode | Token-Reduktion um 70% |
| `--validate` | Validierung | Pr�ft Erfolg der Operation |
| `--dry-run` | Simulation | Zeigt �nderungen ohne Ausf�hrung |
| `--parallel` | Parallel-Ausf�hrung | Mehrere Agenten gleichzeitig |
| `--threshold X%` | Qualit�tsschwelle | Minimum-Qualit�t f�r Operationen |
| `--forensic` | Forensische Analyse | Tiefgehende Untersuchung |
| `--evidence` | Evidence-basiert | Belege f�r Empfehlungen |
| `--think-hard` | Erweiterte Analyse | 10K Token Kontext |
| `--checkpoint` | Git-Sicherungspunkt | Rollback-M�glichkeit |

---
*Erstellt w�hrend der SuperCode Dokumentations-Reorganisation*