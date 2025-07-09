package downloader

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
)

// Downloader handles downloading and managing repositories
type Downloader struct {
	SuperClaudeRepo string
	OpenCodeRepo    string
	TargetDir       string
	verbose         bool
}

// NewDownloader creates a new Downloader instance
func NewDownloader(targetDir string, verbose bool) *Downloader {
	return &Downloader{
		SuperClaudeRepo: "https://github.com/NomenAK/SuperClaude.git",
		OpenCodeRepo:    "https://github.com/sst/opencode.git",
		TargetDir:       targetDir,
		verbose:         verbose,
	}
}

// DownloadAll downloads both SuperClaude and OpenCode repositories
func (d *Downloader) DownloadAll() error {
	// Create target directory
	if err := os.MkdirAll(d.TargetDir, 0755); err != nil {
		return fmt.Errorf("failed to create target directory: %w", err)
	}

	// Download SuperClaude
	if err := d.downloadRepo("SuperClaude", d.SuperClaudeRepo); err != nil {
		return fmt.Errorf("failed to download SuperClaude: %w", err)
	}

	// Download OpenCode
	if err := d.downloadRepo("OpenCode", d.OpenCodeRepo); err != nil {
		return fmt.Errorf("failed to download OpenCode: %w", err)
	}

	return nil
}

// downloadRepo clones or updates a repository
func (d *Downloader) downloadRepo(name, url string) error {
	repoPath := filepath.Join(d.TargetDir, name)

	// Check if directory exists
	if _, err := os.Stat(repoPath); err == nil {
		// Repository exists, update it
		if d.verbose {
			fmt.Printf("Updating %s repository...\n", name)
		}
		return d.updateRepo(repoPath)
	}

	// Clone new repository
	if d.verbose {
		fmt.Printf("Cloning %s repository from %s...\n", name, url)
	}

	_, err := git.PlainClone(repoPath, false, &git.CloneOptions{
		URL:      url,
		Progress: os.Stdout,
		Depth:    1, // Shallow clone for efficiency
	})

	if err != nil {
		return fmt.Errorf("failed to clone %s: %w", name, err)
	}

	return nil
}

// updateRepo pulls latest changes from a repository
func (d *Downloader) updateRepo(repoPath string) error {
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		return fmt.Errorf("failed to open repository: %w", err)
	}

	worktree, err := repo.Worktree()
	if err != nil {
		return fmt.Errorf("failed to get worktree: %w", err)
	}

	// Pull latest changes
	err = worktree.Pull(&git.PullOptions{
		RemoteName: "origin",
		Progress:   os.Stdout,
	})

	if err != nil && err != git.NoErrAlreadyUpToDate {
		return fmt.Errorf("failed to pull updates: %w", err)
	}

	return nil
}

// GetLatestTag returns the latest tag for a repository
func (d *Downloader) GetLatestTag(repoName string) (string, error) {
	repoPath := filepath.Join(d.TargetDir, repoName)
	repo, err := git.PlainOpen(repoPath)
	if err != nil {
		return "", fmt.Errorf("failed to open repository: %w", err)
	}

	tags, err := repo.Tags()
	if err != nil {
		return "", fmt.Errorf("failed to get tags: %w", err)
	}

	var latestTag string
	err = tags.ForEach(func(ref *plumbing.Reference) error {
		latestTag = ref.Name().Short()
		return nil
	})

	if err != nil {
		return "", fmt.Errorf("failed to iterate tags: %w", err)
	}

	return latestTag, nil
}

// Clean removes downloaded repositories
func (d *Downloader) Clean() error {
	return os.RemoveAll(d.TargetDir)
}