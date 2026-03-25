aws ecr describe-repositories

aws ecr create-repository \
    --repository-name dashboard-repo \
    --region us-east-1
aws ecr create-repository \
    --repository-name books-repo \
    --region us-east-1
aws ecr create-repository \
    --repository-name authors-repo \
    --region us-east-1

aws ecr describe-repositories

aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 513410254332.dkr.ecr.us-east-1.amazonaws.com


docker push 513410254332.dkr.ecr.us-east-1.amazonaws.com/dashboard-repo:latest
docker push 513410254332.dkr.ecr.us-east-1.amazonaws.com/books-repo:latest
docker push 513410254332.dkr.ecr.us-east-1.amazonaws.com/authors-repo:latest

aws ecr list-images --repository-name authors-repo --region us-east-1
aws ecr list-images --repository-name books-repo --region us-east-1
aws ecr list-images --repository-name dashboard-repo --region us-east-1

