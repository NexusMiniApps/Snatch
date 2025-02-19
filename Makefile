.PHONY: dev clean kill

# Default target
dev:
	tmux new-session -d -s snatch 'npm run dev' \; \
	split-window -h 'npx partykit dev' \; \
	attach \;

# Kill the tmux session
kill:
	tmux kill-session -t snatch || true

# Clean and restart
clean: kill dev

# Help command
help:
	@echo "Available commands:"
	@echo "  make dev    - Start both servers in tmux"
	@echo "  make kill   - Kill the tmux session"
	@echo "  make clean  - Kill and restart servers"
	@echo "  make help   - Show this help message" 