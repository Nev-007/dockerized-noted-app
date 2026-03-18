pipeline {
    agent any

    environment {
        DOCKER_USER = "nev007"
        IMAGE_NAME  = "${DOCKER_USER}/notes-backend"
        BUILD_TAG   = "${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main', url: 'https://github.com/Nev-007/dockerized-noted-app.git'
            }
        }

        stage('Build Backend Image') {
            steps {
                sh 'docker build -t $IMAGE_NAME:$BUILD_TAG -t $IMAGE_NAME:latest ./app/backend'
            }
        }

        stage('Push Image') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds',
                    usernameVariable: 'USERNAME',
                    passwordVariable: 'PASSWORD')]) {
                    sh 'echo $PASSWORD | docker login -u $USERNAME --password-stdin'
                    sh 'docker push $IMAGE_NAME:$BUILD_TAG'
                    sh 'docker push $IMAGE_NAME:latest'
                    sh 'docker logout'
                }
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([
                    string(credentialsId: 'mysql-root-password', variable: 'MYSQL_ROOT_PASSWORD'),
                    string(credentialsId: 'db-password',         variable: 'DB_PASSWORD')
                ]) {
                    sh """
                        export MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
                        export DB_PASSWORD=${DB_PASSWORD}
                        export DB_NAME=notesdb
                        export BUILD_TAG=${BUILD_NUMBER}
                        docker compose down --remove-orphans
                        docker compose up -d
                    """
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed! App is Dockerized and running.'
        }
        failure {
            echo 'Pipeline failed. Check the logs above.'
        }
    }
}
