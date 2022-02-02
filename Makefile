build:
	docker build --no-cache --pull -t officemania:latest .

run:
	docker run -d \
  --name=officemania \
  -p 8080:8080 \
  -v ./database.sqlite:/app/database.sqlite \
  --restart unless-stopped \
  officemania:latest
