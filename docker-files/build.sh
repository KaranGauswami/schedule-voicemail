pushd ../
docker build -t sv-main:1 -f docker-files/sv-main.Dockerfile .
docker build -t sv-worker:1 -f docker-files/sv-worker.Dockerfile .
popd