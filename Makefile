SHELL := /bin/sh

.PHONY: help install dev build preview check clean fresh

help:
	@echo "retrocycles make targets"
	@echo ""
	@echo "  make install   install npm dependencies"
	@echo "  make dev       run next dev server"
	@echo "  make build     create production build"
	@echo "  make preview   run next production server"
	@echo "  make check     run fast build-style checks"
	@echo "  make clean     remove next build output"
	@echo "  make fresh     clean + reinstall dependencies"

install:
	npm install

dev:
	npm run dev

build:
	npm run build

preview:
	npm run start

check:
	npm run check

clean:
	rm -rf .next

fresh: clean
	rm -rf node_modules package-lock.json
	npm install
