# SuperCode - Umsetzungsplan für die nächsten 5 Schritte

*Erstellt: 2025-07-10*

## Übersicht

Dieser Plan adressiert die kritischen technischen Schulden im SuperCode-Projekt und führt es zur Produktionsreife. Die Schritte sind nach Priorität und Abhängigkeiten geordnet.

## 📋 Schritt 1: Import-Zyklus beheben (BLOCKER)

**Zeitrahmen**: 2-4 Stunden  
**Priorität**: KRITISCH  
**Blockiert**: Alle Tests und CI/CD

### Aufgaben:

1. **Neue Type-Package erstellen**
   ```bash
   mkdir -p SuperCode/internal/types
   touch SuperCode/internal/types/transform.go
   ```

2. **Gemeinsame Typen extrahieren**
   ```go
   // internal/types/transform.go
   package types

   type TransformResult struct {
       Files          []GeneratedFile
       PersonaConfigs []PersonaConfig
       Commands       []CommandConfig
       MCPServers     []MCPServerConfig
       Errors         []error
   }

   type GeneratedFile struct {
       Path     string
       Content  string
       FileType string
   }
   ```

3. **Imports aktualisieren**
   - In `internal/generator/generator_test.go`: Import von `types` statt `transformer`
   - In `internal/transformer/`: Import von `types` für gemeinsame Strukturen

4. **Tests verifizieren**
   ```bash
   cd SuperCode
   go test ./internal/generator -v
   go test ./internal/transformer -v
   ```

### Erfolgskriterien:
- ✅ Keine Import-Zyklen mehr
- ✅ Alle Packages kompilieren
- ✅ Tests können ausgeführt werden

---

## 🧪 Schritt 2: Test-Suite reparieren

**Zeitrahmen**: 4-6 Stunden  
**Priorität**: HOCH  
**Abhängigkeit**: Schritt 1 muss abgeschlossen sein

### Aufgaben:

1. **Persona-Detektor Pfade korrigieren**
   ```go
   // internal/analyzer/persona_detector.go
   func (d *PersonaDetector) getPossiblePaths(repoPath string) []string {
       return []string{
           filepath.Join(repoPath, ".claude", "personas"),
           filepath.Join(repoPath, ".claude", "shared", "superclaude-personas.yml"),
           filepath.Join(repoPath, "personas"),  // NEU: Für Testdaten
           // ... weitere Pfade
       }
   }
   ```

2. **Testdaten synchronisieren**
   - Struktur in `testdata/superclaude/` mit Code-Erwartungen abgleichen
   - Fehlende Dateien hinzufügen oder Pfade anpassen

3. **Alle Tests durchlaufen**
   ```bash
   make test
   # Erwartung: 23/23 Tests bestehen
   ```

4. **CI/CD Pipeline verifizieren**
   ```bash
   # GitHub Actions lokal testen
   act -j test
   ```

### Erfolgskriterien:
- ✅ 100% der Tests bestehen
- ✅ CI/CD Pipeline läuft grün
- ✅ Testabdeckung messbar (Ziel: >50%)

---

## 🔧 Schritt 3: Fehlende Commands implementieren

**Zeitrahmen**: 1-2 Tage  
**Priorität**: MITTEL  
**Abhängigkeit**: Tests sollten laufen (Schritt 2)

### Aufgaben:

1. **Init Command implementieren**
   ```go
   // cmd/supercode/main.go - initCmd
   Run: func(cmd *cobra.Command, args []string) error {
       // 1. Konfigurationsverzeichnis erstellen
       // 2. Default-Konfiguration schreiben
       // 3. Repository-URLs konfigurieren
       // 4. Erfolgsmeldung ausgeben
   }
   ```

2. **Detect Command implementieren**
   ```go
   // cmd/supercode/main.go - detectCmd
   Run: func(cmd *cobra.Command, args []string) error {
       // 1. Analyzer initialisieren
       // 2. Features erkennen
       // 3. Detaillierte Ausgabe generieren
       // 4. Optional: JSON/YAML Export
   }
   ```

3. **Compression Feature Transformation**
   ```go
   // internal/transformer/compression_transformer.go
   type CompressionTransformer struct{}
   
   func (t *CompressionTransformer) Transform(features []CompressionFeature) ([]GeneratedFile, error) {
       // UltraCompressed Mode → Text Preprocessor
       // Token-Reduction → Minification Plugin
   }
   ```

4. **TODOs in Transformer entfernen**
   - Command Logic Implementation
   - MCP Server Methods
   - Error Recovery

### Erfolgskriterien:
- ✅ `supercode init` funktioniert
- ✅ `supercode detect` zeigt alle Features
- ✅ Compression wird transformiert
- ✅ Keine TODO-Comments mehr

---

## 📊 Schritt 4: Logging & Error Handling verbessern

**Zeitrahmen**: 2-3 Tage  
**Priorität**: MITTEL  
**Abhängigkeit**: Grundfunktionalität sollte stabil sein

### Aufgaben:

1. **Strukturiertes Logging einführen**
   ```bash
   go get github.com/rs/zerolog
   ```

   ```go
   // internal/logger/logger.go
   package logger

   var Log zerolog.Logger

   func Init(level string) {
       // Konfiguriere zerolog mit:
       // - Log Level (debug, info, warn, error)
       // - Formatierung (JSON oder Console)
       // - Zeitstempel
   }
   ```

2. **Logging in allen Packages**
   ```go
   // Ersetze fmt.Println und log.Printf
   logger.Log.Info().
       Str("package", "analyzer").
       Int("personas", len(personas)).
       Msg("Detected personas")
   ```

3. **Error Handling vereinheitlichen**
   ```go
   // internal/errors/errors.go
   type MergerError struct {
       Op   string // Operation
       Kind string // Error type
       Err  error  // Wrapped error
   }
   ```

4. **Silent Errors beheben**
   ```go
   // VORHER:
   files, _ := filepath.Glob(pattern)
   
   // NACHHER:
   files, err := filepath.Glob(pattern)
   if err != nil {
       return fmt.Errorf("glob pattern %s: %w", pattern, err)
   }
   ```

### Erfolgskriterien:
- ✅ Strukturiertes Logging überall
- ✅ Keine ignorierten Errors
- ✅ Hilfreiche Fehlermeldungen
- ✅ Debug-Modus verfügbar

---

## 🚀 Schritt 5: Integration Tests & Performance

**Zeitrahmen**: 3-4 Tage  
**Priorität**: MITTEL-HOCH  
**Abhängigkeit**: Stabile Grundfunktionalität

### Aufgaben:

1. **End-to-End Integration Test**
   ```go
   // tests/e2e/merge_test.go
   func TestCompleteeMergeFlow(t *testing.T) {
       // 1. Temporäre Repos erstellen
       // 2. Merge ausführen
       // 3. Generierte Dateien verifizieren
       // 4. Build testen
       // 5. Cleanup
   }
   ```

2. **Performance Optimierungen**
   ```go
   // Concurrent Detection
   func (a *Analyzer) AnalyzeConcurrent(ctx context.Context) (*DetectionResult, error) {
       var wg sync.WaitGroup
       results := make(chan interface{}, 3)
       
       // Parallel: Personas, Commands, MCP
       wg.Add(3)
       go a.detectPersonas(ctx, &wg, results)
       go a.detectCommands(ctx, &wg, results)
       go a.detectMCP(ctx, &wg, results)
   }
   ```

3. **Repository Caching**
   ```go
   // internal/cache/repo_cache.go
   type RepoCache struct {
       dir string
       ttl time.Duration
   }
   
   func (c *RepoCache) GetOrClone(url string) (string, error) {
       // Check cache age
       // Return cached or clone new
   }
   ```

4. **Benchmarks hinzufügen**
   ```go
   func BenchmarkAnalyzer(b *testing.B) {
       // Benchmark detection speed
   }
   
   func BenchmarkTransformer(b *testing.B) {
       // Benchmark transformation
   }
   ```

5. **Testabdeckung erhöhen**
   ```bash
   # Ziel: >80% Coverage
   go test -coverprofile=coverage.out ./...
   go tool cover -html=coverage.out
   ```

### Erfolgskriterien:
- ✅ E2E Test läuft erfolgreich
- ✅ 50% Performance-Verbesserung
- ✅ Repository-Caching funktioniert
- ✅ Testabdeckung >80%

---

## 📅 Zeitplan Übersicht

| Schritt | Aufgabe | Dauer | Priorität | Status |
|---------|---------|-------|-----------|---------|
| 1 | Import-Zyklus beheben | 2-4h | KRITISCH | 🔴 Offen |
| 2 | Test-Suite reparieren | 4-6h | HOCH | 🔴 Blockiert |
| 3 | Fehlende Commands | 1-2d | MITTEL | 🔴 Blockiert |
| 4 | Logging & Errors | 2-3d | MITTEL | 🔴 Wartend |
| 5 | Integration & Perf | 3-4d | MITTEL-HOCH | 🔴 Wartend |

**Gesamtzeit**: ~7-10 Arbeitstage

## 🎯 Definition of Done

Das Projekt ist produktionsreif wenn:

1. ✅ Alle Tests bestehen (100%)
2. ✅ Testabdeckung >80%
3. ✅ Keine kritischen Issues
4. ✅ Alle Commands implementiert
5. ✅ Performance-Ziele erreicht
6. ✅ Dokumentation aktuell
7. ✅ CI/CD Pipeline grün
8. ✅ Security-Checks bestanden

## 📝 Notizen

- **Parallel möglich**: Schritt 4 kann teilweise parallel zu Schritt 3 erfolgen
- **Frühe Validierung**: Nach jedem Schritt Push zu GitHub und CI/CD prüfen
- **Kommunikation**: Updates in development-log.md dokumentieren
- **Review**: Code Reviews für kritische Änderungen

---

*Dieser Plan führt SuperCode systematisch zur Produktionsreife mit klaren, messbaren Schritten.*