pipeline {
    agent any
    parameters{
        choice(name: 'VERSION', choices: ['1.1.0','1.2.0','1.3.0'], description: '')
        booleanParam(name:'executeTests', defaultValue: true, description: '')
    }

    stages {
        stage('Build') {
            steps {
                echo "Building the app"
                // If your app has a build step, run it
                // For example: npm run build (Next.js, React, Vite, etc.)
            }
        }

        stage('Test') {
            when {
                expression {
                    params.executeTests
                }
            }
            steps {
                echo "TESTING!!!"
            }
        }

        stage('Run Dev Server') {
            steps {
                echo "Deploying the app"
            }
        }
    }
}
