# Build the image
docker build -t myrss-server .

# Run the container
# Note: You will likely need to provide your environment variables via --env-file or -e
docker run -p 5000:5000 --env-file .env myrss-server


pm2 start ecosystem.config.js
