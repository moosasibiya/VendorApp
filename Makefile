.PHONY: dev db:migrate db:seed db:reset test

dev:
	docker compose up -d --wait
	pnpm dev

db:migrate:
	pnpm --filter @vendorapp/api run db:migrate

db:seed:
	pnpm --filter @vendorapp/api run db:seed:core

db:reset:
	pnpm --filter @vendorapp/api run db:reset

test:
	docker compose up -d --wait
	pnpm run db:migrate
	pnpm --filter @vendorapp/api run test -- --runInBand
	pnpm --filter @vendorapp/api run test:e2e -- --runInBand
