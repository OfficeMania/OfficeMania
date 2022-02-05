build:
	docker build --no-cache --pull -t officemania:latest --target PRODUCTION .

build-dev:
	docker build --no-cache --pull -t officemania:dev --target DEV .

run:
	docker run -d \
  --name=officemania \
  -p 8080:8080 \
  -v ./database.sqlite:/app/database.sqlite \
  --restart unless-stopped \
  officemania:latest

run-dev:
	docker run -d \
  --name=officemania \
  -p 8080:8080 \
  -v ./database.sqlite:/app/database.sqlite \
  --restart unless-stopped \
  officemania:dev

up: build run

up-dev: build-dev run-dev
